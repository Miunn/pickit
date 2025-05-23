import { Folder } from "@prisma/client";
import { Images } from "lucide-react";
import Image from "next/image";
import { TooltipContent, TooltipProvider } from "../ui/tooltip";
import { TooltipTrigger } from "../ui/tooltip";
import { Tooltip } from "../ui/tooltip";
import { Separator } from "../ui/separator";
import { useFormatter } from "next-intl";

export default function FolderList({ folders }: { folders: Folder[] }) {

    const formatter = useFormatter();

    return (
        <div className="flex flex-col gap-2">
            {folders.map((folder) => (
                <div className={"inline-block w-64 bg-white border border-primary rounded-xl"} key={folder.id}>
                    {folder.coverId
                        ? <div className={`relative h-36 mb-1 flex justify-center items-center rounded-t-xl`}>
                            <Image src={`/api/folders/${folder.id}/images/${folder.coverId}`} alt={folder.name}
                                className={"relative rounded-t-xl object-cover"} sizes="33vw" fill />
                        </div>
                        : <div
                            className={"rounded-t-xl bg-gray-100 dark:bg-gray-800 h-36 mb-1 flex justify-center items-center"}>
                            <Images className={"opacity-50 dark:text-gray-400"} />
                        </div>
                    }
                    <p className="truncate px-2">{folder.name}</p>
                    <div className={"text-sm flex h-4 items-center flex-nowrap px-2 mb-2"}>
                        <p className={"opacity-60 text-nowrap"}>22</p>
                        <Separator className="mx-2" orientation="vertical" />
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className={"opacity-60 capitalize truncate"}>{formatter.dateTime(folder.createdAt, {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className={"capitalize"}>{formatter.dateTime(folder.createdAt, {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "numeric",
                                        minute: "numeric",
                                    })}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            ))}
        </div>
    )
}