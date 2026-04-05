import Image from "next/image";

export default function LogoImage({
	color,
	size,
}: {
	readonly color?: "primary" | "secondary" | "white";
	readonly size?: "small" | "medium" | "large";
}) {
	const getSrc = () => {
		if (color === "primary") return "/static/logo.svg";
		if (color === "white") return "/static/logo-icon-white.svg";
		return "/static/logo.svg";
	};

	const getSize = () => {
		if (size === "small") return 24;
		if (size === "medium") return 32;
		if (size === "large") return 40;
		return 32;
	};

	return (
		<div className="flex aspect-square items-center justify-center rounded-lg text-sidebar-primary-foreground">
			<Image src={getSrc()} alt="Echomori" width={getSize()} height={getSize()} />
		</div>
	);
}
