import React, { useCallback } from "react";
import { AdvancedMarker, AdvancedMarkerAnchorPoint, useAdvancedMarkerRef } from "@vis.gl/react-google-maps";

type TreeMarkerProps = {
	readonly position: google.maps.LatLngLiteral;
	readonly featureId: string;
	readonly onMarkerClick: (marker: google.maps.marker.AdvancedMarkerElement | null, featureId: string) => void;
};

export const PoiMarker = ({ position, featureId, onMarkerClick }: TreeMarkerProps) => {
	const [markerRef, marker] = useAdvancedMarkerRef();
	const handleClick = useCallback(() => onMarkerClick?.(marker, featureId), [onMarkerClick, marker, featureId]);

	return (
		<AdvancedMarker
			ref={markerRef}
			position={position}
			onClick={handleClick}
			anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
			className={"marker feature"}
		>
			<div className="bg-primary/50 rounded-full p-1">
				<div className="bg-primary border border-primary rounded-full p-0.5">
					<div className="bg-white rounded-full p-0.5">
						<div className="bg-primary rounded-full p-1" />
					</div>
				</div>
			</div>
		</AdvancedMarker>
	);
};
