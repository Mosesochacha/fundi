"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import SettingsSidebar from "@/components/settings/SettingsSidebar";

const SECTION_LABELS: Record<string, string> = {
  "/settings/profile":       "Profile",
  "/settings/analytics":     "Analytics",
  "/settings/account":       "Account",
  "/settings/security":      "Security",
  "/settings/notifications": "Notifications",
  "/settings/appearance":    "Appearance",
  "/settings/privacy":       "Privacy",
  "/settings/billing":       "Billing",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn } = useAppSelector((s) => s.auth);

  // Mobile: null = show sidebar menu; string = show section content
  const [mobileSection, setMobileSection] = useState<string | null>(() =>
    pathname !== "/settings" ? pathname : null
  );

  if (!isLoggedIn) {
    if (typeof window !== "undefined") router.push("/login");
    return null;
  }

  const handleMobileNavigate = (href: string) => {
    setMobileSection(href);
    router.push(href);
  };

  const currentLabel = mobileSection ? SECTION_LABELS[mobileSection] : null;

  return (
    <div className="min-h-screen">
      {/* Desktop: two-column layout */}
      <div className="hidden md:flex items-start">
        {/* Sidebar — sticky, fills viewport height below navbar */}
        <aside
          className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col sticky top-14"
          style={{ height: "calc(100vh - 56px)" }}
        >
          <div className="px-4 py-5 border-b border-gray-100">
            <h2 className="font-playfair text-lg font-bold text-gray-900">Settings</h2>
          </div>
          <SettingsSidebar />
        </aside>

        {/* Content — normal flow, page scrolls */}
        <main className="flex-1 min-w-0">
          <div className="w-full p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile: iOS Settings-style */}
      <div className="md:hidden min-h-[calc(100vh-64px)]">
        {mobileSection ? (
          // Section view
          <div>
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-16 z-10">
              <button
                onClick={() => { setMobileSection(null); router.push("/settings"); }}
                className="text-[#f97316] flex items-center gap-1 text-sm font-medium"
              >
                <ArrowLeft size={16} />
                Settings
              </button>
              <span className="text-sm font-semibold text-gray-900">{currentLabel}</span>
            </div>
            <div className="p-4">{children}</div>
          </div>
        ) : (
          // Sidebar menu view
          <div className="bg-white min-h-[calc(100vh-64px)]">
            <div className="px-4 py-4 border-b border-gray-100">
              <h1 className="font-playfair text-xl font-bold text-gray-900">Settings</h1>
            </div>
            <SettingsSidebar onNavigate={handleMobileNavigate} />
          </div>
        )}
      </div>
    </div>
  );
}
