'use client'

import { AdvancedMarker, APIProvider, InfoWindow, Map, useMap, AdvancedMarkerAnchorPoint } from '@vis.gl/react-google-maps';
import { useCallback, useEffect, useMemo } from 'react';
import { useState } from 'react';
import { FileWithFolder, FolderWithFilesCount } from '@/lib/definitions';
import ClusteredMarkers from './ClusteredMarkers';
import { Feature, Point, FeatureCollection } from 'geojson';
import { ClusterWindowContent } from './ClusterWindowContent';
import { PoiWindowContent } from './PoiWindowContent';
import FolderList from './FolderList';
import { File } from '@prisma/client';
import MapFileCarousel from './MapFileCarousel';
import { PointFeature } from 'supercluster';

export type Poi = { key: string, location: google.maps.LatLngLiteral }

export type MapFileWithFolderAndUrl = File & { folder: FolderWithFilesCount } & { signedUrl: string };

const filterFilesWithLocation = (files: MapFileWithFolderAndUrl[], selectedFolders: Set<string>) => {
  return files.filter(file => 
    file.latitude && 
    file.longitude &&
    selectedFolders.has(file.folder.id)
  );
}

const getDefaultMarkers = (files: MapFileWithFolderAndUrl[], selectedFolders: Set<string>) => {
  const filteredFiles = filterFilesWithLocation(files, selectedFolders);

  return {
    "type": "FeatureCollection" as const,
    "features": filteredFiles.map(file => ({
      "type": "Feature" as const,
      "id": file.id,
      "geometry": {
        "type": "Point" as const,
        "coordinates": [file.longitude!, file.latitude!]
      },
      "properties": file
    }))
  };
}

export default function FilesMap({ filesWithFolders }: { filesWithFolders: MapFileWithFolderAndUrl[] }) {
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const locatedFiles = useMemo<MapFileWithFolderAndUrl[]>(() => filterFilesWithLocation(filesWithFolders, selectedFolders), [filesWithFolders, selectedFolders]);
  const [markers, setMarkers] = useState<FeatureCollection<Point, MapFileWithFolderAndUrl>>(() => getDefaultMarkers(locatedFiles, selectedFolders));
  const [carouselOpen, setCarouselOpen] = useState<boolean>(false);
  const [carouselStartIndex, setCarouselStartIndex] = useState<number>(0);

  const uniqueLocatedFolders = useMemo(() => {
    return locatedFiles.map(file => file.folder).filter((folder, index, self) =>
      self.findIndex(t => t.id === folder.id) === index
    );
  }, [locatedFiles]);

  const uniqueFolders = useMemo(() => {
    return filesWithFolders.map(file => file.folder).filter((folder, index, self) =>
      self.findIndex(t => t.id === folder.id) === index
    );
  }, [filesWithFolders]);

  const [clusterInfoData, setClusterInfoData] = useState<{
    anchor: google.maps.marker.AdvancedMarkerElement;
    features: PointFeature<MapFileWithFolderAndUrl>[];
  } | null>(null);

  const [poiInfoData, setPoiInfoData] = useState<{
    anchor: google.maps.marker.AdvancedMarkerElement;
    feature: PointFeature<MapFileWithFolderAndUrl>;
  } | null>(null);

  const handleClusterInfoWindowClose = useCallback(
    () => setClusterInfoData(null),
    [setClusterInfoData]
  );

  const handlePoiInfoWindowClose = useCallback(
    () => setPoiInfoData(null),
    [setPoiInfoData]
  );

  const handlePoiClick = useCallback((feature: PointFeature<MapFileWithFolderAndUrl>) => {
    const clickedFile = feature.properties;

    const startIndex = locatedFiles.findIndex(file => file.id === clickedFile.id);
    setCarouselStartIndex(startIndex);
    setCarouselOpen(true);
  }, [locatedFiles]);

  const handleCarouselClose = useCallback(() => {
    setCarouselOpen(false);
  }, []);

  const handleFileChange = useCallback((file: MapFileWithFolderAndUrl) => {
    // Find the marker for this file
    const feature = markers?.features.find(f => f.properties.id === file.id);
    if (feature) {
      // Create a new marker element
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: file.latitude!, lng: file.longitude! }
      });
      
      // Update POI window data
      setPoiInfoData({
        anchor: marker,
        feature
      });
    }
  }, [markers]);

  useEffect(() => {
    const filteredFiles = locatedFiles.filter(file => 
      file.latitude && 
      file.longitude && 
      (selectedFolders.size === 0 || selectedFolders.has(file.folder.id))
    );

    setMarkers({
      "type": "FeatureCollection",
      "features": filteredFiles.map(file => ({
        "type": "Feature",
        "id": file.id,
        "geometry": {
          "type": "Point",
          "coordinates": [file.longitude!, file.latitude!]
        },
        "properties": file
      }))
    });
  }, [locatedFiles, selectedFolders]);

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
      <Map
        mapId={process.env.NEXT_PUBLIC_USER_MAP_ID || ""}
        style={{ position: 'relative', width: '100%', height: '100%' }}
        defaultCenter={{ lat: 22.54992, lng: 0 }}
        defaultZoom={3}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      >
        {markers && (
          <ClusteredMarkers
            markers={markers}
            setClusterInfoData={setClusterInfoData}
            setPoiInfoData={setPoiInfoData}
            onPoiClick={handlePoiClick}
          />
        )}

        {clusterInfoData && (
          <AdvancedMarker
            position={clusterInfoData.anchor.position}
            anchorPoint={AdvancedMarkerAnchorPoint.BOTTOM}
            style={{
              marginBottom: `${clusterInfoData.anchor.getBoundingClientRect().height/2 + 11}px`
            }}
          >
            <ClusterWindowContent folders={clusterInfoData.features.map(feature => {
              return {
                ...feature.properties?.folder,
                coverSignedUrl: filesWithFolders.find(f => f.id === feature.properties?.folder.coverId)?.signedUrl || ''
              }
            })} onClose={handleClusterInfoWindowClose} />
          </AdvancedMarker>
        )}

        {poiInfoData && (
          <AdvancedMarker
            position={poiInfoData.anchor.position}
            anchorPoint={AdvancedMarkerAnchorPoint.BOTTOM}
          >
            <PoiWindowContent file={poiInfoData.feature.properties} onClose={handlePoiInfoWindowClose} />
          </AdvancedMarker>
        )}

        {carouselOpen && (
          <MapFileCarousel
            files={filterFilesWithLocation(locatedFiles, selectedFolders)}
            startIndex={carouselStartIndex}
            onClose={handleCarouselClose}
            onFileChange={handleFileChange}
          />
        )}

        <div className="absolute top-5 right-5">
          <FolderList 
            folders={uniqueFolders} 
            onSelectionChange={setSelectedFolders}
          />
        </div>
      </Map>
    </APIProvider>
  )
}