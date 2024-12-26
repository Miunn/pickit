import { auth } from "@/actions/auth";
import { Separator } from "@/components/ui/separator";
import AccountForm from "./accountForm";

export default async function AccountPage() {

    const session = await auth();

    return (
        <div>
            <h3 className="font-semibold">Your account</h3>
            <p className="text-sm text-muted-foreground my-1">Manage your account settings</p>

            <Separator orientation="horizontal" className="my-6" />

            <AccountForm />
        </div>
    )
}