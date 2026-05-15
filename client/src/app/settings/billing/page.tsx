"use client";

import { Check } from "lucide-react";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsSection from "@/components/settings/SettingsSection";

const FREE_FEATURES = [
  "Public profile",
  "Up to 10 posts per month",
  "Basic search listing",
  "Community posts",
];

const CREATOR_FEATURES = [
  "Unlimited profile updates",
  'Remove "Powered by Fundi" branding',
  "Custom profile URL",
  "Priority in search results",
  "Everything in Free",
];

const BUSINESS_FEATURES = [
  "Analytics dashboard",
  "Featured listing badge",
  "Community post pinning",
  "Everything in Creator",
];

function PlanCard({
  name,
  price,
  period,
  features,
  current,
  cta,
  highlighted,
}: {
  name: string;
  price: string;
  period?: string;
  features: string[];
  current?: boolean;
  cta?: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 flex flex-col gap-4 ${
        highlighted ? "border-[#f97316] bg-orange-50/30" : "border-gray-200 bg-white"
      }`}
    >
      <div>
        <p className="font-playfair text-lg font-bold text-gray-900">{name}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {price}
          {period && <span className="text-sm font-normal text-gray-400">/{period}</span>}
        </p>
      </div>
      <ul className="space-y-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <Check size={14} className="text-[#f97316] mt-0.5 shrink-0" strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>
      {current ? (
        <span className="text-xs font-semibold text-center text-[#f97316] bg-orange-50 border border-orange-100 rounded-lg py-2">
          Current plan
        </span>
      ) : cta ? (
        <button className="w-full h-10 rounded-lg bg-gray-100 text-sm font-medium text-gray-500 cursor-not-allowed">
          {cta} — Coming soon
        </button>
      ) : null}
    </div>
  );
}

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <SettingsHeader title="Billing" description="Manage your plan" />

      {/* Current plan */}
      <SettingsSection title="Current Plan">
        <div className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Free</p>
              <p className="text-sm text-gray-500 mt-0.5">Basic profile with community access</p>
            </div>
            <span className="text-xs font-semibold text-[#f97316] bg-orange-50 border border-orange-100 rounded-full px-3 py-1">
              Active
            </span>
          </div>
        </div>
      </SettingsSection>

      {/* Upgrade options */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Upgrade your plan</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <PlanCard
            name="Free"
            price="KSh 0"
            features={FREE_FEATURES}
            current
          />
          <PlanCard
            name="Creator"
            price="KSh 500"
            period="month"
            features={CREATOR_FEATURES}
            cta="Upgrade with M-Pesa"
            highlighted
          />
          <PlanCard
            name="Business"
            price="KSh 2,000"
            period="month"
            features={BUSINESS_FEATURES}
            cta="Upgrade with M-Pesa"
          />
        </div>
      </div>

      {/* M-Pesa note */}
      <div className="rounded-xl bg-orange-50 border border-orange-100 p-4 text-sm text-orange-700">
        <p className="font-semibold mb-1">M-Pesa payments coming soon</p>
        <p className="text-xs text-orange-600">
          We are integrating M-Pesa for seamless payments. Join the waitlist and we will notify you when upgrades are available.
        </p>
      </div>
    </div>
  );
}
