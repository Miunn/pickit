import { AuthService } from "@/data/secure/auth";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout(
	props: Readonly<{
		children: React.ReactNode;
		params: Promise<{ locale: string }>;
	}>
) {
	const { locale } = await props.params;
	const { children } = props;

	const { isAuthenticated, session } = await AuthService.isAuthenticated();

	if (!isAuthenticated || !session) {
		return redirect({ href: `/app/login`, locale: locale });
	}

	const isAdmin = await auth.api.userHasPermission({
		body: {
			userId: session.user.id,
			permissions: {
				user: ["list"],
			},
		},
	});

	console.log("isAdmin", isAdmin);

	if (!isAdmin.success) {
		return redirect({ href: `/app`, locale: locale });
	}

	return <div className={"min-h-screen"}>{children}</div>;
}
