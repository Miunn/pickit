import { redirect } from "@/i18n/navigation";

export default async function SharedWithMePage(props: { readonly params: Promise<{ readonly locale: string }> }) {
	const params = await props.params;

	const { user } = await getCurrentSession();
	if (!user) {
		return redirect({ href: `/signin`, locale: params.locale });
	}

	return <p>Shared With Me</p>;
}
