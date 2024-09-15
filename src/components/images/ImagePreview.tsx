import {Images} from "lucide-react";
import {Separator} from "@/components/ui/separator";
import fs from "fs";
import {useFormatter} from "next-intl";

export const ImagePreview = ({image}) => {

    const format = useFormatter();
    const file = fs.readFileSync(process.cwd() + "/" + image.path);
    const base = `data:image/png;base64,${file.toString('base64')}`;

    return (
        <div className={"inline-block w-64"}>
            <div className={"border rounded-2xl h-32 mb-4 flex justify-center items-center"}>
                <img src={base} className={"h-28 object-cover rounded-md"} alt={image.name}/>
            </div>
            <p>{image.name}</p>
            <div className={"text-sm grid h-4 items-center"} style={{
                gridTemplateColumns: "1fr auto 2fr",
            }}>
                <p className={"opacity-60"}>26 images</p>
                <Separator className="mx-2" orientation="vertical"/>
                <p className={"opacity-60 capitalize truncate"}>{format.dateTime(image.createdAt, {
                    weekday: "long",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                })}</p>
            </div>
        </div>
    )
}
