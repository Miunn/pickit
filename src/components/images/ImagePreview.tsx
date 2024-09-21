import {Separator} from "@/components/ui/separator";
import {useFormatter} from "next-intl";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import React from "react";
import Image from "next/image";

export const ImagePreview = ({image, folder, withFolder}) => {

    const format = useFormatter();

    return (
        <div className={"inline-block w-64"}>
            <div className={"border rounded-2xl h-32 mb-4 flex justify-center items-center"}>
                <Image src={`/api/folders/${folder.id}/images/${image.id}`} alt={image.name} className={"h-28 object-contain rounded-md"} width={256} height={112} />
            </div>
            <p className={"text-start"}>{image.name}</p>
            <div className={"text-sm h-4 flex items-center"}>
                {(withFolder ?? false)
                    ? <>
                        <p className={"opacity-60"}>{image.folder.name}</p>
                        <Separator className="mx-2" orientation="vertical"/>
                    </>
                    : null
                }
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p className={"text-sm opacity-60 capitalize truncate"}>{format.dateTime(image.createdAt, {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                            })}</p>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className={"text-sm opacity-60 capitalize truncate"}>{format.dateTime(image.createdAt, {
                                weekday: "long",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "numeric",
                                minute: "numeric"
                            })}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    )
}
