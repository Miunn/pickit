import ResetPasswordTemplate from "@/components/emails/ResetPasswordTemplate";
import VerifyEmail from "@/components/emails/VerifyEmail";
import { render } from "@react-email/components";

export enum MailTemplate {
	VerifyEmail = "VerifyEmail",
	ResetPassword = "ResetPassword",
}

export function renderMailTemplate(template: MailTemplate, currentUser: { name: string }, url: string) {
	switch (template) {
		case MailTemplate.VerifyEmail:
			return renderVerifyEmail(currentUser.name, url);
		case MailTemplate.ResetPassword:
			return renderResetPassword(currentUser, url);
		default:
			throw new Error("Unknown mail template");
	}
}

async function renderVerifyEmail(name: string, url: string) {
	// `${baseUrl}/en/account/verify-account/${token}`
	return await render(<VerifyEmail name={name} url={url} />);
}

async function renderResetPassword(currentUser: { name: string }, url: string) {
	return await render(<ResetPasswordTemplate name={currentUser.name} url={url} />);
}
