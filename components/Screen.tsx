"use client";

import { ReactNode } from "react";

export default function Screen({
    children,
    padded = true,
    center = false,
}: {
    children: ReactNode;
    padded?: boolean;
    center?: boolean;
}) {
    return (
        <div
            className={[
                "w-full",
                padded ? "px-4 sm:px-6 py-4" : "",
                center ? "min-h-[calc(100dvh-4rem-3rem)] flex items-center justify-center" : ""
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {children}
        </div>
    );
}
