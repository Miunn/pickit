"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { AccountFormSchema } from "@/lib/definitions"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

export default function AccountForm() {

    const [loading, setLoading] = useState<boolean>(false);

    const form = useForm<z.infer<typeof AccountFormSchema>>({
        resolver: zodResolver(AccountFormSchema),
        defaultValues: {
            name: '',
            email: '',
        }
    })

    function submit(data: z.infer<typeof AccountFormSchema>) {
        console.log(data);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className="space-y-6 max-w-xl">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel className="font-normal">
                                Full name
                            </FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel className="font-normal">
                                Email
                            </FormLabel>
                            <FormControl>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                </FormControl>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <FormControl>
                                    <Input placeholder="••••••••" {...field} />
                                </FormControl>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {loading
                    ? <Button type="button" disabled={true}><Loader2 className={"mr-2 animate-spin"} /> Creating</Button>
                    : <Button type="submit">Create</Button>
                }
            </form>
        </Form>
    )
}