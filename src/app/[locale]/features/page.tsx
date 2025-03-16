import Footer from "@/components/layout/Footer"
import Header from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Timeline } from "@/components/ui/timeline"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function FeaturesPage() {
    return (
        <>
            <Header className="sticky top-0 z-50 bg-background/90 backdrop-blur mb-11" />
            <main className="max-w-7xl mx-auto">

                <div className="max-w-5xl mx-auto">
                    <div className="mt-20 py-6 px-4 md:px-8 lg:px-10">
                        <h2 className="text-lg md:text-4xl mb-4 text-black dark:text-white max-w-4xl">
                            List of all features
                        </h2>
                        <p className="text-neutral-700 dark:text-neutral-300 text-sm md:text-base max-w-sm">
                            Here&apos;s a list of all the features available on Pickit.
                        </p>
                    </div>
                    <Timeline data={[
                        {
                            title: "Albums",
                            content: <div>
                                📁 Create unlimited albums<br />
                                📁 Share albums to others<br />
                                📁 Set album cover<br />
                                📁 Upload photos to albums<br />
                                📁 Download albums as ZIP<br />

                                <div className="w-96 h-96 rounded-xl mt-11 bg-red-400"></div>
                            </div>
                        },
                        {
                            title: "Photos",
                            content: <div>
                                🖼️ Comment on photos<br />
                                🖼️ Download photos<br />
                                🖼️ Check photo details<br />
                                🖼️ Check photo metadata<br />
                                🖼️ Set photo as album cover<br />
                                🖼️ Copy to clipboard<br />
                                <div className="w-96 h-96 rounded-xl mt-11 bg-red-400"></div>
                            </div>
                        },
                        {
                            title: "Sharing",
                            content: <div>
                                🚀 Create sharing links<br />
                                🚀 Set password on links<br />
                                🚀 Set expiration date on links<br />
                                🚀 Set view/edit permissions<br />
                                🚀 Copy to clipboard<br />
                                🚀 Directly share to contacts with automatic link creation<br />
                                🚀 Social media integration<br />
                                <div className="w-96 h-96 rounded-xl mt-11 bg-red-400"></div>
                            </div>
                        },
                        {
                            title: "Search",
                            content: <div>
                                🔍 Command palette<br />
                                🔍 Search for albums<br />
                                🔍 Search for photos<br />
                                🔍 Search for links<br />
                                🔍 Search for settings<br />
                                <div className="w-96 h-96 rounded-xl mt-11 bg-red-400"></div>
                            </div>
                        }
                    ]} />
                </div>

                <div className="w-full bg-primary text-primary-foreground py-20 px-4 my-24 rounded-xl md:px-8 lg:px-32">
                    <h1 className="text-3xl">Ready to save your memories ?</h1>
                    <p className="leading-10 text-lg">
                        Get started with Pickit today and prevent your memories from fading away right now.
                    </p>
                    <Button className="p-7 mt-6 rounded-full" variant={"secondary"} asChild>
                        <Link href={"/signin?side=register"}>
                            Get Started <ArrowRight />
                        </Link>
                    </Button>
                </div>
            </main>
            <Footer />
        </>
    )
}