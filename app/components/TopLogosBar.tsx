"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { FiGlobe } from "react-icons/fi";

export default function TopLogosBar() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "en";

  const goLanguage = () => {
    router.push(`/${locale}/language`);
  };

  return (
    <header className="w-full bg-white border-b-2 border-green-800 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
        
        {/* Digital India */}
        <Image
          src="/assets/branding/digi.png"
          alt="Digital India"
          width={160}
          height={80}
          priority
          className="h-10 w-auto object-contain hover:scale-110 transition-transform duration-300"
        />

        {/* UBA */}
        <Image
          src="/assets/branding/uba.png"
          alt="UBA"
          width={120}
          height={80}
          priority
          className="h-10 w-auto object-contain hover:scale-110 transition-transform duration-300"
        />

        {/* VITAL */}
        <Image
          src="/assets/branding/logo.png"
          alt="VITAL"
          width={140}
          height={80}
          priority
          className="h-12 w-auto object-contain hover:scale-110 transition-transform duration-300"
        />

        {/* 🌐 Language switch */}
        <button
          onClick={goLanguage}
          title="Change language"
          className="
            h-12 w-12 rounded-xl
            border border-green-200
            bg-green-50
            flex items-center justify-center
            hover:bg-green-100 hover:scale-105
            transition-all duration-300
          "
        >
          <FiGlobe className="text-green-800 text-xl" />
        </button>
      </div>
    </header>
  );
}
