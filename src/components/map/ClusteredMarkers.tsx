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

    const getClusterFolders = useCallback((clusterId: number) => {
      const leaves = getLeaves(clusterId);
      const names = leaves.map((leaf: Feature<Point>) => leaf.properties?.folder.name);
      
      // Count the occurrences of each name
      const counts = names.reduce((acc: Record<string, number>, name) => {
        if (name) {
          acc[name] = (acc[name] || 0) + 1;
        }
        return acc;
      }, {});

      return Object.entries(counts).map(([name, count]) => ({name, count}));
    }, [getLeaves]);
    
    return (
      <>
      {clusters.map((feature: Feature<Point>) => {
        const [lng, lat] = feature.geometry.coordinates;

        const clusterProperties = feature.properties as ClusterProperties;

        if (clusterProperties.cluster) {
          const clusterFolders = getClusterFolders(clusterProperties.cluster_id);

          return (
            <ClusterMarker
              key={feature.id}
              clusterId={clusterProperties.cluster_id}
              position={{lat, lng}}
              size={clusterProperties.point_count}
              onMarkerClick={handleClusterClick}
              folders={clusterFolders}
            />
          );
        }

        return (
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