import RequestPasswordReset from "@/components/auth/RequestPasswordReset";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("metadata.forgotPassword");
    return {
        title: t("title"),
        description: t("description"),
    };
}

export default async function ResetPasswordPage(props: {
    readonly params: Promise<{ readonly locale: string }>;
    readonly searchParams: Promise<{ readonly d?: string }>;
}) {
    const searchParams = await props.searchParams;
    const params = await props.params;
    return (
        <div className={"flex-1 absolute top-1/4 left-1/2 transform -translate-x-1/2"}>
            <RequestPasswordReset locale={params.locale} defaultEmail={searchParams.d} />
        </div>
    );
}
