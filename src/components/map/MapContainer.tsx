'use client'

import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Marker } from '@googlemaps/markerclusterer';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useState } from 'react';
import PoiMarkers from './PoiMarkers';

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

export default function MapContainer() {
    const map = useMap();
    const [markers, setMarkers] = useState<{[key: string]: Marker}>({});
    const clusterer = useRef<MarkerClusterer | null>(null);
  
    // Initialize MarkerClusterer, if the map has changed
    useEffect(() => {
      if (!map) return;
      if (!clusterer.current) {
        clusterer.current = new MarkerClusterer({map});
      }
    }, [map]);
  
    // Update markers, if the markers array has changed
    useEffect(() => {
      clusterer.current?.clearMarkers();
      clusterer.current?.addMarkers(Object.values(markers));
    }, [markers]);
  
    const setMarkerRef = (marker: Marker | null, key: string) => {
      if (marker && markers[key]) return;
      if (!marker && !markers[key]) return;
  
      setMarkers(prev => {
        if (marker) {
          return {...prev, [key]: marker};
        } else {
          const newMarkers = {...prev};
          delete newMarkers[key];
          return newMarkers;
        }
      });
    };
    
    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
            <Map
                mapId={process.env.NEXT_PUBLIC_USER_MAP_ID || ""}
                style={{ width: '100%', height: '100%' }}
                defaultCenter={{ lat: 22.54992, lng: 0 }}
                defaultZoom={3}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
            >
                <PoiMarkers pois={locations} />
            </Map>
        </APIProvider>
    )
}