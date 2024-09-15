import {Button} from "@/components/ui/button";
import {CircleUserRound} from "lucide-react";

export default function Header() {
    return (
        <header className="flex items-center justify-between px-6 py-4 border-b">
            <div className={"flex gap-24 items-center"}>
                <h1 className="text-2xl font-bold">Pickit</h1>

            </div>
            <nav className="flex items-center space-x-4">

                <Button variant="ghost" size="icon">
                    <CircleUserRound/>
                </Button>
            </nav>
        </header>
    );
}
