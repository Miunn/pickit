import React, { useCallback, useMemo } from 'react';
import {
    AdvancedMarker,
    AdvancedMarkerAnchorPoint,
    useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { BookImage } from 'lucide-react';

type TreeClusterMarkerProps = {
    clusterId: number;
    onMarkerClick?: (
        marker: google.maps.marker.AdvancedMarkerElement,
        clusterId: number
    ) => void;
    position: google.maps.LatLngLiteral;
    size: number;
    folders: { name: string, count: number }[];
};

export const ClusterMarker = ({
    position,
    size,
    onMarkerClick,
    clusterId,
    folders
}: TreeClusterMarkerProps) => {
    const t = useTranslations("components.map.cluster");

    const [markerRef, marker] = useAdvancedMarkerRef();
    const handleClick = useCallback(
        () => onMarkerClick && onMarkerClick(marker!, clusterId),
        [onMarkerClick, marker, clusterId]
    );

    const totalCount = useMemo(() => folders.reduce((acc, folder) => acc + folder.count, 0), [folders]);

    return (
        <AdvancedMarker
            ref={markerRef}
            position={position}
            zIndex={size}
            onClick={handleClick}
            anchorPoint={AdvancedMarkerAnchorPoint.CENTER}>
            {/* <div className="w-40 max-h-48 bg-white border border-primary rounded-lg">
                <div className="flex flex-col">
                    {folders.slice(0, 2).map((folder, index) => (
                        <p key={folder.name} className={cn(
                            "text-xs text-primary font-medium flex justify-between items-center gap-2 p-1",
                            index !== folders.slice(0, 2).length - 1 && "border-b border-primary"
                        )}>
                            <span>{folder.name}</span>
                            <span className="text-xs text-gray-500">{t('folder.count', {count: folder.count})}</span>
                        </p>
                    ))}
                    {folders.length > 2 && (
                        <p className="text-sm text-primary font-medium">+{folders.length - 2}</p>
                    )}
                </div>
            </div> */}

            <div className='bg-white rounded-full border border-primary size-16 flex flex-col justify-center items-center gap-1'>
                <BookImage className='size-6' />

                <p className='text-xs text-primary font-medium'>{t('folder.count', {count: totalCount > 999 ? '999+' : totalCount})}</p>
            </div>
        </AdvancedMarker>
    );
};