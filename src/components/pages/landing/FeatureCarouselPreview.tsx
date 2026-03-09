"use client";

import React from "react";
import FeatureCard from "@/components/pages/landing/FeatureCard";

const FEATURES = [
	{
		key: "section1",
		title: "section1.title",
		description: "section1.description",
		videoSrc: "/static/videos/features/new-folder-en.mp4",
	},
	{
		key: "section2",
		title: "section2.title",
		description: "section2.description",
		videoSrc: "/static/videos/features/upload-en.mp4",
	},
	// {
	// 	key: "section3",
	// 	title: "section3.title",
	// 	description: "section3.description",
	// 	videoSrc: "/static/videos/features/share-en.mp4",
	// },
	{
		key: "section4",
		title: "section4.title",
		description: "section4.description",
		videoSrc: "/static/videos/features/share-en.mp4",
	},
];

export default function FeatureCarouselPreview() {
	const [expandedIndex, setExpandedIndex] = React.useState<number>(0);
	const progressRefs = React.useRef<Array<React.RefObject<HTMLDivElement | null>>>([]);
	const sourceRef = React.useRef<HTMLSourceElement | null>(null);

	// Initialize refs array on mount
	React.useEffect(() => {
		progressRefs.current = new Array(4).fill(null).map(() => React.createRef<HTMLDivElement>());
	}, []);

	React.useEffect(() => {
		if (progressRefs.current[expandedIndex]?.current) {
			progressRefs.current[expandedIndex].current?.classList.add("animate-progress");
		}

		progressRefs.current.forEach((ref, index) => {
			if (index !== expandedIndex && ref.current) {
				ref.current.classList.remove("animate-progress");
			}
		});
	}, [expandedIndex, progressRefs]);

	React.useEffect(() => {
		console.log("Current expanded index:", expandedIndex);
		if (sourceRef.current) {
			sourceRef.current.src = FEATURES[expandedIndex].videoSrc;
			const videoElement = sourceRef.current.parentElement as HTMLVideoElement;
			videoElement.load();
			videoElement.play();
		}
	}, [expandedIndex]);

	return (
		<div className="flex flex-col xl:grid xl:grid-cols-2 gap-6 min-h-[444px]">
			<div className="flex flex-col gap-3">
				{FEATURES.map((feature, index) => (
					<FeatureCard
						key={feature.key}
						step={index + 1}
						title={feature.title}
						description={feature.description}
						isExpanded={expandedIndex === index}
						onClick={() => setExpandedIndex(index)}
						progressRef={progressRefs.current[index]}
						onProgressEnd={() => setExpandedIndex((index + 1) % FEATURES.length)}
					/>
				))}
			</div>
			<div className="w-full h-fit border border-gray-200 rounded-lg">
				<video className="w-full h-full object-cover rounded-lg" autoPlay loop muted>
					<source
						ref={sourceRef}
						src={FEATURES[expandedIndex].videoSrc}
						type="video/mp4"
					/>
					Your browser does not support the video tag.
				</video>
			</div>
		</div>
	);
}
