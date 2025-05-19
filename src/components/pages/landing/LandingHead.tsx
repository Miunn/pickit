'use client'

import Hero from "./Hero";
import { useRef } from "react";

export default function LandingHead() {
    const seeMoreRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <Hero seeMoreRef={seeMoreRef} />

            <div ref={seeMoreRef} className="max-w-7xl grid grid-cols-4 xl:grid-cols-3 my-16 lg:my-32 mx-16">
                <div className="col-start-1 lg:col-start-2 col-end-5 xl:col-end-4">
                    <h3 className="text-4xl md:text-5xl">Store & Share your photos easily</h3>

                    <p>
                        With Echomori, you can store and share your photos to your loved ones easily.
                        Our platform is secure and easy to use, you can create albums and share them with your friends and family.
                    </p>
                </div>
            </div>
        </>
    )
}