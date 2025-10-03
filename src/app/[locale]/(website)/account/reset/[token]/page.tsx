import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { PasswordResetRequestService } from "@/data/password-reset-service";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("metadata.resetPassword");
    return {
        title: t("title"),
        description: t("description"),
    };
}

export default async function ResetPasswordPage(props: { params: Promise<{ locale: string; token: string }> }) {
    const params = await props.params;

    const verifyPasswordResetToken = await PasswordResetRequestService.get({
        where: { token: params.token },
    });

    if (!verifyPasswordResetToken) {
        return redirect(`/${params.locale}/account/reset`);
    }

    return (
        <div className={"flex-1 absolute top-1/4 left-1/2 transform -translate-x-1/2"}>
            <ResetPasswordForm locale={params.locale} token={params.token} status={verifyPasswordResetToken.status} />
        </div>
    );
}
