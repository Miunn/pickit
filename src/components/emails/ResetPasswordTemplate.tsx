export default function ResetPasswordTemplate({ name, token }: { name: string, token: string }) {
    return (
        <table style={{
            fontFamily: "Arial, sans-serif",
            margin: "0",
            padding: "0",
            backgroundColor: "#f9f9f9",
            width: "100%",
            height: "50vh"
        }}>
            <tbody>
                <tr>
                    <td style={{
                        width: "33.33%",
                        height: "100%"
                    }} />
                    <td style={{
                        width: "400px",
                        height: "100%"
                    }}>
                        <table style={{
                            width: "400px",
                        }}>
                            <tbody style={{
                                width: "400px",
                            }}>
                                <tr style={{
                                    width: "400px",
                                }}>
                                    <td style={{
                                        width: "400px",
                                        height: "300px",
                                        marginTop: "100px",
                                        backgroundColor: "#fff",
                                        padding: "2rem",
                                        border: "1px solid #ddd",
                                        borderRadius: "5px",
                                    }}>
                                        <h1 style={{
                                            marginTop: "0",
                                            fontSize: "1.5rem",
                                            color: "#333",
                                            textAlign: "center",
                                        }}>Reset your password</h1>
                                        <h2 style={{
                                            fontSize: "1.2rem",
                                            color: "#333",
                                            textAlign: "start",
                                            marginTop: "1.2rem",
                                            marginBottom: "1.2rem",
                                        }}>👋 {name},</h2>
                                        <p style={{
                                            fontSize: "1rem",
                                            color: "#666"
                                        }}>
                                            You recently filled a reset password request for your Pickit's account.<br />
                                            To set a new password, click the lick below<br />
                                            <br />
                                            If you didn't do this request, you can safely ignore this email.
                                        </p>
                                        <a href={`${process.env.APP_URL}/en/account/reset/${token}`} style={{
                                            boxSizing: "border-box",
                                            width: "100%",
                                            backgroundColor: "#007bff",
                                            color: "#fff",
                                            padding: "0.5rem 1rem",
                                            borderRadius: "5px",
                                            textAlign: "center",
                                            textDecoration: "none",
                                            display: "inline-block",
                                            marginTop: "1rem"
                                        }}>
                                            Reset your password
                                        </a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                    <td style={{
                        width: "33.33%",
                        height: "100%"
                    }} />
                </tr>
            </tbody>
        </table>
    )
}