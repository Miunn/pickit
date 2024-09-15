import {Separator} from "@/components/ui/separator";
import Link from "next/link";
import {Images} from "lucide-react";
import {useFormatter} from "next-intl";

export default function FolderPreview({folder, locale}: { folder: any, locale: string }) {

    const format = useFormatter();

    return (
        <Link href={`/${locale}/dashboard/folders/${folder.id}`} locale={locale} className={"inline-block w-64"}>
            <div className={"border rounded-2xl bg-gray-100 h-32 mb-4 flex justify-center items-center"}>
                <Images className={"opacity-50"} />
            </div>
            <p>{folder.name}</p>
            <div className={"text-sm grid h-4 items-center"} style={{
                gridTemplateColumns: "1fr auto 2fr",
            }}>
                <p className={"opacity-60"}>26 images</p>
                <Separator className="mx-2" orientation="vertical" />
                <p className={"opacity-60 capitalize truncate"}>{format.dateTime(folder.createdAt, {
                    weekday: "long",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                })}</p>
            </div>
        </Link>
    )
}
