"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Search, MapPin, Briefcase, MessageCircle, Users } from "lucide-react";
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
    <div className="min-h-screen bg-[var(--orange-25)]">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 font-playfair">Find a Fundi</h1>
          <p className="text-sm text-gray-500 mt-1">Browse skilled tradespeople by profession and location</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={profession}
                onChange={(e) => handleProfessionChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
              >
                <option value="">All professions</option>
                {PROFESSIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
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
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button
              onClick={handleSearch}
              className="flex items-center gap-1.5 bg-primary text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-primaryDark transition-colors shrink-0"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>

        {/* Results count */}
        {!isFetching && (
          <p className="text-xs text-gray-400 mb-4">
            {total === 0 ? "No results" : `${total} tradesperson${total !== 1 ? "s" : ""} found`}
          </p>
        )}

        {/* Cards */}
        {isFetching ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-gray-100 mb-3" />
                <div className="h-3.5 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">No fundis found</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              Try a different profession or location — or clear the filters to see everyone.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {profiles.map((profile: any) => (
                <Link
                  key={profile.id}
                  href={`/profile/${profile.username}`}
                  className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-primary font-bold text-base overflow-hidden mb-3">
                    {profile.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                    ) : (
                      profile.fullName?.[0]?.toUpperCase()
                    )}
                  </div>

                  {/* Name + profession */}
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors leading-tight">
                    {profile.fullName}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{profile.profession}</p>

                  {/* Location */}
                  <div className="flex items-center gap-1 mt-2">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-400 truncate">{profile.location}</span>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Users className="w-3 h-3" />
                      {Number(profile.followersCount ?? 0).toLocaleString()}
                    </span>
                    {profile.whatsapp && (
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`, "_blank");
                        }}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 ml-auto"
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
              <div className="mt-8 text-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                  className="bg-white text-gray-700 text-sm px-6 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors font-medium"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
