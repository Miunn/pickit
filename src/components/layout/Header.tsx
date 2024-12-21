import {ProfileDropdown} from "@/components/generic/ProfileDropdown";
import {auth} from "@/actions/auth";

export default async function Header() {

    const session = await auth();

    return (
        <header className="flex items-center justify-between px-6 py-4 border-b">
            <div className={"flex gap-24 items-center"}>
                <h1 className="text-2xl font-bold">Pickit</h1>

            </div>
            <nav className="flex items-center space-x-4">

                <ProfileDropdown name={session?.user?.name} />

            </nav>
        </header>
    );
}
