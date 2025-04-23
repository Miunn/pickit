import { Body, Button, Column, Font, Head, Html, Img, Link, Row, Section, Tailwind, Text } from "@react-email/components"

const baseUrl = process.env.APP_URL
    ? process.env.APP_URL
    : 'http://localhost:3000';

export default function ResetPasswordTemplate({ name, token }: { name: string, token: string }) {
    return (
        <Html>
            <Head>
                <title>Folder shared</title>

                <Font
                    fontFamily="Inter"
                    fallbackFontFamily="Helvetica"
                    webFont={{
                        url: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2",
                        format: "woff2",
                    }}
                    fontWeight={400}
                    fontStyle="normal"
                />
            </Head>

            <Tailwind>
                <Body className="m-0 p-0 max-w-[600px] mx-auto mt-[30px]">
                    <Section style={{
                        border: "1px solid #e0e0e0",
                        borderRadius: "5px"
                    }}>
                        <Row>
                            <Column className="text-center bg-[#f4f4f4] p-4" align="center">
                                <Section width="100%">
                                    <tr>
                                        <td align="center" valign="middle">
                                            <Img src={`${baseUrl}/static/favicon.jpg`} alt={process.env.APP_NAME} className="inline-block max-w-[200px] max-h-[40px]" />
                                            <Text className="inline-block text-[1.5rem] m-0 pl-[10px] font-semibold">{process.env.APP_NAME}</Text>
                                        </td>
                                    </tr>
                                </Section>
                            </Column>
                        </Row>
                        <Row>
                            <Column style={{
                                padding: "20px"
                            }}>
                                <Text className="text-center text-xl tracking-wide">Réinitialisation de votre mot de passe</Text>

                                <Text>Bonjour { name },</Text>

                                <Text>Vous avez récemment demandé une réinitialisation de votre mot de passe associé à votre compte { process.env.APP_NAME }.</Text>

                                <Text>Afin de créer un nouveau mot de passe et de récupérer l&lsquo;accès à votre compte, cliquez sur le bouton ci-dessous :</Text>

                                <div className="bg-[#f9f9f9] p-[10px] my-[15px] border-dashed border-[1px] border-[#cccccc]">
                                    <Button href={`${process.env.APP_URL}/en/account/reset/${token}`} className="box-border w-full rounded-[8px] bg-indigo-600 px-[12px] py-[12px] text-center font-semibold text-white">
                                        Réinitialiser votre mot de passe
                                    </Button>
                                </div>

                                <Text>Ce lien de réinitialisation expirera après 15 minutes.</Text>

                                <Text>Si vous n&lsquo;avez pas soumis de demande de réinitialisation de mot de passe, vous pouvez simplement ignorer ce message.</Text>

                                <Text>Cordialement,<br />
                                    L&lsquo;équipe <strong>{process.env.APP_NAME}</strong></Text>
                            </Column>
                        </Row>

                        <Section className="text-center bg-[#f4f4f4] p-4">
                            <table className="w-full">
                                <tr className="w-full">
                                    <td align="center">
                                        <Img
                                            alt="React Email logo"
                                            height="42"
                                            src="https://react.email/static/logo-without-background.png"
                                        />
                                    </td>
                                </tr>
                                <tr className="w-full">
                                    <td align="center">
                                        <Text className="!my-[8px] !text-[16px] !font-semibold !leading-[24px] !text-gray-900">
                                            {process.env.APP_NAME}
                                        </Text>
                                        <Text className="!mb-0 !mt-[4px] !text-[16px] !leading-[24px] !text-gray-500">
                                            Upload and share your memories easily
                                        </Text>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <Text className="!mb-0 !mt-[4px] !text-[16px] !font-semibold !leading-[24px] !text-gray-500">
                                            {process.env.SUPPORT_EMAIL}
                                        </Text>
                                    </td>
                                </tr>
                            </table>
                        </Section>
                    </Section>
                </Body>
            </Tailwind>
        </Html>
    )
}