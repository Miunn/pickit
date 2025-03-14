import Header from "@/components/layout/Header";

export default async function LocaleLayout({
    children,
    params: { locale },
}: Readonly<{
    children: React.ReactNode;
    params: { locale: string };
}>) {
    return (
        <div className={"min-h-screen"}>
            <Header />
            {children}
        </div>
    );
}
