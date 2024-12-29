import VerifyTemplate from "@/components/emails/VerifyTemplate";

export default function EmailPage() {
    return (
        <html>
            <head>
                <title>My Email</title>
            </head>
            <body>
                <VerifyTemplate name="John Doe" token="123456" />
            </body>
        </html>
    )
}