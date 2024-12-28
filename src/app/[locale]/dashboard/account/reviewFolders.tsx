import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatBytes } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

export default function ReviewFolders({ locale, folders }: { locale: string, folders: { id: string, name: string, size: number, createdAt: Date, _count: { images: number } }[] }) {
    return (
        <div>
            <h3 className="font-semibold">Review your folders</h3>

            <div className="mt-6">
                {folders.map((folder) => (
                    <div key={folder.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                        <div>
                            <h4 className="font-semibold">{folder.name}</h4>
                            <p className="text-sm text-muted-foreground capitalize">{folder.createdAt.toLocaleDateString(locale, { weekday: "long", day: "numeric", year: "numeric", month: "long" })}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-sm text-muted-foreground">{folder._count.images} images</p>
                            <p className="text-sm text-muted-foreground">{formatBytes(folder.size)}</p>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-40">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                        <Link href={`http://localhost:3000/${locale}/dashboard/folders/${folder.id}`} className="cursor-default">
                                            View folder
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`http://localhost:3000/${locale}/dashboard/links`} className="cursor-default">
                                            Manage accesses
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 font-semibold">Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}