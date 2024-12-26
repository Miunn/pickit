import { Separator } from "@/components/ui/separator";
import AccountForm from "./accountForm";
import getMe from "@/actions/user";

export default async function AccountPage() {

    const user = (await getMe()).user;

    return (
        <div>
            <h3 className="font-semibold">Your account</h3>
            <p className="text-sm text-muted-foreground my-1">Manage your account settings</p>

            <Separator orientation="horizontal" className="my-6" />

            <AccountForm user={user || undefined} />
        </div>
    )
}