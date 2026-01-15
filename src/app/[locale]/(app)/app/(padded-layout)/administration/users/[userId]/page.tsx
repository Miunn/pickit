import AccountForm from "@/components/account/AccountForm";
import BreadcrumbPortal from "@/components/layout/BreadcrumbPortal";
import HeaderBreadcumb from "@/components/layout/breadcrumb/HeaderBreadcumb";
import { UserService } from "@/data/user-service";
import { redirect } from "@/i18n/navigation";

export default async function AdminUser(props: {
	readonly params: Promise<{ readonly locale: string; readonly userId: string }>;
}) {
	const params = await props.params;

	const user = await UserService.get({
		where: { id: params.userId },
		select: {
			id: true,
			name: true,
			email: true,
			emailVerified: true,
			emailVerificationDeadline: true,
			image: true,
			role: true,
			usedStorage: true,
			maxStorage: true,
			createdAt: true,
			updatedAt: true,
			_count: {
				select: {
					folders: true,
					files: true,
				},
			},
		},
	});

	if (!user) {
		return redirect({ href: "/administration/users", locale: params.locale });
	}

	return (
		<div>
			<BreadcrumbPortal>
				<HeaderBreadcumb adminUser={user} />
			</BreadcrumbPortal>
			<AccountForm user={user} />
		</div>
	);
}
