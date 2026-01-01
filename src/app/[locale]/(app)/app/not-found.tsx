export default async function NotFoundPage(props: Promise<{ readonly params: { readonly locale: string } }>) {
    const { params } = await props;

    return (
        <html lang={params.locale}>
            <body>
                <div className={"flex justify-center items-center"}>
                    <p>{"description"}</p>
                </div>
            </body>
        </html>
    );
}
