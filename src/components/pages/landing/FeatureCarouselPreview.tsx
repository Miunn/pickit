"use client";

import React from "react";
import Feature1 from "@/components/pages/landing/features-cards/Feature1";
import Feature2 from "@/components/pages/landing/features-cards/Feature2";
import Feature3 from "@/components/pages/landing/features-cards/Feature3";
import Feature4 from "@/components/pages/landing/features-cards/Feature4";

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
				<Feature1
					isExpanded={expandedIndex === 0}
					onClick={() => setExpandedIndex(0)}
					progressRef={progressRefs.current[0]}
					onProgressEnd={() => setExpandedIndex(1)}
				/>

				<Feature2
					isExpanded={expandedIndex === 1}
					onClick={() => setExpandedIndex(1)}
					progressRef={progressRefs.current[1]}
					onProgressEnd={() => setExpandedIndex(2)}
				/>

				<Feature3
					isExpanded={expandedIndex === 2}
					onClick={() => setExpandedIndex(2)}
					progressRef={progressRefs.current[2]}
					onProgressEnd={() => setExpandedIndex(3)}
				/>

				<Feature4
					isExpanded={expandedIndex === 3}
					onClick={() => setExpandedIndex(3)}
					progressRef={progressRefs.current[3]}
					onProgressEnd={() => setExpandedIndex(0)}
				/>
			</div>
			<div className="w-full h-96 border border-gray-200 rounded-lg"></div>
		</div>
	);
}
