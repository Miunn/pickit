import { Column, Img, Row, Section, Text } from "@react-email/components";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL : "http://localhost:3000";
const appName = process.env.NEXT_PUBLIC_APP_NAME ? process.env.NEXT_PUBLIC_APP_NAME : "Echomori";
const supportMail = process.env.NEXT_PUBLIC_SUPPORT_MAIL ? process.env.NEXT_PUBLIC_SUPPORT_MAIL : "";

export default function EmailFooter() {
    return (
        <Section className="w-full text-center bg-[#f4f4f4] p-4">
            <Row className="w-full">
                <Column align="center">
                    <Img alt={appName} height="42" src={`${baseUrl}/static/logo-primary-png.png`} />
                </Column>
            </Row>
            <Row className="w-full">
                <Column align="center">
                    <Text className="!my-[8px] !text-[16px] !font-semibold !leading-[24px] !text-gray-900">
                        {appName}
                    </Text>
                    <Text className="!mb-0 !mt-[4px] !text-[16px] !leading-[24px] !text-gray-500">
                        Upload and share your memories easily
                    </Text>
                </Column>
            </Row>
            <Row>
                <Column align="center">
                    <Text className="!mb-0 !mt-[4px] !text-[16px] !font-semibold !leading-[24px] !text-gray-500">
                        {supportMail}
                    </Text>
                </Column>
            </Row>
        </Section>
    );
}
