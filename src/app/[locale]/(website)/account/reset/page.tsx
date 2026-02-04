import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("metadata.resetPassword");
	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function ResetPasswordPage() {
	return (
		<div className={"flex-1 absolute top-1/4 left-1/2 transform -translate-x-1/2"}>
			<ResetPasswordForm />
		</div>
	);
}
