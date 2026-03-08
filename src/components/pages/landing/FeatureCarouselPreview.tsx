"use client";

import React from "react";
import FeatureCard from "@/components/pages/landing/FeatureCard";

const FEATURES = [
	{
		title: "section1.title",
		description: "section1.description",
	},
	{
		title: "section2.title",
		description: "section2.description",
	},
	{
		title: "section3.title",
		description: "section3.description",
	},
	{
		title: "section4.title",
		description: "section4.description",
	},
];

export default function FeatureCarouselPreview() {
	const [expandedIndex, setExpandedIndex] = React.useState<number>(0);
	const progressRefs = React.useRef<Array<React.RefObject<HTMLDivElement | null>>>([]);

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

	return (
		<div className="flex flex-col xl:grid xl:grid-cols-2 gap-6 min-h-[444px]">
			<div className="flex flex-col gap-3">
				{FEATURES.map((feature, index) => (
					<FeatureCard
						key={index}
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
					<source src="/static/videos/features/new-folder-en.mp4" type="video/mp4" />
					Your browser does not support the video tag.
				</video>
			</div>
		</div>
	);
}
