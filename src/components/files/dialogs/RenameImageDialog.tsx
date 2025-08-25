"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { CreateFolderFormSchema, FileWithFolder } from "@/lib/definitions";
import { renameFile } from "@/actions/files";

export default function RenameImageDialog({
  openState,
  setOpenState,
  file,
}: {
  openState: boolean;
  setOpenState: any;
  file: FileWithFolder;
}) {
  const t = useTranslations("dialogs.images.rename");

  const form = useForm<z.infer<typeof CreateFolderFormSchema>>({
    resolver: zodResolver(CreateFolderFormSchema),
    defaultValues: {
      name: file.name,
    },
  });

  async function onSubmit(data: z.infer<typeof CreateFolderFormSchema>) {
    const d = await renameFile(file.id, data);

    if (d.error) {
      toast({
        title: t("errors.unknown.title"),
        description: t("errors.unknown.description"),
        variant: "destructive",
      });
      return;
    }

    form.reset();
    toast({
      title: t("success.title"),
      description: t("success.description"),
    });

    setOpenState(false);
  }

  return (
    <Dialog open={openState} onOpenChange={setOpenState}>
      <DialogContent className="w-full overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="text-wrap break-all">
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.name.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("form.name.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-wrap break-all">
                    {t("form.name.description", { name: file.name })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type={"button"} variant="outline">
                  {t("actions.cancel")}
                </Button>
              </DialogClose>
              {form.formState.isSubmitting ? (
                <Button disabled={true}>
                  <Loader2 className={"mr-2 animate-spin"} />{" "}
                  {t("actions.submitting")}
                </Button>
              ) : (
                <Button type={"submit"}>{t("actions.submit")}</Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
