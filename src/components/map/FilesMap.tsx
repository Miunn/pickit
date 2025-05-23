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
import FileCarousel from './FileCarousel';

export type Poi = { key: string, location: google.maps.LatLngLiteral }

export default function FilesMap({ filesWithFolders }: { filesWithFolders: (File & { folder: FolderWithFilesCount } & { signedUrl: string })[] }) {

  const [markers, setMarkers] = useState<FeatureCollection<Point, FileWithFolder & { signedUrl: string }> | null>();
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [carouselOpen, setCarouselOpen] = useState<boolean>(false);
  const [carouselStartIndex, setCarouselStartIndex] = useState<number>(0);

  const uniqueFolders = useMemo(() => {
    return filesWithFolders.map(file => file.folder).filter((folder, index, self) =>
      self.findIndex(t => t.id === folder.id) === index
    );
  }, [filesWithFolders]);

  const [clusterInfoData, setClusterInfoData] = useState<{
    anchor: google.maps.marker.AdvancedMarkerElement;
    features: (Feature<Point, FileWithFolder & { signedUrl: string }>)[];
  } | null>(null);

  const [poiInfoData, setPoiInfoData] = useState<{
    anchor: google.maps.marker.AdvancedMarkerElement;
    feature: Feature<Point, FileWithFolder & { signedUrl: string }>;
  } | null>(null);

  const handleClusterInfoWindowClose = useCallback(
    () => setClusterInfoData(null),
    [setClusterInfoData]
  );

  const handlePoiInfoWindowClose = useCallback(
    () => setPoiInfoData(null),
    [setPoiInfoData]
  );

  const handlePoiClick = useCallback((feature: Feature<Point, FileWithFolder & { signedUrl: string }>) => {
    const clickedFile = feature.properties;

    const startIndex = filesWithFolders.findIndex(file => file.id === clickedFile.id);
    setCarouselStartIndex(startIndex);
    setCarouselOpen(true);
  }, [filesWithFolders]);

  const handleCarouselClose = useCallback(() => {
    setCarouselOpen(false);
  }, []);

  useEffect(() => {
    const filteredFiles = filesWithFolders.filter(file => 
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
  }, [filesWithFolders, selectedFolders]);

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
          <FileCarousel
            files={filesWithFolders}
            startIndex={carouselStartIndex}
            onClose={handleCarouselClose}
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