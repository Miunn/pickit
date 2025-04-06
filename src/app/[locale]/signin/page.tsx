import SignInForm from "@/components/auth/SignInForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignupForm from "@/components/auth/SignupForm";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function LoginPage({ params, searchParams }: { params: { locale: string }, searchParams: { side?: string, error?: string } }) {

    const { user } = await getCurrentSession();
    if (user) {
        return redirect({ href: `/app`, locale: params.locale });
    }

    const t = await getTranslations('auth');

    return (
        <main className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Tabs defaultValue={searchParams.side === "register" ? "register" : "login"}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">{t("signInTab")}</TabsTrigger>
                    <TabsTrigger value="register">{t("signUpTab")}</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                    <SignInForm locale={params.locale} />
                </TabsContent>
                <TabsContent value="register">
                    <SignupForm locale={params.locale} />
                </TabsContent>
            </Tabs>
        </main>
    )
}
