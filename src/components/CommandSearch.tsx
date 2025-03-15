'use client'

import * as React from "react"
import {
    Folder,
    FolderPlus,
    Folders,
    Image,
    Images,
    LayoutDashboard,
    Link,
    LogOut,
    Mails,
    RectangleEllipsis,
    UserPen,
    Waypoints,
} from "lucide-react"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import NextLink from "next/link"
import { useTranslations } from "next-intl"
import { ImageLightWithFolderName, LightFolder } from "@/lib/definitions"
import { useRouter } from "next/navigation"
import { SignOut } from "@/actions/authActions"
import CreateFolderDialog from "./folders/CreateFolderDialog"

export function CommandSearch({ folders, images }: { folders: LightFolder[], images: ImageLightWithFolderName[] }) {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);

    const t = useTranslations("components.commandSearch")

    const [openNewFolder, setOpenNewFolder] = React.useState(false)

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <>
            <CommandDialog open={open} onOpenChange={setOpen} modal={true}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>{t('noResults')}</CommandEmpty>
                    <CommandGroup heading={t('sections.pages')}>
                        <CommandItem onSelect={() => runCommand(() => router.push("/app"))}>
                            <LayoutDashboard />
                            <span>{t('pages.dashboard')}</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/app/folders"))}>
                            <Folders />
                            <span>{t('pages.folders')}</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/app/images"))}>
                            <Images />
                            <span>{t('pages.images')}</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/app/links"))}>
                            <Link />
                            <span>{t('pages.links')}</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/app/shared-with-me"))}>
                            <Waypoints />
                            <span>{t('pages.sharedWithMe')}</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/app/account"))}>
                            <UserPen />
                            <span>{t('pages.account')}</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading={t('sections.folders')}>
                        <CommandItem onSelect={() => runCommand(() => setOpenNewFolder(true))}>
                            <FolderPlus />
                            <span>{t('actions.folders.create')}</span>
                        </CommandItem>
                        {folders.map((folder) => (
                            <CommandItem key={folder.id} onSelect={() => runCommand(() => router.push(`/app/folders/${folder.id}`))}>
                                <Folder />
                                <span>{folder.name}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading={t('sections.images')}>
                        {images.map((image) => (
                            <CommandItem key={image.id} value={image.id} onSelect={() => runCommand(() => router.push(`/app/folders/${image.folder.id}`))}>
                                <Image />
                                <span>{image.folder.name} - {image.name}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading={t('sections.account')}>
                        <CommandItem onSelect={() => runCommand(() => router.push("/app/account?focus=email"))}>
                            <Mails />
                            <span>{t('actions.account.changeEmail')}</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/app/account?focus=password"))}>
                            <RectangleEllipsis />
                            <span>{t('actions.account.changePassword')}</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => SignOut())}>
                            <LogOut />
                            <span>{t('actions.account.logout')}</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
            <CreateFolderDialog open={openNewFolder} setOpen={setOpenNewFolder} />
        </>
    )
}
