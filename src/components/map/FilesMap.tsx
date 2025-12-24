"use client";

import { AdvancedMarker, APIProvider, Map, AdvancedMarkerAnchorPoint } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo } from "react";
import { useState } from "react";
import { FileWithFolder } from "@/lib/definitions";
import ClusteredMarkers from "./ClusteredMarkers";
import { Point, FeatureCollection } from "geojson";
import ClusterWindowContent from "./ClusterWindowContent";
import { PoiWindowContent } from "./PoiWindowContent";
import MapFileCarousel from "./MapFileCarousel";
import { PointFeature } from "supercluster";
import { useFilesContext } from "@/context/FilesContext";
import FoldersList from "./FoldersList";
import { useTheme } from "next-themes";

const filterFilesWithLocation = (files: FileWithFolder[], selectedFolders: Set<string>) => {
    return files.filter(file => file.latitude && file.longitude && selectedFolders.has(file.folder.id));
};

const getDefaultMarkers = (files: FileWithFolder[], selectedFolders: Set<string>) => {
    const filteredFiles = filterFilesWithLocation(files, selectedFolders);

    return {
        type: "FeatureCollection" as const,
        features: filteredFiles.map(file => ({
            type: "Feature" as const,
            id: file.id,
            geometry: {
                type: "Point" as const,
                coordinates: [file.longitude!, file.latitude!],
            },
            properties: file,
        })),
    };
};

/**
 * Renders an interactive Google Map displaying files as markers with folder-based filtering, cluster and POI info windows, and an in-map file carousel.
 *
 * The component reads files from context and derives unique folders for a folder-selection control. Files that include latitude/longitude are shown as markers; clicking a marker opens a file carousel at the corresponding file, interacting with clusters opens a cluster info window that lists folders and their cover images, and selecting a file from the carousel centers an individual POI info window. The map adapts its color scheme to the current theme.
 *
 * @returns The component's React element tree representing the map and its UI overlays (markers, info windows, carousel, and folder list).
 */
export default function FilesMap() {
    const { resolvedTheme = "light" } = useTheme();
    const { files } = useFilesContext();

    const uniqueFolders = useMemo(() => {
        return files
            .map(file => file.folder)
            .filter((folder, index, self) => self.findIndex(t => t.id === folder.id) === index);
    }, [files]);

    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(
        new Set(uniqueFolders.map(folder => folder.id))
    );
    const locatedFiles = useMemo<FileWithFolder[]>(
        () => filterFilesWithLocation(files, selectedFolders),
        [files, selectedFolders]
    );
    const [markers, setMarkers] = useState<FeatureCollection<Point, FileWithFolder>>(() =>
        getDefaultMarkers(locatedFiles, selectedFolders)
    );
    const [carouselOpen, setCarouselOpen] = useState<boolean>(false);
    const [carouselStartIndex, setCarouselStartIndex] = useState<number>(0);

    const [clusterInfoData, setClusterInfoData] = useState<{
        anchor: google.maps.marker.AdvancedMarkerElement;
        features: PointFeature<FileWithFolder>[];
    } | null>(null);

    const [poiInfoData, setPoiInfoData] = useState<{
        anchor: google.maps.marker.AdvancedMarkerElement;
        feature: PointFeature<FileWithFolder>;
    } | null>(null);

    const handleClusterInfoWindowClose = useCallback(() => setClusterInfoData(null), [setClusterInfoData]);

    const handlePoiInfoWindowClose = useCallback(() => setPoiInfoData(null), [setPoiInfoData]);

    const handlePoiClick = useCallback(
        (feature: PointFeature<FileWithFolder>) => {
            const clickedFile = feature.properties;

            const startIndex = locatedFiles.findIndex(file => file.id === clickedFile.id);
            setCarouselStartIndex(startIndex);
            setCarouselOpen(true);
        },
        [locatedFiles]
    );

    const handleCarouselClose = useCallback(() => {
        setCarouselOpen(false);
    }, []);

    const handleFileChange = useCallback(
        (file: FileWithFolder) => {
            // Find the marker for this file
            const feature = markers?.features.find(f => f.properties.id === file.id);
            if (feature) {
                // Create a new marker element
                const marker = new google.maps.marker.AdvancedMarkerElement({
                    position: { lat: file.latitude!, lng: file.longitude! },
                });

                // Update POI window data
                setPoiInfoData({
                    anchor: marker,
                    feature,
                });
            }
        },
        [markers]
    );

    useEffect(() => {
        const filteredFiles = locatedFiles.filter(
            file =>
                file.latitude && file.longitude && (selectedFolders.size === 0 || selectedFolders.has(file.folder.id))
        );

        setMarkers({
            type: "FeatureCollection",
            features: filteredFiles.map(file => ({
                type: "Feature",
                id: file.id,
                geometry: {
                    type: "Point",
                    coordinates: [file.longitude!, file.latitude!],
                },
                properties: file,
            })),
        });
    }, [locatedFiles, selectedFolders]);

    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
            <Map
                mapId={process.env.NEXT_PUBLIC_USER_MAP_ID || ""}
                mapTypeControl={true}
                colorScheme={resolvedTheme === "dark" ? "DARK" : "LIGHT"}
                defaultCenter={{ lat: 22.54992, lng: 0 }}
                defaultZoom={3}
                gestureHandling={"greedy"}
                disableDefaultUI={true}
            >
                {markers && (
                    <ClusteredMarkers
                        markers={markers}
                        setClusterInfoData={setClusterInfoData}
                        setPoiInfoData={setPoiInfoData}
                        onPoiClick={handlePoiClick}
                    />
                )}

                {clusterInfoData && (
                    <AdvancedMarker
                        position={clusterInfoData.anchor.position}
                        anchorPoint={AdvancedMarkerAnchorPoint.BOTTOM}
                        style={{
                            marginBottom: `${clusterInfoData.anchor.getBoundingClientRect().height / 2 + 11}px`,
                        }}
                    >
                        <ClusterWindowContent
                            folders={clusterInfoData.features.map(feature => feature.properties.folder)}
                            onClose={handleClusterInfoWindowClose}
                        />
                    </AdvancedMarker>
                )}

                {poiInfoData && (
                    <AdvancedMarker
                        position={poiInfoData.anchor.position}
                        anchorPoint={["50%", "101.5%"]}
                        style={{ zIndex: 1000 }}
                    >
                        <PoiWindowContent file={poiInfoData.feature.properties} onClose={handlePoiInfoWindowClose} />
                    </AdvancedMarker>
                )}

                {carouselOpen && (
                    <MapFileCarousel
                        files={filterFilesWithLocation(locatedFiles, selectedFolders)}
                        startIndex={carouselStartIndex}
                        onClose={handleCarouselClose}
                        onFileChange={handleFileChange}
                    />
                )}
                {uniqueFolders.length > 0 && (
                    <div className="absolute top-3 right-3">
                        <FoldersList folders={uniqueFolders} onSelectionChange={setSelectedFolders} />
                    </div>
                )}
            </Map>
        </APIProvider>
    );
}
