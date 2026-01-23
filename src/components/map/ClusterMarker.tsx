import React, { useCallback, useMemo } from "react";
import { AdvancedMarker, AdvancedMarkerAnchorPoint, useAdvancedMarkerRef } from "@vis.gl/react-google-maps";
import { useTranslations } from "next-intl";
import { BookImage } from "lucide-react";

type TreeClusterMarkerProps = {
	readonly clusterId: number;
	readonly onMarkerClick?: (marker: google.maps.marker.AdvancedMarkerElement | null, clusterId: number) => void;
	readonly position: google.maps.LatLngLiteral;
	readonly size: number;
	readonly folders: { name: string; count: number }[];
};

export const ClusterMarker = ({ position, size, onMarkerClick, clusterId, folders }: TreeClusterMarkerProps) => {
	const t = useTranslations("components.map.cluster");

	const [markerRef, marker] = useAdvancedMarkerRef();
	const handleClick = useCallback(() => onMarkerClick?.(marker, clusterId), [onMarkerClick, marker, clusterId]);

	const totalCount = useMemo(() => folders.reduce((acc, folder) => acc + folder.count, 0), [folders]);

	return (
		<AdvancedMarker
			ref={markerRef}
			position={position}
			zIndex={size}
			onClick={handleClick}
			anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
		>
			<div className="bg-white rounded-full border border-primary size-16 flex flex-col justify-center items-center gap-1">
				<BookImage className="size-6" />

				<p className="text-xs text-primary font-medium">
					{t("folder.count", { count: totalCount > 999 ? "999+" : totalCount })}
				</p>
			</div>
		</AdvancedMarker>
	);
};
