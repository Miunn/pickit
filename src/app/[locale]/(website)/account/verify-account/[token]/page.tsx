import { verifyAccount } from "@/actions/user";
import { MessageCircleQuestion, TicketCheck } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: { locale: string, token: string } }): Promise<Metadata> {
    const t = await getTranslations("metadata.verifyEmail");
    return {
        title: t("title"),
        description: t("description"),
    }
}

export default async function VerifyAccountPage(props: { params: Promise<{ locale: string, token: string }> }) {
    const params = await props.params;

    const result = await verifyAccount(params.token);

    return (
        <div className={"flex-1 absolute top-1/4 left-1/2 transform -translate-x-1/2"}>
            {result.error && result.error === "invalid-token" ? (
                <div className="w-fit flex flex-col items-center gap-2">
                    <MessageCircleQuestion size={128} className="text-orange-600" />
                    <h1 className="text-center text-xl text-orange-600 font-bold">
                        This verification link has expired or is invalid.
                    </h1>
                </div>
            ) : null}
            {!result.error && result.user ? (
                <div className="w-fit flex flex-col items-center gap-2">
                    <TicketCheck size={128} className="text-green-600" />
                    <h1 className="text-center text-xl text-green-600 font-bold">
                        Account verified!
                    </h1>
                    <h2 className="text-center text-lg text-green-700">
                        Hello { result.user.name }, your account has been verified.<br />
                        You can now <Link href={`/${params.locale}/signin`} className="underline">login</Link>.
                    </h2>
                </div>
            ) : null}
        </div>
    );
}