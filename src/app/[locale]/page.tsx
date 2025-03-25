import ClientPage from "./ClientPage";

export default async function RootPage({ params }: { params: { locale: string } }) {
    return (
        <ClientPage />
    )
}
