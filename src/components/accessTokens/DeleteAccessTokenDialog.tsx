import { Button } from "../ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { useState } from "react";
import { deleteAccessToken } from "@/actions/accessTokens";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function DeleteAccessTokenDialog({ tokens, children, openState, setOpenState, submitNext }: { tokens: string[], children?: React.ReactNode, openState?: boolean, setOpenState?: React.Dispatch<React.SetStateAction<boolean>>, submitNext?: () => void }) {

    const [loading, setLoading] = useState<boolean>(false);

    const submit = async () => {
        setLoading(true);

        const r = await deleteAccessToken(tokens);

        setLoading(false);

        if (r.error) {
            toast({
                title: "Error while deleting accesss token",
                description: "An unknown error happened when trying to delete this access token",
                variant: "destructive"
            });
            return;
        }

        if (setOpenState) {
            setOpenState(false);
        }

        if (submitNext) {
            submitNext();
        }
    }

    return (
        <Dialog open={openState} onOpenChange={setOpenState}>
            {children}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete link</DialogTitle>
                    <DialogDescription>Are you sure</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    {loading
                        ? <Button disabled={true} variant="destructive"><Loader2 className={"mr-2 animate-spin"} /> Deleting</Button>
                        : <Button onClick={submit} variant="destructive">Delete</Button>
                    }
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}