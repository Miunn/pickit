import RequestPasswordReset from "@/components/auth/RequestPasswordReset";

export default async function ResetPasswordPage({ params, searchParams }: { params: { locale: string }, searchParams: { d?: string } }) {


    return (
        <div className={"flex-1 absolute top-1/4 left-1/2 transform -translate-x-1/2"}>
            <RequestPasswordReset locale={params.locale} defaultEmail={searchParams.d} />
        </div>
    );
}