"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Search, MapPin, Briefcase, MessageCircle, Users, Sparkles } from "lucide-react";
import { useBrowseProfilesQuery } from "@/store/apiSlice";
import { PROFESSIONS } from "@/lib/professions";

const LIMIT = 20;

export default function BrowsePage() {
  const [profession, setProfession] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);

  const { data, isFetching } = useBrowseProfilesQuery({ profession, location, page, limit: LIMIT });

  const result = data as any;
  const profiles: any[] = result?.data?.profiles ?? [];
  const total: number = result?.data?.total ?? 0;
  const totalPages: number = result?.data?.totalPages ?? 1;

  const handleSearch = useCallback(() => {
    setLocation(locationInput);
    setPage(1);
  }, [locationInput]);

  const handleProfessionChange = (val: string) => {
    setProfession(val);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">

        {/* Editorial header */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] font-bold text-[color:var(--orange-700)] mb-3">
            <Sparkles className="w-3 h-3" strokeWidth={2.5} />
            Discover
          </span>
          <h1 className="font-playfair text-[40px] sm:text-[52px] leading-[0.95] font-bold text-[color:var(--ink)] tracking-tight">
            Find your{" "}
            <span className="italic text-primary ink-underline">fundi.</span>
          </h1>
          <p className="text-[15px] text-[color:var(--ink-soft)] mt-4 max-w-lg leading-relaxed">
            Browse skilled tradespeople across Kenya — by craft, by neighborhood, by the work they show.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-[color:var(--line)] shadow-[0_2px_8px_-4px_rgba(40,20,5,0.1)] p-3 mb-6 flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1 relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={profession}
              onChange={(e) => handleProfessionChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-[13px] bg-[color:var(--line-soft)] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white appearance-none cursor-pointer font-medium text-[color:var(--ink)] hover:bg-[color:var(--line)] transition-colors"
            >
              <option value="">All professions</option>
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="e.g. Westlands, Nairobi"
                className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-[color:var(--line-soft)] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-colors placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={handleSearch}
              className="flex items-center gap-1.5 bg-primary text-white text-[13px] px-4 py-2.5 rounded-xl font-semibold hover:bg-[color:var(--orange-600)] transition-all shrink-0 shadow-[0_2px_10px_-2px_rgba(249,115,22,0.45)] hover:shadow-[0_4px_14px_-2px_rgba(249,115,22,0.55)] hover:-translate-y-px"
            >
              <Search className="w-4 h-4" strokeWidth={2.5} />
              Search
            </button>
          </div>
        </div>

        {/* Results count */}
        {!isFetching && (
          <div className="flex items-center justify-between mb-5 px-1">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)] font-semibold">
              {total === 0 ? "No results" : (
                <>
                  <span className="font-playfair text-[14px] font-bold text-[color:var(--ink)]">{total.toLocaleString()}</span>
                  {" "}
                  tradesperson{total !== 1 ? "s" : ""} found
                </>
              )}
            </p>
          </div>
        )}

        {/* Cards */}
        {isFetching ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[color:var(--line)] p-5">
                <div className="w-14 h-14 rounded-2xl animate-shimmer mb-4" />
                <div className="h-3.5 animate-shimmer rounded w-3/4 mb-2" />
                <div className="h-3 animate-shimmer rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[color:var(--line)]">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 ring-1 ring-orange-100 flex items-center justify-center mx-auto mb-5">
              <Search className="w-7 h-7 text-primary" strokeWidth={2} />
            </div>
            <h3 className="font-playfair font-bold text-xl text-[color:var(--ink)] mb-2">No fundis found</h3>
            <p className="text-[13px] text-[color:var(--ink-soft)] max-w-xs mx-auto leading-relaxed">
              Try a different profession or location — or clear the filters to see everyone.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {profiles.map((profile: any, i: number) => (
                <Link
                  key={profile.id}
                  href={`/profile/${profile.username}`}
                  className="group reveal relative bg-white rounded-2xl border border-[color:var(--line)] p-5 hover:border-primary hover:shadow-[0_10px_28px_-8px_rgba(249,115,22,0.18)] transition-all duration-300 overflow-hidden"
                  style={{ animationDelay: `${Math.min(i, 9) * 30}ms` }}
                >
                  {/* Decorative corner accent */}
                  <span className="absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                    background: "radial-gradient(circle at 100% 0%, rgba(249,115,22,0.1), transparent 70%)",
                  }} />

                  <div className="flex items-start gap-3 mb-3 relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center text-[color:var(--orange-700)] font-bold text-xl overflow-hidden shrink-0 ring-2 ring-[color:var(--line)] group-hover:ring-orange-300 shadow-[0_2px_8px_rgba(40,20,5,0.08)] transition-all">
                      {profile.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-playfair">{profile.fullName?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="font-playfair font-bold text-[16px] text-[color:var(--ink)] truncate group-hover:text-primary transition-colors leading-tight">
                        {profile.fullName}
                      </p>
                      {profile.profession && (
                        <span className="inline-flex items-center mt-1.5 text-[10.5px] font-semibold uppercase tracking-wide bg-orange-50 text-[color:var(--orange-700)] border border-orange-100 px-2 py-0.5 rounded-full">
                          {profile.profession}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  {profile.location && (
                    <div className="flex items-center gap-1.5 mb-3 relative">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="text-[11.5px] text-[color:var(--ink-soft)] truncate">{profile.location}</span>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center justify-between pt-3 border-t border-[color:var(--line)] relative">
                    <span className="flex items-center gap-1 text-[11.5px] text-[color:var(--ink-soft)] font-medium">
                      <Users className="w-3 h-3" />
                      <span className="tabular-nums">{Number(profile.followersCount ?? 0).toLocaleString()}</span>
                      <span className="text-gray-400">followers</span>
                    </span>
                    {profile.whatsapp && (
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`, "_blank");
                        }}
                        className="flex items-center gap-1 text-[11.5px] text-emerald-700 hover:text-emerald-800 font-semibold"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Load more */}
            {page < totalPages && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                  className="bg-white text-[color:var(--ink)] text-[13px] px-7 py-3 rounded-xl border border-[color:var(--line)] hover:border-primary hover:bg-orange-50 hover:text-primary transition-all font-semibold disabled:opacity-50"
                >
                  Load more fundis
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
