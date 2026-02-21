import { Link } from "@/i18n/navigation";
import { MessageCircleQuestion, TicketCheck } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("metadata.verifyEmail");
	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function VerifyAccountPage(props: {
	readonly params: Promise<{ readonly locale: string; readonly token: string }>;
	readonly searchParams: Promise<{ readonly error?: string }>;
}) {
	const { error } = await props.searchParams;

	if (error) {
		return (
			<div className="w-fit flex flex-col items-center gap-2">
				<MessageCircleQuestion size={128} className="text-orange-600" />
				<h1 className="text-center text-xl text-orange-600 font-bold">
					This verification link has expired or is invalid.
				</h1>
			</div>
		);
	}

	return (
		<div className={"flex-1 absolute top-1/4 left-1/2 transform -translate-x-1/2"}>
			<div className="w-fit flex flex-col items-center gap-2">
				<TicketCheck size={128} className="text-green-600" />
				<h1 className="text-center text-xl text-green-600 font-bold">Account verified!</h1>
				<h2 className="text-center text-lg text-green-700">
					Your account has been verified.
					<br />
					You can now{" "}
					<Link href={`/signin`} className="underline">
						login
					</Link>
					.
				</h2>
			</div>
		</div>
	);
}
