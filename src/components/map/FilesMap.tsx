'use client'

import { AdvancedMarker, APIProvider, InfoWindow, Map, useMap, AdvancedMarkerAnchorPoint } from '@vis.gl/react-google-maps';
import { useCallback, useEffect, useMemo } from 'react';
import { useState } from 'react';
import { FileWithFolder } from '@/lib/definitions';
import ClusteredMarkers from './ClusteredMarkers';
import { Feature, Point, FeatureCollection } from 'geojson';
import { ClusterWindowContent } from './ClusterWindowContent';
import { PoiWindowContent } from './PoiWindowContent';
import FolderList from './FolderList';

export type Poi = { key: string, location: google.maps.LatLngLiteral }
const locations: Poi[] = [
  { key: 'operaHouse', location: { lat: -33.8567844, lng: 151.213108 } },
  { key: 'tarongaZoo', location: { lat: -33.8472767, lng: 151.2188164 } },
  { key: 'manlyBeach', location: { lat: -33.8209738, lng: 151.2563253 } },
  { key: 'hyderPark', location: { lat: -33.8690081, lng: 151.2052393 } },
  { key: 'theRocks', location: { lat: -33.8587568, lng: 151.2058246 } },
  { key: 'circularQuay', location: { lat: -33.858761, lng: 151.2055688 } },
  { key: 'harbourBridge', location: { lat: -33.852228, lng: 151.2038374 } },
  { key: 'kingsCross', location: { lat: -33.8737375, lng: 151.222569 } },
  { key: 'botanicGardens', location: { lat: -33.864167, lng: 151.216387 } },
  { key: 'museumOfSydney', location: { lat: -33.8636005, lng: 151.2092542 } },
  { key: 'maritimeMuseum', location: { lat: -33.869395, lng: 151.198648 } },
  { key: 'kingStreetWharf', location: { lat: -33.8665445, lng: 151.1989808 } },
  { key: 'aquarium', location: { lat: -33.869627, lng: 151.202146 } },
  { key: 'darlingHarbour', location: { lat: -33.87488, lng: 151.1987113 } },
  { key: 'barangaroo', location: { lat: - 33.8605523, lng: 151.1972205 } },
];

export default function FilesMap({ filesWithFolders }: { filesWithFolders: (FileWithFolder & { signedUrl: string })[] }) {

  const [markers, setMarkers] = useState<FeatureCollection<Point, FileWithFolder & { signedUrl: string }> | null>();

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

  useEffect(() => {
    setMarkers({
      "type": "FeatureCollection",
      "features": filesWithFolders.filter(file => file.latitude && file.longitude).map(file => ({
        "type": "Feature",
        "id": file.id,
        "geometry": {
          "type": "Point",
          "coordinates": [file.longitude!, file.latitude!]
        },
        "properties": file
      }))
    });
  }, [filesWithFolders]);

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

        <div className="absolute top-5 right-5">
          <FolderList folders={uniqueFolders} />
        </div>
      </Map>
    </APIProvider>
  )
}