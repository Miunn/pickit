"use client";

import { ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFilesContext } from "@/context/FilesContext";
import FileThumbnail from "@/components/files/views/grid/FileThumbnail";
import { Link } from "@/i18n/navigation";

export const LastUploadedImages = () => {
	const { files } = useFilesContext();
	const t = useTranslations("pages.dashboard.images");

	return (
		<>
			<h2 className={"font-semibold mb-5"}>{t("lastUploadedImages")}</h2>

			<div
				className={`grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:grid-cols-[repeat(auto-fill,16rem)] gap-3 ${files.length === 0 && "justify-center"}`}
			>
				{files.length === 0 ? (
					<div className={"col-span-full flex flex-col justify-center items-center"}>
						<ImageOff className={"w-32 h-32 opacity-20"} />
						<p>{t("empty")}</p>
					</div>
				) : (
					files.map(file => (
						<Link
							key={file.id}
							href={`/app/folders/${file.folder.slug}#${file.id}`}
						>
							<FileThumbnail file={file} />
						</Link>
					))
				)}
			</div>
		</>
	);
};
