import { AuthService } from "@/data/secure/auth";
import { redirect } from "@/i18n/navigation";

export default async function SharedWithMePage(props: { readonly params: Promise<{ readonly locale: string }> }) {
	const params = await props.params;

	const { isAuthenticated } = await AuthService.isAuthenticated();
	if (!isAuthenticated) {
		return redirect({ href: `/signin`, locale: params.locale });
	}

	return <p>Shared With Me</p>;
}
