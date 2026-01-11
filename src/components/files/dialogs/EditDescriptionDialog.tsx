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
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { FileWithFolder, EditDescriptionFormSchema } from "@/lib/definitions";
import { Textarea } from "../../ui/textarea";
import { updateFileDescription } from "@/actions/files";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FileType } from "@prisma/client";
export default function EditDescriptionDialog({
  file,
  open,
  setOpen,
  children,
  onSuccess,
}: {
  readonly file: FileWithFolder;
  readonly open?: boolean;
  readonly setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  readonly children?: React.ReactNode;
  readonly onSuccess?: (newDescription: string) => void;
}) {
  const t = useTranslations("dialogs.images.editDescription");
  const [internalOpen, setInternalOpen] = useState(false);
  const openState = open ?? internalOpen;
  const setOpenState = setOpen ?? setInternalOpen;

  const form = useForm<z.infer<typeof EditDescriptionFormSchema>>({
    resolver: zodResolver(EditDescriptionFormSchema),
    defaultValues: {
      description: file.description || "",
    },
  });

  const onSubmit = async (data: z.infer<typeof EditDescriptionFormSchema>) => {
    const response = await updateFileDescription(file.id, data.description);

    if (response.error) {
      toast.error(t("errors.unknown.description"));
      return;
    }

    toast.success(t("success.description"));
    setOpenState(false);
    onSuccess?.(data.description);
  };

  return (
    <Dialog
      open={openState}
      onOpenChange={(open) => {
        setOpenState(open);
        if (!open) {
          form.reset({
            description: "",
          });
        }
      }}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { name: file.name })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 mt-4"
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.description.label")}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder={t("form.description.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("form.description.help", {
                      fileType:
                        file.type === FileType.IMAGE
                          ? t("form.description.fileType.image")
                          : t("form.description.fileType.video"),
                    })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("actions.cancel")}
                </Button>
              </DialogClose>
              {form.formState.isSubmitting ? (
                <Button type="button" disabled>
                  <Loader2 className="mr-2 animate-spin" />
                  {t("actions.submitting")}
                </Button>
              ) : (
                <Button type="submit">{t("actions.submit")}</Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
