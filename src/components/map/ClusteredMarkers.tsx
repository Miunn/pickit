import { useSupercluster } from "@/hooks/use-supercluster";
import Supercluster, { PointFeature, ClusterProperties } from "supercluster";
import { Feature, FeatureCollection, GeoJsonProperties, Point } from "geojson";
import { useCallback } from "react";
import { ClusterMarker } from "./ClusterMarker";
import { PoiMarker } from "./PoiMarker";
import { FileWithFolder } from "@/lib/definitions";

type ClusteredMarkersProps = {
    markers: FeatureCollection<Point, FileWithFolder>;
    setClusterInfoData: (
        data: {
            anchor: google.maps.marker.AdvancedMarkerElement;
            features: PointFeature<FileWithFolder>[];
        } | null
    ) => void;
    setPoiInfoData: (
        data: {
            anchor: google.maps.marker.AdvancedMarkerElement;
            feature: PointFeature<FileWithFolder>;
        } | null
    ) => void;
    onPoiClick: (feature: PointFeature<FileWithFolder>) => void;
};

const superclusterOptions: Supercluster.Options<GeoJsonProperties, ClusterProperties> = {
    extent: 512,
    radius: 160,
    maxZoom: 10,
};

export default function ClusteredMarkers({
    markers,
    setClusterInfoData,
    setPoiInfoData,
    onPoiClick,
}: ClusteredMarkersProps) {
    const { clusters, getLeaves } = useSupercluster<FileWithFolder>(markers, superclusterOptions);

    const handleClusterClick = useCallback(
        (marker: google.maps.marker.AdvancedMarkerElement, clusterId: number) => {
            const leaves = getLeaves(clusterId);

            setClusterInfoData({ anchor: marker, features: leaves });
        },
        [getLeaves, setClusterInfoData]
    );

    const handlePoiClick = useCallback(
        (marker: google.maps.marker.AdvancedMarkerElement, featureId: string) => {
            const feature = markers.features.find(f => f.id === featureId);
            if (feature) {
                setPoiInfoData({
                    anchor: marker,
                    feature,
                });
                onPoiClick(feature);
            }
        },
        [markers, setPoiInfoData, onPoiClick]
    );

    const getClusterFolders = useCallback(
        (clusterId: number) => {
            const leaves = getLeaves(clusterId);
            const names = leaves.map((leaf: Feature<Point>) => leaf.properties?.folder.name);

            // Count the occurrences of each name
            const counts = names.reduce((acc: Record<string, number>, name) => {
                if (name) {
                    acc[name] = (acc[name] || 0) + 1;
                }
                return acc;
            }, {});

            return Object.entries(counts).map(([name, count]) => ({ name, count }));
        },
        [getLeaves]
    );

    return (
        <>
            {clusters.map(feature => {
                const [lng, lat] = feature.geometry.coordinates;

                if ("cluster" in feature.properties) {
                    const clusterProperties = feature.properties as ClusterProperties;
                    const clusterFolders = getClusterFolders(clusterProperties.cluster_id);

                    return (
                        <ClusterMarker
                            key={feature.id}
                            clusterId={clusterProperties.cluster_id}
                            position={{ lat, lng }}
                            size={clusterProperties.point_count}
                            onMarkerClick={handleClusterClick}
                            folders={clusterFolders}
                        />
                    );
                }

                return (
                    <PoiMarker
                        key={feature.id}
                        featureId={feature.id?.toString() || ""}
                        position={{ lat, lng }}
                        onMarkerClick={handlePoiClick}
                    />
                );
            })}
        </>
    );
}
