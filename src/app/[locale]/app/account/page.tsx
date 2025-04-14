import { Separator } from "@/components/ui/separator";
import AccountForm from "@/components/account/accountForm";
import getMe from "@/actions/user";
import ReviewFolders from "@/components/account/reviewFolders";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("metadata.account");
    return {
        title: t("title"),
        description: t("description"),
    }
}

export default async function AccountPage({ params }: { params: { locale: string } }) {

    const user = (await getMe()).user;

    if (!user) {
        return redirect({ href: '/signin', locale: params.locale });
    }

    const t = await getTranslations("pages.account");

    const folders = await prisma.folder.findMany({
        where: { createdBy: { id: user.id } },
        select: {
            id: true,
            name: true,
            size: true,
            createdAt: true,
            _count: {
                select: { images: true }
            }
        },
    });

    return (
        <div className="flex flex-col">
            <h3 className="font-semibold">{ t('headline') }</h3>
            <p className="text-sm text-muted-foreground my-0">{ t('subtitle') }</p>

            <Separator orientation="horizontal" className="my-6" />

             <div className="flex-1 grid grid-cols-1 lg:grid-cols-[0.7fr_1fr] gap-24">
                <AccountForm user={user} />
                <ReviewFolders folders={folders || []} />
            </div>
        </div>
    )
}