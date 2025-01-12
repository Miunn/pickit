export default function ResetPasswordTemplate({ name, folderName, link }: { name: string, folderName: string, link: string }) {
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
                                        }}>You've been shared a folder!</h1>
                                        <h2 style={{
                                            fontSize: "1.2rem",
                                            color: "#333",
                                            textAlign: "start",
                                            marginTop: "1.2rem",
                                            marginBottom: "1.2rem",
                                        }}>👋 Hello,</h2>
                                        <p style={{
                                            fontSize: "1rem",
                                            color: "#666"
                                        }}>
                                            {name} shared with you <b>{folderName}</b> !<br />
                                            <br />
                                            You can check it out by clicking the link below.
                                        </p>
                                        <a href={link} style={{
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
                                            {folderName}
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