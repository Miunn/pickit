"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRef } from "react";

export default function UnverifiedEmail({
  locale,
  userDeletionDate,
}: {
  locale: string;
  userDeletionDate: Date;
}) {
  const intlFormatter = useFormatter();
  const t = useTranslations("components.unverifiedEmail");
  const ref = useRef<HTMLDivElement>(null);

  const remove = () => {
    ref.current?.remove();
  };

  return (
    <div
      ref={ref}
      className="relative w-full h-12 bg-orange-400 hover:bg-orange-500 cursor-pointer"
    >
      <Link
        href={`/${locale}/app/account`}
        className="w-full h-full flex justify-center items-center"
      >
        <p className="text-center text-sm font-bold px-9">
          {t("message", {
            date: intlFormatter.dateTime(userDeletionDate, {
              day: "numeric",
              year: "numeric",
              month: "long",
            }),
          })}
        </p>
      </Link>
      <button
        onClick={remove}
        className="unset absolute w-4 h-4 right-4 top-1/2 -translate-y-1/2 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none"
      >
        <Cross2Icon />
      </button>
    </div>
  );
}
