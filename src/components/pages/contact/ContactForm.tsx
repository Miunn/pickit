'use client'

import { ContactFormSchema } from "@/lib/definitions"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { z } from "zod"
import { Input } from "./ui/input"
import { useTranslations } from "next-intl"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { useState } from "react"
import { createContact } from "@/actions/contact"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function ContactForm() {

    const t = useTranslations("components.contactForm");
    const form = useForm<z.infer<typeof ContactFormSchema>>({
        resolver: zodResolver(ContactFormSchema),
        defaultValues: {
            name: "",
            email: "",
            message: "",
        }
    });

    const submitForm = async (data: z.infer<typeof ContactFormSchema>) => {
        const r = await createContact(data);

        if (r.error) {
            toast({
                title: t(`errors.${r.error}.title`),
                description: t(`errors.${r.error}.description`),
                variant: "destructive"
            })
            return;
        }

        form.reset();
        toast({
            title: t('success.title'),
            description: t('success.description'),
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(submitForm)} className="space-y-4">

                <FormField
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel htmlFor={field.name}>{t('fields.name.label')}</FormLabel>
                            <Input {...field} />
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    name="email"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel htmlFor={field.name}>{t('fields.email.label')}</FormLabel>
                            <Input {...field} />
                            <FormDescription>{t('fields.email.description')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    name="message"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel htmlFor={field.name}>{t('fields.message.label')}</FormLabel>
                            <Textarea rows={4} placeholder={t('fields.message.placeholder')} {...field} />
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="w-fit ml-auto">
                {form.formState.isSubmitting
                    ? <Button disabled><Loader2 className={"w-4 h-4 mr-2"} /> {t('actions.submitting')}</Button>
                    : <Button type="submit">{t('actions.submit')}</Button>
                }
                </div>
            </form>
        </Form>
    )
}