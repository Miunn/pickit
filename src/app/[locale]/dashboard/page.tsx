import CreateFolderDialog from "@/components/folders/CreateFolderDialog";
import {Button} from "@/components/ui/button";
import {FolderX, ImageOff, ImageUp, Settings2} from "lucide-react";
import FolderPreview from "@/components/folders/FolderPreview";
import {prisma} from "@/lib/prisma";

export default async function Home({ params }: { params: { locale: string } }) {

    const folders = await prisma.folder.findMany({
        include: {
            cover: true,
        }
    });

    return (
        <div className="flex flex-col flex-grow p-6">
            <div className={"flex gap-4 mb-10"}>
                <CreateFolderDialog/>
                <Button variant="outline">
                    <ImageUp className={"mr-2"}/> {'uploadImages'}
                </Button>
                <Button variant="outline">
                    <Settings2 className={"mr-2"}/> {'manageLinks'}
                </Button>
            </div>

            <h2 className={"font-semibold mb-5"}>Last updated folders</h2>

            <div className={`flex flex-wrap gap-6 ${folders.length == 0 && "justify-center"} mb-10`}>
                {folders.length == 0
                    ? <div className={"flex flex-col justify-center items-center"}>
                        <FolderX className={"w-32 h-32 opacity-20"}/>
                        <p>No folders updated</p>
                    </div>
                    : folders.map(folder => (
                        <FolderPreview key={folder.id} folder={folder} locale={params.locale}/>
                    ))
                }
            </div>

            <h2 className={"font-semibold mb-5"}>Last uploaded images</h2>

            <div className={`flex flex-wrap gap-6 ${[].length == 0 && "justify-center"}`}>
                {[].length == 0
                    ? <div className={"flex flex-col justify-center items-center"}>
                        <ImageOff className={"w-32 h-32 opacity-20"}/>
                        <p>No images uploaded</p>
                    </div>
                    : [].map(folder => (
                        <></>
                    ))
                }
            </div>
        </div>
    );
}
