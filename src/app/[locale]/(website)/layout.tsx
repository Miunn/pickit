import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function WebsiteLayout({ children }: { readonly children: React.ReactNode }) {
    return (
        <>
            <Header className="sticky top-0 z-50 bg-background/90 backdrop-blur" />
            <main className="min-h-screen">{children}</main>
            <Footer />
        </>
    );
}
