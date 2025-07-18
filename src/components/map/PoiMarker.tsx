import React, {useCallback} from 'react';
import {
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
  useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';
import { Aperture } from 'lucide-react';

type TreeMarkerProps = {
  position: google.maps.LatLngLiteral;
  featureId: string;
  onMarkerClick: (
    marker: google.maps.marker.AdvancedMarkerElement,
    featureId: string
  ) => void;
};

export const PoiMarker = ({
  position,
  featureId,
  onMarkerClick
}: TreeMarkerProps) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const handleClick = useCallback(
    () => onMarkerClick && onMarkerClick(marker!, featureId),
    [onMarkerClick, marker, featureId]
  );

  return (
    <AdvancedMarker
      ref={markerRef}
      position={position}
      onClick={handleClick}
      anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
      className={'marker feature'}>
      <div className="bg-white border border-primary rounded-full p-1">
        <Aperture className='size-6' />
      </div>
    </AdvancedMarker>
  );
};