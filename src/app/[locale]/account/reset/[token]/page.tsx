import { getResetPasswordRequest } from "@/actions/resetPassword";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({ params }: { params: { locale: string, token: string } }) {

    const verifyPasswordResetToken = await getResetPasswordRequest(params.token);

    return (
        <div className={"flex-1 absolute top-1/4 left-1/2 transform -translate-x-1/2"}>
            <ResetPasswordForm locale={params.locale} token={params.token} status={verifyPasswordResetToken.status} />
        </div>
    );
}