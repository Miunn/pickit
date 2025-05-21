import React, { useCallback } from 'react';
import {
    AdvancedMarker,
    AdvancedMarkerAnchorPoint,
    useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';
import { useTranslations } from 'next-intl';

type TreeClusterMarkerProps = {
    clusterId: number;
    onMarkerClick?: (
        marker: google.maps.marker.AdvancedMarkerElement,
        clusterId: number
    ) => void;
    position: google.maps.LatLngLiteral;
    size: number;
    sizeAsText: string;
};

export const ClusterMarker = ({
    position,
    size,
    sizeAsText,
    onMarkerClick,
    clusterId
}: TreeClusterMarkerProps) => {
    const t = useTranslations("components.map.cluster");

    const [markerRef, marker] = useAdvancedMarkerRef();
    const handleClick = useCallback(
        () => onMarkerClick && onMarkerClick(marker!, clusterId),
        [onMarkerClick, marker, clusterId]
    );
    const markerSize = Math.floor(48 + Math.sqrt(size) * 2);
    return (
        <AdvancedMarker
            ref={markerRef}
            position={position}
            zIndex={size}
            onClick={handleClick}
            className={'marker cluster'}
            style={{ width: markerSize, height: markerSize }}
            anchorPoint={AdvancedMarkerAnchorPoint.CENTER}>
            <div className="w-48 bg-white border border-primary rounded-lg p-2">
                <div className="flex flex-col gap-2">
                    {/* {foldersNames.slice(0, 2).map((folderName) => (
                        <p key={folderName.name} className="text-sm text-primary font-medium">{folderName.name}</p>
                    ))}
                    {foldersNames.length > 2 && (
                        <p className="text-sm text-primary font-medium">+{foldersNames.length - 2}</p>
                    )} */}

                    Cluster
                </div>
            </div>
            <span>{sizeAsText}</span>
        </AdvancedMarker>
    );
};