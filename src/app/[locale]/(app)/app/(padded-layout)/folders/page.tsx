import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "@/i18n/navigation";
import { ViewState } from "@/components/folders/ViewSelector";
import FoldersContent from "@/components/folders/FoldersContent";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("metadata.folders");
    return {
        title: t("title"),
        description: t("description"),
    }
}

export default async function FoldersPage(
    props: { params: Promise<{ locale: string }>, searchParams: Promise<{ view?: ViewState }> }
) {
    const searchParams = await props.searchParams;
    const params = await props.params;

    const { user } = await getCurrentSession();

    if (!user) {
        return redirect({ href: "/signin", locale: params.locale });
    }

    const folders = await prisma.folder.findMany({
        where: {
            createdBy: { id: user.id }
        },
        include: {
            cover: true,
            accessTokens: true,
            files: { include: { folder: { include: { tags: true } }, comments: { include: { createdBy: true } }, tags: true } },
            createdBy: true,
            _count: { select: { files: true } }
        },
    });

    return (
        <main className="flex flex-col flex-grow">
            <FoldersContent folders={folders} defaultView={searchParams.view} />
        </main>
    )
}