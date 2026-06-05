"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { useAuth } from "@/features/auth";
import { useBrowseProfiles, useToggleFollow } from "@/features/profiles";

const TRADE_PILLS = ["Plumber", "Electrician", "Painter", "Carpenter", "Designer", "Developer"];

const POPULAR_LOCATIONS = [
  { city: "Nairobi", count: 142 },
  { city: "London", count: 98 },
  { city: "Lagos", count: 87 },
  { city: "Dubai", count: 63 },
  { city: "Mumbai", count: 51 },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-dm-sans text-[13px] font-semibold text-gray-900 uppercase tracking-wider mb-2.5">
      {children}
    </h3>
  );
}

interface BrowseRightSidebarProps {
  activeProfession: string;
  onProfessionClick: (profession: string) => void;
  activeLocation: string;
  onLocationClick: (location: string) => void;
}

export default function BrowseRightSidebar({ activeProfession, onProfessionClick, activeLocation, onLocationClick }: BrowseRightSidebarProps) {
  const { profile: me } = useAuth();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const toggleFollow = useToggleFollow();

  const { data: browseData } = useBrowseProfiles({ limit: 6 });
  const suggested = ((browseData as any)?.data?.profiles ?? [])
    .filter((p: any) => p.username !== me?.username)
    .slice(0, 3);

  const handleFollow = async (profileId: string) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      next.has(profileId) ? next.delete(profileId) : next.add(profileId);
      return next;
    });
    try {
      await toggleFollow.mutateAsync(profileId);
    } catch {
      setFollowedIds((prev) => {
        const next = new Set(prev);
        next.has(profileId) ? next.delete(profileId) : next.add(profileId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-3">

      {/* Sections 1–3: single white card with dividers */}
      <div className="bg-white rounded-2xl border border-[color:var(--line)] shadow-[0_1px_3px_rgba(40,20,5,0.05)] divide-y divide-[color:var(--line)]">

        {/* Filter by trade */}
        <div className="p-4">
          <SectionTitle>Filter by trade</SectionTitle>
          <div className="flex flex-wrap gap-2 mt-2.5">
            {TRADE_PILLS.map((trade) => {
              const isActive = activeProfession === trade;
              return (
                <button
                  key={trade}
                  onClick={() => onProfessionClick(isActive ? "" : trade)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all font-dm-sans ${
                    isActive
                      ? "bg-orange-500 text-white shadow-[0_2px_8px_-2px_rgba(249,115,22,0.35)]"
                      : "bg-orange-50 text-[color:var(--orange-700)] hover:bg-orange-100"
                  }`}
                >
                  {trade}
                </button>
              );
            })}
          </div>
        </div>

        {/* Popular locations */}
        <div className="p-4">
          <SectionTitle>Popular locations</SectionTitle>
          <div className="space-y-0.5 mt-2.5">
            {POPULAR_LOCATIONS.map(({ city, count }) => {
              const isActive = activeLocation.toLowerCase() === city.toLowerCase();
              return (
                <button
                  key={city}
                  onClick={() => onLocationClick(isActive ? "" : city)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left ${
                    isActive ? "bg-orange-50" : "hover:bg-[color:var(--line-soft)]"
                  }`}
                >
                  <MapPin className="w-3 h-3 text-gray-400 shrink-0" strokeWidth={2} />
                  <span className={`font-dm-sans text-[13px] flex-1 ${isActive ? "text-orange-600 font-medium" : "text-gray-600"}`}>
                    {city}
                  </span>
                  <span className="font-dm-sans text-[12px] text-gray-400 tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recently joined */}
        <div className="p-4">
          <SectionTitle>Recently joined</SectionTitle>
          {suggested.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">No suggestions right now.</p>
          ) : (
            <div className="space-y-3.5 mt-2.5">
              {suggested.map((person: any) => {
                const isFollowed = followedIds.has(person.id);
                return (
                  <div key={person.id} className="flex items-center gap-2.5">
                    <Link href={`/profile/${person.username}`} className="shrink-0">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-[color:var(--orange-700)] font-bold text-sm overflow-hidden ring-2 ring-[color:var(--line)] hover:ring-orange-300 shadow-[0_1px_4px_rgba(40,20,5,0.08)] transition-all">
                        {person.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-playfair">{person.fullName?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/profile/${person.username}`}>
                        <p className="text-[13px] font-semibold text-[color:var(--ink)] truncate hover:text-primary transition-colors leading-tight">{person.fullName}</p>
                      </Link>
                      <p className="text-[11px] text-[color:var(--ink-soft)] truncate mt-0.5">{person.profession}</p>
                    </div>
                    <button
                      onClick={() => handleFollow(person.id)}
                      className={`shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all ${
                        isFollowed
                          ? "bg-[color:var(--ink)] text-white"
                          : "bg-primary text-white hover:bg-[color:var(--orange-600)] shadow-[0_2px_8px_-2px_rgba(249,115,22,0.4)]"
                      }`}
                    >
                      {isFollowed ? "Following" : "Follow"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fundi Pro card — separate orange-50 card */}
      <div className="relative overflow-hidden rounded-2xl border border-orange-100 bg-orange-50 p-4 shadow-[0_2px_8px_-4px_rgba(249,115,22,0.15)]">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shadow-[0_2px_8px_-2px_rgba(249,115,22,0.5)]">
            <Star className="w-4 h-4 text-white" strokeWidth={2} fill="white" />
          </div>
          <div>
            <p className="font-dm-sans text-[11px] font-semibold text-orange-600 uppercase tracking-wider">Fundi Pro</p>
            <p className="font-playfair font-bold text-[15px] text-[color:var(--ink)] leading-tight">Upgrade to Pro</p>
          </div>
        </div>
        <ul className="space-y-1.5 mb-3.5">
          {["Verified badge on your profile", "Priority in search results", "Unlimited portfolio posts"].map((feat) => (
            <li key={feat} className="flex items-center gap-2 font-dm-sans text-[12px] text-[color:var(--ink-soft)]">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
              {feat}
            </li>
          ))}
        </ul>
        <button className="w-full font-dm-sans text-[13px] font-semibold bg-orange-500 text-white py-2 rounded-xl hover:bg-orange-600 transition-colors shadow-[0_2px_8px_-2px_rgba(249,115,22,0.4)]">
          Upgrade to Pro
        </button>
      </div>

      {/* Footer */}
      <div className="px-2 pt-1 text-xs text-gray-400 font-dm-sans">
        <p>Fundi · Built for skilled workers</p>
      </div>
    </div>
  );
}
