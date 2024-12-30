"use client"

import { VerifyEmailRequest } from "@prisma/client";
import { Cross2Icon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useRef } from "react";

export default function UnverifiedEmail({ locale, userDeletionDate }: { locale: string, userDeletionDate: Date }) {

    const ref = useRef<HTMLAnchorElement>(null);

    const remove = () => {
        ref.current?.remove();
    }

    return (
        <Link ref={ref} href={`/${locale}/dashboard/account`} className="relative w-full h-12 bg-orange-400 hover:bg-orange-500 flex justify-center items-center cursor-pointer mb-4">
            <p className="text-sm font-bold">Your email address is not verified yet. Verify your email before {userDeletionDate.toLocaleDateString(locale, { day: "numeric", year: "numeric", month: "long" })} to avoid deletion</p>
            <button onClick={remove} className="unset absolute w-4 h-4 right-4 top-1/2 -translate-y-1/2 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none">
                <Cross2Icon />
            </button>
        </Link>
    )
}