import {Images} from "lucide-react";
import {Separator} from "@/components/ui/separator";
import fs from "fs";
import {useFormatter} from "next-intl";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";

export const ImagePreview = ({image, withFolder}) => {

    const format = useFormatter();
    const file = fs.readFileSync(process.cwd() + "/" + image.path);
    const base = `data:image/png;base64,${file.toString('base64')}`;

    return (
        <div className={"inline-block w-64"}>
            <div className={"border rounded-2xl h-32 mb-4 flex justify-center items-center"}>
                <img src={base} className={"h-28 object-cover rounded-md"} alt={image.name}/>
            </div>
            <p>{image.name}</p>
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
