import ClientPage from "../../../components/ClientPage";

export default async function RootPage({ params }: { params: { locale: string } }) {
    return (
        <ClientPage />
    )
}
