import { Body, Button, Column, Font, Head, Html, Img, Row, Section, Tailwind, Text } from "@react-email/components";
import EmailFooter from "./EmailFooter";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL : "http://localhost:3000";

export default function NotifyAboutUploadTemplate({
    name,
    folderName,
    link,
    isLocked,
    count,
    lang = "fr",
}: {
    readonly name: string;
    readonly folderName: string;
    readonly link: string;
    readonly isLocked: boolean;
    readonly count: number;
    readonly lang: string;
}) {
    if (lang === "fr") {
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
                        <Section
                            style={{
                                border: "1px solid #e0e0e0",
                                borderRadius: "5px",
                            }}
                        >
                            <Row>
                                <Column className="text-center bg-[#f4f4f4] p-4" align="center">
                                    <Section width="100%">
                                        <tr>
                                            <td align="center" valign="middle">
                                                <Img
                                                    src={`${baseUrl}/static/logo-full-primary.png`}
                                                    alt={process.env.NEXT_PUBLIC_APP_NAME}
                                                    className="inline-block max-w-[200px] max-h-[32px]"
                                                />
                                            </td>
                                        </tr>
                                    </Section>
                                </Column>
                            </Row>
                            <Row>
                                <Column
                                    style={{
                                        padding: "20px",
                                    }}
                                >
                                    <Text className="text-center text-xl tracking-wide">
                                        Nouveaux fichiers ajoutés à <strong>{folderName}</strong>
                                    </Text>

                                    <Text>
                                        {name} a ajouté{" "}
                                        {count === 1 ? "1 nouveau fichier" : `${count} nouveaux fichiers`} à{" "}
                                        <strong>{folderName}</strong>
                                    </Text>

                                    <Text>Cliquez sur le bouton ci-dessous pour y accéder :</Text>

                                    <div className="bg-[#f9f9f9] p-[10px] my-[15px] border-dashed border-[1px] border-[#cccccc]">
                                        <Button
                                            href={link}
                                            className="box-border w-full rounded-[8px] bg-[#1F7551] px-[12px] py-[12px] text-center font-semibold text-white"
                                        >
                                            {folderName}
                                        </Button>
                                    </div>

                                    {isLocked ? (
                                        <Text>
                                            {name} a vérouillé ce dossier par un code que vous devrez renseigner avant
                                            de pouvoir accéder à son contenu. Si vous ne connaissez pas ce code,
                                            veuillez contacter {name} pour l&apos;obtenir.
                                        </Text>
                                    ) : null}

                                    <Text>
                                        Cordialement,
                                        <br />
                                        L&apos;équipe <strong>{process.env.NEXT_PUBLIC_APP_NAME}</strong>
                                    </Text>
                                </Column>
                            </Row>

                            <EmailFooter />
                        </Section>
                    </Body>
                </Tailwind>
            </Html>
        );
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
                    <Section
                        style={{
                            border: "1px solid #e0e0e0",
                            borderRadius: "5px",
                        }}
                    >
                        <Row>
                            <Column className="text-center bg-[#f4f4f4] p-4" align="center">
                                <Section width="100%">
                                    <tr>
                                        <td align="center" valign="middle">
                                            <Img
                                                src={`${baseUrl}/static/logo-full-primary.png`}
                                                alt={process.env.NEXT_PUBLIC_APP_NAME}
                                                className="inline-block max-w-[200px] max-h-[32px]"
                                            />
                                        </td>
                                    </tr>
                                </Section>
                            </Column>
                        </Row>
                        <Row>
                            <Column
                                style={{
                                    padding: "20px",
                                }}
                            >
                                <Text className="text-center text-xl tracking-wide">
                                    New files added to <strong>{folderName}</strong>
                                </Text>

                                <Text>
                                    {name} added {count === 1 ? "1 new file" : `${count} new files`} added to{" "}
                                    <strong>{folderName}</strong>
                                </Text>

                                <Text>Click the button below to access it :</Text>

                                <div className="bg-[#f9f9f9] p-[10px] my-[15px] border-dashed border-[1px] border-[#cccccc]">
                                    <Button
                                        href={link}
                                        className="box-border w-full rounded-[8px] bg-[#1F7551] px-[12px] py-[12px] text-center font-semibold text-white"
                                    >
                                        {folderName}
                                    </Button>
                                </div>

                                {isLocked ? (
                                    <Text>
                                        {name} locked this folder with a code that you will need to enter before you can
                                        access its content. If you don&apos;t know this code, please contact {name} to
                                        get it.
                                    </Text>
                                ) : null}

                                <Text>
                                    Best regards,
                                    <br />
                                    The <strong>{process.env.NEXT_PUBLIC_APP_NAME}</strong> team
                                </Text>
                            </Column>
                        </Row>

                        <EmailFooter />
                    </Section>
                </Body>
            </Tailwind>
        </Html>
    );
}
