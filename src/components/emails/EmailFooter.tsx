import { Img, Section, Text } from "@react-email/components";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL : "http://localhost:3000";

export default function EmailFooter() {
    return (
        <Section className="text-center bg-[#f4f4f4] p-4">
            <table className="w-full">
                <tbody>
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
                </tbody>
            </table>
        </Section>
    );
}
