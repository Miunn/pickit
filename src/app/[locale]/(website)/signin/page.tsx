import SignInForm from "@/components/auth/SignInForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignupForm from "@/components/auth/SignupForm";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata(props: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ side?: string }>;
}): Promise<Metadata> {
    const searchParams = await props.searchParams;
    if (searchParams.side === "register") {
        const t = await getTranslations("metadata.signup");
        return {
            title: t("title"),
            description: t("description"),
        };
    }

    const t = await getTranslations("metadata.signin");
    return {
        title: t("title"),
        description: t("description"),
    };
}

export default async function LoginPage(props: {
    readonly params: Promise<{ readonly locale: string }>;
    readonly searchParams: Promise<{ readonly side?: string; readonly error?: string }>;
}) {
    const searchParams = await props.searchParams;
    const params = await props.params;

    const { user } = await getCurrentSession();
    if (user) {
        return redirect({ href: `/app`, locale: params.locale });
    }

    const t = await getTranslations("auth");

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Tabs defaultValue={searchParams.side === "register" ? "register" : "login"}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">{t("signInTab")}</TabsTrigger>
                    <TabsTrigger value="register">{t("signUpTab")}</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                    <SignInForm />
                </TabsContent>
                <TabsContent value="register">
                    <SignupForm />
                </TabsContent>
            </Tabs>
        </div>
    );
}
