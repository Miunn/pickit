import Header from "@/components/layout/Header";

// This page only renders when the app is built statically (output: 'export')
export default function RootPage({ params }: { params: { locale: string } }) {

    return (
        <main>
            <Header locale={params.locale} />

            <h1 className="text-6xl text-center mt-36">Save <span>moments</span> of life</h1>
            <p className="text-center mt-16 text-lg max-w-md mx-auto">
                Save your memories and share them with your loved ones with our secure and easy-to-use platform.
            </p>
        </main>
    )
}
