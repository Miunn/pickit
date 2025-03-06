import { Body, Column, Font, Head, Html, Img, Link, Row, Section, Tailwind, Text } from "@react-email/components"

const baseUrl = process.env.APP_URL
    ? process.env.APP_URL
    : 'http://localhost:3000';

export default function VerifyEmail({ name, token }: { name: string, token: string }) {
    return (
        <Html>
            <Head>
                <title>Verify your email</title>

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
                                <Text>Bonjour { name },</Text>

                                <Text>Cette adresse a été renseignée au sein d'un compte <strong>{process.env.APP_NAME}</strong>.</Text>

                                <Text>Pour vérifier et continuer à utiliser votre compte, veuillez cliquer sur le bouton ci-dessous.</Text>

                                <Text style={{ backgroundColor: "#f9f9f9", border: "1px dashed #cccccc", padding: "10px", textAlign: "center", margin: "15px 0" }}>
                                    <a href={`${baseUrl}/en/account/verify-account/${token}`} style={{
                                        boxSizing: "border-box",
                                        width: "100%",
                                        backgroundColor: "#007bff",
                                        color: "#fff",
                                        padding: "0.5rem 1rem",
                                        borderRadius: "5px",
                                        textAlign: "center",
                                        textDecoration: "none",
                                        display: "inline-block",
                                    }}>
                                        Verifier votre adresse
                                    </a>
                                </Text>

                                <Text>Si vous n'avez pas de compte Pickit ou que vous n'avez pas effectué de changement, vous pouvez ignorer ce message.</Text>

                                <Text>Cordialement,<br />
                                    L'équipe <strong>{process.env.APP_NAME}</strong></Text>
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
                                        <Row className="table-cell !h-[44px] !w-[56px] !align-bottom">
                                            <Column className="!pr-[8px]">
                                                <Link href="#">
                                                    <Img
                                                        alt="Facebook"
                                                        height="36"
                                                        src="https://react.email/static/facebook-logo.png"
                                                        width="36"
                                                    />
                                                </Link>
                                            </Column>
                                            <Column className="!pr-[8px]">
                                                <Link href="#">
                                                    <Img alt="X" height="36" src="https://react.email/static/x-logo.png" width="36" />
                                                </Link>
                                            </Column>
                                            <Column>
                                                <Link href="#">
                                                    <Img
                                                        alt="Instagram"
                                                        height="36"
                                                        src="https://react.email/static/instagram-logo.png"
                                                        width="36"
                                                    />
                                                </Link>
                                            </Column>
                                        </Row>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <Text className="!mb-0 !mt-[4px] !text-[16px] !font-semibold !leading-[24px] !text-gray-500">
                                            support@pickit.com
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