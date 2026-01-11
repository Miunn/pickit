import { Separator } from "@/components/ui/separator";
import AccountForm from "@/components/account/AccountForm";
import ReviewFolders from "@/components/account/ReviewFolders";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Metadata } from "next";
import { getCurrentSession } from "@/lib/session";
import { FolderService } from "@/data/folder-service";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("metadata.account");
    return {
        title: t("title"),
        description: t("description"),
    };
}

export default async function AccountPage(props: { readonly params: Promise<{ readonly locale: string }> }) {
    const params = await props.params;

    const { user } = await getCurrentSession();

    if (!user) {
        return redirect({ href: "/signin", locale: params.locale });
    }

    const t = await getTranslations("pages.account");

    const folders = await FolderService.getMultiple({
        where: { createdBy: { id: user.id } },
        select: {
            id: true,
            name: true,
            size: true,
            createdAt: true,
            _count: {
                select: { files: true },
            },
        },
    });

    return (
        <div className="flex flex-col">
            <h3 className="font-semibold">{t("headline")}</h3>
            <p className="text-sm text-muted-foreground my-0">{t("subtitle")}</p>

            <Separator orientation="horizontal" className="my-6" />

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[0.7fr_1fr] gap-24">
                <AccountForm user={user} />
                <ReviewFolders folders={folders || []} />
            </div>
        </div>
    );
}
