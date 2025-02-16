import { getUser } from "@/actions/userAdministration";
import AccountForm from "@/components/account/accountForm";

export default async function AdminUser({ params }: { params: { userId: string } }) {
    
    const user = (await getUser(params.userId)).user;

    return (
        <div>
            <AccountForm user={user} />
        </div>
    );
}