"use client";

export default function GlobalLoader() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-3">
                {/* Small spinner */}
                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />

                {/* Small text */}
                <p className="text-xs text-gray-600 font-medium">
                    Loading VITAL…
                </p>
            </div>
        </div>
    );
}
