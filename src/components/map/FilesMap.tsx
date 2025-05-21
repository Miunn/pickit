'use client'

import { APIProvider, InfoWindow, Map, useMap } from '@vis.gl/react-google-maps';
import { useCallback, useEffect } from 'react';
import { useState } from 'react';
import PoiMarkers from './PoiMarkers';
import { FileWithFolder } from '@/lib/definitions';
import ClusteredMarkers from './ClusteredMarkers';
import { Feature, Point, FeatureCollection } from 'geojson';
import { InfoWindowContent } from './InfoWindowContent';

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

export default function FilesMap({ filesWithFolders }: { filesWithFolders: FileWithFolder[] }) {

  const [markers, setMarkers] = useState<FeatureCollection<Point, FileWithFolder> | null>({
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "id": "Q28163226",
        "geometry": {
          "type": "Point",
          "coordinates": [-71.5618959, -33.0217629]
        },
        "properties": {
          ...filesWithFolders[0]
        }
      }
    ]
  });

  const [infowindowData, setInfowindowData] = useState<{
    anchor: google.maps.marker.AdvancedMarkerElement;
    features: Feature<Point>[];
  } | null>(null);

  const handleInfoWindowClose = useCallback(
    () => setInfowindowData(null),
    [setInfowindowData]
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
            setInfowindowData={setInfowindowData}
          />
        )}

        {infowindowData && (
          <InfoWindow
            onCloseClick={handleInfoWindowClose}
            anchor={infowindowData.anchor}>
            <InfoWindowContent features={infowindowData.features} />
          </InfoWindow>
        )}
        {/* <PoiMarkers pois={markers} />
        <div className="absolute top-10 left-10 h-10">
          <ClusteredMarkers foldersNames={[
            { name: "Folder", count: 10 },
            { name: "Folder", count: 10 },
            { name: "Folder", count: 10 },
            { name: "Folder", count: 10 },
            { name: "Folder", count: 10 },
            { name: "Folder", count: 10 },
            { name: "Folder", count: 10 },
          ]} />
        </div> */}
      </Map>
    </APIProvider>
  )
}