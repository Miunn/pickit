import {Button} from "@/components/ui/button";
import {CircleUserRound, Folder, Home, Link as LinkIcon} from "lucide-react";
import Link from "next/link";

export default function RailBar({locale}: { locale: string }) {
    return (
        <aside className="flex flex-col h-screen w-64 bg-gray-200 p-4 space-y-10 fixed top-0 left-0">
            <Button variant="ghost" className={"flex gap-2 p-2 w-full text-start justify-start h-fit"}>
                <CircleUserRound/>

                <div className={"space-y-px"}>
                    <p className={"font-semibold"}>Dummy</p>
                    <p className={"opacity-60"}>exemple@mail.com</p>
                </div>
            </Button>

            <div className={"space-y-2"}>
                <Button variant="ghost"
                        className={"flex items-center gap-2 p-2 w-full text-start justify-start h-fit opacity-80 hover:opacity-100"} asChild>
                    <Link href={`/${locale}/dashboard`}>
                        <Home/> Home
                    </Link>
                </Button>
                <Button variant="ghost"
                        className={"flex items-center gap-2 p-2 w-full text-start justify-start h-fit opacity-80 hover:opacity-100"} asChild>
                    <Link href={`/${locale}/dashboard/folders`}>
                        <Folder/> Folders
                    </Link>
                </Button>
                <Button variant="ghost"
                        className={"flex items-center gap-2 p-2 w-full text-start justify-start h-fit opacity-80 hover:opacity-100"} asChild>
                    <Link href={`/${locale}/dashboard/links`}>
                        <LinkIcon /> Links
                    </Link>
                </Button>
            </div>
        </aside>
    );
}
