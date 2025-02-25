import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Arrow } from "@radix-ui/react-tooltip";
import { ArrowRight } from "lucide-react";

// This page only renders when the app is built statically (output: 'export')
export default function RootPage({ params }: { params: { locale: string } }) {

    return (
        <main>
            <Header className="mb-11" locale={params.locale} />

            <div className="bg-black h-[600px] rounded-3xl mx-6 text-white flex flex-col justify-center gap-11">
                <div className="w-full max-w-7xl mx-auto">
                    <h1 className="text-6xl mb-8">Save moments of life</h1>

                    <p className="text-xl mb-8">
                        Save your memories and share them with your loved ones<br />
                        with our secure and easy-to-use platform.
                    </p>

                    <div className="flex items-center gap-4">
                        <Button className="p-7 rounded-3xl">
                            Get started <ArrowRight />
                        </Button>
                        <Button variant={"link"} className="text-white">
                            See more
                        </Button>
                    </div>

                    <div className="flex items-center gap-16 mt-16">
                        <div>
                            <Label className="text-4xl font-bold tracking-wider">1000</Label>
                            <p>Exemple stat</p>
                        </div>

                        <div>
                            <Label className="text-4xl font-bold tracking-wider">1000</Label>
                            <p>Exemple stat</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
