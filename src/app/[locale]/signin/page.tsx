import SignInForm from "@/components/auth/SignInForm";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import SignupForm from "@/components/auth/SignupForm";
import {useTranslations} from "next-intl";

export default function LoginPage({ params }: { params: { locale: string } }) {

    const t = useTranslations('auth');

    return (
        <main style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
        }}>
            <Tabs defaultValue="login">
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
