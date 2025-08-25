"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { deleteFiles } from "@/actions/files";
import { toast } from "@/hooks/use-toast";

export const DeleteMultipleImagesDialog = ({
  fileIds,
  children,
  open,
  setOpen,
  onDelete,
}: {
  fileIds: string[];
  children?: React.ReactNode;
  open?: boolean;
  setOpen?: any;
  onDelete: () => void;
}) => {
  const t = useTranslations("dialogs.images.deleteMultiple");
  const [deleting, setDeleting] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { n: fileIds.length })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("actions.cancel")}</Button>
          </DialogClose>
          <Button
            onClick={async () => {
              if (fileIds.length === 0) {
                toast({
                  title: t("errors.noImages.title"),
                  description: t("errors.noImages.description"),
                  variant: "destructive",
                });
                return;
              }

              setDeleting(true);
              const r = await deleteFiles(fileIds);
              setDeleting(false);

              if (r.error) {
                toast({
                  title: t("errors.unknown.title"),
                  description: t("errors.unknown.description"),
                  variant: "destructive",
                });
                return;
              }

              onDelete();
              setOpen(false);

              toast({
                title: t("success.title"),
                description: t("success.description", { n: fileIds.length }),
              });
            }}
            disabled={deleting || fileIds.length === 0}
            variant={"destructive"}
          >
            {deleting ? (
              <>
                <Loader2 className={"animate-spin mr-2"} />{" "}
                {t("actions.submitting")}
              </>
            ) : (
              t("actions.submit")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
