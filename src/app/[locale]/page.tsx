import "../globals.css";
import Header from "@/components/layout/Header";

// This page only renders when the app is built statically (output: 'export')
export default function RootPage({ params }: { params: { locale: string } }) {

    return (
        <main>
            <Header locale={params.locale} />
        </main>
    )
}
