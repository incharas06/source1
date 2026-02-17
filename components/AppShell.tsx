"use client";

import { ReactNode } from "react";
import TopLogosBar from "./TopLogosBar";

export default function AppShell({
    children,
    locale,
}: {
    children: ReactNode;
    locale: string;
}) {
    return (
        <div className="min-h-dvh w-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
            {/* ✅ Header always */}
            <header className="sticky top-0 z-50">
                <TopLogosBar /> {/* Remove locale prop */}
            </header>

            {/* ✅ Page content */}
            <main className="flex-1 w-full">
                <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4">
                    {children}
                </div>
            </main>

            {/* ✅ Footer always */}
            <footer className="h-12 flex items-center justify-center text-xs font-semibold text-[var(--foreground)] border-t border-green-200 bg-white/60">
                © {new Date().getFullYear()} VITAL by Unnat Bharat Abhiyan
            </footer>
        </div>
    );
}