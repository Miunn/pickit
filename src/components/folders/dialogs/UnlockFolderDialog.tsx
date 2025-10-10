import { Dialog, DialogTitle } from "@radix-ui/react-dialog";
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader } from "../../ui/dialog";
import { Button } from "../../ui/button";

export default function UnlockFolderDialog() {
    return (
        <Dialog>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Unlock Folder</DialogTitle>
                    <DialogDescription>Are you sure you want to unlock this folder ?</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type={"button"}>Cancel</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}