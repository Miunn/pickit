import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { useCallback, useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { Marker, MarkerClusterer } from "@googlemaps/markerclusterer";
import { Poi } from "./FilesMap";

export default function PoiMarkers(props: { pois: Poi[] }) {
	const map = useMap();
	const [markers, setMarkers] = useState<{ [key: string]: Marker }>({});
	const clusterer = useRef<MarkerClusterer | null>(null);

	// Initialize MarkerClusterer, if the map has changed
	useEffect(() => {
		if (!map) return;
		if (!clusterer.current) {
			clusterer.current = new MarkerClusterer({ map });
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
				return { ...prev, [key]: marker };
			} else {
				const newMarkers = { ...prev };
				delete newMarkers[key];
				return newMarkers;
			}
		});
	};

	const handleClick = useCallback((ev: google.maps.MapMouseEvent) => {
		if (!map) return;
		if (!ev.latLng) return;
		console.log('marker clicked:', ev.latLng.toString());
		map.panTo(ev.latLng);
	}, []);

	return (
		<>
			{props.pois.map((poi: Poi) => (
				<AdvancedMarker
					key={poi.key}
					position={poi.location}
					ref={marker => setMarkerRef(marker, poi.key)}
					onClick={handleClick}
				>
					<div className="w-10 h-10 bg-red-500 rounded-full"></div>
					{/* <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} /> */}
				</AdvancedMarker>
			))}
		</>
	);
};