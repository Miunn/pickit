import { FolderSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/Header";

export default async function InvalidTokenPage() {

    const t = await getTranslations("invalidToken");

    return (
        <div className={"min-h-screen flex flex-col"}>
            <div className="mt-[10%] flex flex-col items-center">
                <FolderSearch className="w-28 h-28 text-red-500" />
                <h3 className="text-3xl text-center mb-3 text-red-600">{t("title")}</h3>
                <p className="text-center">{t("description")}</p>
                <Button variant={"link"}>
                    <Link href={"/"} className="flex items-center gap-2">
                        {t("goBack")} <ArrowRight />
                    </Link>
                </Button>
            </div>
            <Toaster />
        </div>
    )
}
