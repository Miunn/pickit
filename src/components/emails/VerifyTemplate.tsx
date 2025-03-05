export default function VerifyTemplate({ name, token }: { name: string, token: string }) {
    return (
        <table width="100%" cellPadding="0" cellSpacing="0" style={{
            fontFamily: "Arial, sans-serif",
            lineHeight: 1.6,
            color: "#333",
            maxWidth: "600px",
            margin: "0 auto",
            padding: "0"
        }}>
            <tbody>
                <tr>
                    <td align="center" style={{
                        padding: "20px"
                    }}>
                        <table cellPadding="0" cellSpacing="0" width="100%" style={{
                            border: "1px solid #e0e0e0",
                            borderRadius: "5px"
                        }}>
                            <tbody>
                                <tr>
                                    <td style={{
                                        display: "block",
                                        backgroundColor: "#f4f4f4",
                                        padding: "15px",
                                        textAlign: "center",
                                    }}>
                                        <img src={`${process.env.APP_URL}/favicon.jpg`} alt={process.env.APP_NAME} style={{ maxWidth: "200px", maxHeight: "40px" }} />
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{
                                        padding: "20px"
                                    }}>
                                        <p>Bonjour,</p>

                                        <p>Cette adresse a été renseignée au sein d'un compte <strong>{process.env.APP_NAME}</strong>.</p>

                                        <p>Pour vérifier et continuer à utiliser votre compte, veuillez cliquer sur le bouton ci-dessous.</p>

                                        <p style={{ backgroundColor: "#f9f9f9", border: "1px dashed #cccccc", padding: "10px", textAlign: "center", margin: "15px 0" }}>
                                            <a href={`${process.env.APP_URL}/en/account/verify-account/${token}`} style={{
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
                                        </p>

                                        <p>Si vous n'avez pas de compte Pickit ou que vous n'avez pas effectué de changement, vous pouvez ignorer ce message.</p>

                                        <p>Cordialement,<br />
                                            L'équipe <strong>{process.env.APP_NAME}</strong></p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ backgroundColor: "#f4f4f4", padding: "10px", textAlign: "center", fontSize: "12px" }}>
                                        <p style={{ margin: 0 }}>{process.env.COPYRIGHT}. Tous droits réservés.</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody>
        </table>
    )
}