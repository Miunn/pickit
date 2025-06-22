import { Body, Button, Column, Font, Head, Html, Img, Link, Row, Section, Tailwind, Text } from "@react-email/components";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'http://localhost:3000';

export default function NotifyAboutUploadTemplate({ name, folderName, link, isLocked, count, lang="fr" }: { name: string, folderName: string, link: string, isLocked: boolean, count: number, lang: string }) {
    if (lang === 'fr') {
        return (
            <Html>
                <Head>
                    <title>Nouveaux fichiers dans {folderName}</title>

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
                                                <Img src={`${baseUrl}/static/logo-full-primary.png`} alt={process.env.NEXT_PUBLIC_APP_NAME} className="inline-block max-w-[200px] max-h-[32px]" />
                                            </td>
                                        </tr>
                                    </Section>
                                </Column>
                            </Row>
                            <Row>
                                <Column style={{
                                    padding: "20px"
                                }}>
                                    <Text className="text-center text-xl tracking-wide">Nouveaux fichiers ajoutés à <strong>{folderName}</strong></Text>

                                    <Text>{name} a ajouté {count === 1 ? '1 nouveau fichier' : `${count} nouveaux fichiers`} à <strong>{folderName}</strong></Text>

                                    <Text>Cliquez sur le bouton ci-dessous pour y accéder :</Text>

                                    <div className="bg-[#f9f9f9] p-[10px] my-[15px] border-dashed border-[1px] border-[#cccccc]">
                                        <Button href={link} className="box-border w-full rounded-[8px] bg-[#1F7551] px-[12px] py-[12px] text-center font-semibold text-white">
                                            {folderName}
                                        </Button>
                                    </div>

                                    {isLocked
                                        ? <Text>
                                            {name} a vérouillé ce dossier par un code que vous devrez renseigner avant de pouvoir accéder à son contenu.
                                            Si vous ne connaissez pas ce code, veuillez contacter {name} pour l&apos;obtenir.
                                        </Text>
                                        : null
                                    }

                                    <Text>Cordialement,<br />
                                        L&apos;équipe <strong>{process.env.NEXT_PUBLIC_APP_NAME}</strong></Text>
                                </Column>
                            </Row>

                            <Section className="text-center bg-[#f4f4f4] p-4">
                                <table className="w-full">
                                    <tr className="w-full">
                                        <td align="center">
                                            <Img
                                                alt={process.env.NEXT_PUBLIC_APP_NAME}
                                                height="42"
                                                src={`${baseUrl}/static/logo-primary-png.png`}
                                            />
                                        </td>
                                    </tr>
                                    <tr className="w-full">
                                        <td align="center">
                                            <Text className="!my-[8px] !text-[16px] !font-semibold !leading-[24px] !text-gray-900">
                                                {process.env.NEXT_PUBLIC_APP_NAME}
                                            </Text>
                                            <Text className="!mb-0 !mt-[4px] !text-[16px] !leading-[24px] !text-gray-500">
                                                Upload and share your memories easily
                                            </Text>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center">
                                            <Text className="!mb-0 !mt-[4px] !text-[16px] !font-semibold !leading-[24px] !text-gray-500">
                                                {process.env.NEXT_PUBLIC_SUPPORT_MAIL}
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

    return (
        <Html>
            <Head>
                <title>New files in {folderName}</title>

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
                                            <Img src={`${baseUrl}/static/logo-full-primary.png`} alt={process.env.NEXT_PUBLIC_APP_NAME} className="inline-block max-w-[200px] max-h-[32px]" />
                                        </td>
                                    </tr>
                                </Section>
                            </Column>
                        </Row>
                        <Row>
                            <Column style={{
                                padding: "20px"
                            }}>
                                <Text className="text-center text-xl tracking-wide">New files added to <strong>{folderName}</strong></Text>

                                <Text>{name} added {count === 1 ? '1 new file' : `${count} new files`} added to <strong>{folderName}</strong></Text>

                                <Text>Click the button below to access it :</Text>

                                <div className="bg-[#f9f9f9] p-[10px] my-[15px] border-dashed border-[1px] border-[#cccccc]">
                                    <Button href={link} className="box-border w-full rounded-[8px] bg-[#1F7551] px-[12px] py-[12px] text-center font-semibold text-white">
                                        {folderName}
                                    </Button>
                                </div>

                                {isLocked
                                    ? <Text>
                                        {name} locked this folder with a code that you will need to enter before you can access its content.
                                        If you don&apos;t know this code, please contact {name} to get it.
                                    </Text>
                                    : null
                                }

                                <Text>Best regards,<br />
                                    The <strong>{process.env.NEXT_PUBLIC_APP_NAME}</strong> team</Text>
                            </Column>
                        </Row>

                        <Section className="text-center bg-[#f4f4f4] p-4">
                            <table className="w-full">
                                <tr className="w-full">
                                    <td align="center">
                                        <Img
                                            alt={process.env.NEXT_PUBLIC_APP_NAME}
                                            height="42"
                                            src={`${baseUrl}/static/logo-primary-png.png`}
                                        />
                                    </td>
                                </tr>
                                <tr className="w-full">
                                    <td align="center">
                                        <Text className="!my-[8px] !text-[16px] !font-semibold !leading-[24px] !text-gray-900">
                                            {process.env.NEXT_PUBLIC_APP_NAME}
                                        </Text>
                                        <Text className="!mb-0 !mt-[4px] !text-[16px] !leading-[24px] !text-gray-500">
                                            Upload and share your memories easily
                                        </Text>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <Text className="!mb-0 !mt-[4px] !text-[16px] !font-semibold !leading-[24px] !text-gray-500">
                                            {process.env.NEXT_PUBLIC_SUPPORT_MAIL}
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