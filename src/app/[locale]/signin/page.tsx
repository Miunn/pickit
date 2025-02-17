import SignInForm from "@/components/auth/SignInForm";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import SignupForm from "@/components/auth/SignupForm";
import {useTranslations} from "next-intl";
import { getCurrentSession } from "@/lib/authUtils";
import { redirect } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export default async function LoginPage({ params, searchParams }: { params: { locale: string }, searchParams: { side?: string } }) {

    const { user } = await getCurrentSession();
    if (user) {
        return redirect(`/app`);
    }

    const t = await getTranslations('auth');

    return (
        <main style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
        }}>
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
