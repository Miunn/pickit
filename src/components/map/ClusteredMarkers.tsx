import { useSupercluster } from "@/hooks/use-supercluster";
import Supercluster, { ClusterProperties } from 'supercluster';
import { Feature, FeatureCollection, GeoJsonProperties, Point } from "geojson";
import { useTranslations } from "next-intl";
import { useCallback, useEffect } from "react";
import { ClusterMarker } from "./ClusterMarker";
import { PoiMarker } from "./PoiMarker";

type ClusteredMarkersProps = {
  markers: FeatureCollection<Point>;
  setInfowindowData: (
    data: {
      anchor: google.maps.marker.AdvancedMarkerElement;
      features: Feature<Point>[];
    } | null
  ) => void;
};

const superclusterOptions: Supercluster.Options<
  GeoJsonProperties,
  ClusterProperties
> = {
  extent: 256,
  radius: 80,
  maxZoom: 12
};

export default function ClusteredMarkers({
  markers,
  setInfowindowData
}: ClusteredMarkersProps) {
    const {clusters, getLeaves} = useSupercluster(markers, superclusterOptions);
  
    const handleClusterClick = useCallback(
      (marker: google.maps.marker.AdvancedMarkerElement, clusterId: number) => {
        const leaves = getLeaves(clusterId);
  
        setInfowindowData({anchor: marker, features: leaves});
      },
      [getLeaves, setInfowindowData]
    );
  
    const handleMarkerClick = useCallback(
      (marker: google.maps.marker.AdvancedMarkerElement, featureId: string) => {
        const feature = clusters.find(
          (feat: Feature<Point>) => feat.id === featureId
        ) as Feature<Point>;
  
        setInfowindowData({anchor: marker, features: [feature]});
      },
      [clusters, setInfowindowData]
    );
    
    return (
      <>
      {clusters.map((feature: Feature<Point>) => {
        const [lng, lat] = feature.geometry.coordinates;

        const clusterProperties = feature.properties as ClusterProperties;
        const isCluster: boolean = clusterProperties.cluster;

        return isCluster ? (
          <ClusterMarker
            key={feature.id}
            clusterId={clusterProperties.cluster_id}
            position={{lat, lng}}
            size={clusterProperties.point_count}
            sizeAsText={String(clusterProperties.point_count_abbreviated)}
            onMarkerClick={handleClusterClick}
          />
        ) : (
          <PoiMarker
            key={feature.id}
            featureId={feature.id as string}
            position={{lat, lng}}
            onMarkerClick={handleMarkerClick}
          />
        );
      })}
    </>
    )
}