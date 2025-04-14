import { getResetPasswordRequest } from "@/actions/resetPassword";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: { locale: string, token: string } }): Promise<Metadata> {
    const t = await getTranslations("metadata.resetPassword");
    return {
        title: t("title"),
        description: t("description"),
    }
}

export default async function ResetPasswordPage({ params }: { params: { locale: string, token: string } }) {

    const verifyPasswordResetToken = await getResetPasswordRequest(params.token);

    return (
        <div className={"flex-1 absolute top-1/4 left-1/2 transform -translate-x-1/2"}>
            <ResetPasswordForm locale={params.locale} token={params.token} status={verifyPasswordResetToken.status} />
        </div>
    );
}