"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Search, MapPin, Users, ChevronRight, ArrowRight } from "lucide-react";
import { useBrowseProfilesQuery, useToggleFollowMutation } from "@/store/apiSlice";
import { useAppSelector } from "@/store/hooks";
import BrowseRightSidebar from "@/components/sidebar/BrowseRightSidebar";

const LIMIT = 12;

const PILL_PROFESSIONS = [
  "Plumber", "Electrician", "Painter", "Carpenter", "Mason",
  "Developer", "Designer", "Photographer", "Welder", "Nurse", "Tutor",
];

function getProfessionGradient(profession: string): string {
  const p = (profession ?? "").toLowerCase();
  if (p.includes("plumb")) return "linear-gradient(135deg, #dbeafe, #bfdbfe)";
  if (p.includes("electr")) return "linear-gradient(135deg, #fef9c3, #fef08a)";
  if (p.includes("paint")) return "linear-gradient(135deg, #fce7f3, #fbcfe8)";
  if (p.includes("carp")) return "linear-gradient(135deg, #fef3c7, #fde68a)";
  if (p.includes("mason") || p.includes("brick")) return "linear-gradient(135deg, #f5f5f4, #e7e5e4)";
  if (p.includes("dev") || p.includes("engin")) return "linear-gradient(135deg, #e0e7ff, #c7d2fe)";
  if (p.includes("design")) return "linear-gradient(135deg, #f3e8ff, #e9d5ff)";
  if (p.includes("photo")) return "linear-gradient(135deg, #ffe4e6, #fecdd3)";
  return "linear-gradient(135deg, #ffedd5, #fed7aa)";
}

function getInitialColor(name: string): string {
  const code = (name?.[0]?.toUpperCase().charCodeAt(0) ?? 65) - 65;
  if (code < 5) return "bg-orange-400";
  if (code < 10) return "bg-blue-500";
  if (code < 15) return "bg-green-600";
  if (code < 20) return "bg-purple-500";
  return "bg-pink-500";
}

export default function BrowsePage() {
  const { isLoggedIn } = useAppSelector((s) => s.auth);

  const [qInput, setQInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [profession, setProfession] = useState("");
  const [page, setPage] = useState(1);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [toggleFollow] = useToggleFollowMutation();

  const { data, isFetching } = useBrowseProfilesQuery({ q, profession, location, page, limit: LIMIT });

  const result = data as any;
  const freshProfiles: any[] = result?.data?.profiles ?? [];
  const total: number = result?.data?.total ?? 0;
  const totalPages: number = result?.data?.totalPages ?? 1;

  useEffect(() => {
    if (isFetching) return;
    setAllProfiles((prev) => (page === 1 ? freshProfiles : [...prev, ...freshProfiles]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isFetching]);

  const handleSearch = useCallback(() => {
    setQ(qInput);
    setLocation(locationInput);
    setPage(1);
  }, [qInput, locationInput]);

  const handleProfessionChange = useCallback((val: string) => {
    setProfession(val);
    setPage(1);
  }, []);

  const handleLocationFilter = useCallback((val: string) => {
    setLocation(val);
    setLocationInput(val);
    setPage(1);
  }, []);

  const handleFollow = async (e: React.MouseEvent, profileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) return;
    setFollowedIds((prev) => {
      const next = new Set(prev);
      next.has(profileId) ? next.delete(profileId) : next.add(profileId);
      return next;
    });
    try {
      await toggleFollow(profileId).unwrap();
    } catch {
      setFollowedIds((prev) => {
        const next = new Set(prev);
        next.has(profileId) ? next.delete(profileId) : next.add(profileId);
        return next;
      });
    }
  };

  return (
    <div className="flex gap-6 items-start">
      {/* Center column */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Hero header */}
        <div className="bg-white rounded-2xl shadow-sm border border-[color:var(--line)] p-7">
          <p className="font-dm-sans text-[12px] font-semibold text-orange-500 uppercase tracking-widest mb-3">
            🔍 Discover
          </p>
          <h1 className="font-playfair text-[36px] font-bold leading-[1.2]">
            <span className="text-gray-900">Find your </span>
            <span className="text-orange-500 italic">fundi.</span>
          </h1>
          <p className="font-dm-sans text-[15px] text-gray-500 leading-relaxed mt-2 max-w-[480px]">
            Browse skilled professionals across the world — by craft, by location, by the work they show.
          </p>

          {/* Search row */}
          <div className="flex gap-2.5 items-center mt-5 flex-wrap sm:flex-nowrap">
            {/* Text search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by name, profession, or skill..."
                className="w-full h-12 pl-11 pr-4 bg-white border border-gray-200 rounded-xl font-dm-sans text-[14px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
              />
            </div>

            {/* Location input */}
            <div className="relative w-full sm:w-56 shrink-0">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="e.g. Nairobi, London..."
                className="w-full h-12 pl-10 pr-4 bg-white border border-gray-200 rounded-xl font-dm-sans text-[14px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
              />
            </div>

            {/* Search button */}
            <button
              onClick={handleSearch}
              className="flex items-center gap-1.5 h-12 px-6 bg-orange-500 text-white rounded-xl font-dm-sans text-[14px] font-semibold hover:bg-orange-600 transition-colors shrink-0 shadow-[0_2px_10px_-2px_rgba(249,115,22,0.4)]"
            >
              <Search className="w-4 h-4" strokeWidth={2.5} />
              Search
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 mt-3.5 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => handleProfessionChange("")}
              className={`shrink-0 px-4 py-2 rounded-full font-dm-sans text-[13px] font-medium transition-colors ${
                profession === ""
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-700"
              }`}
            >
              All
            </button>
            {PILL_PROFESSIONS.map((p) => (
              <button
                key={p}
                onClick={() => handleProfessionChange(profession === p ? "" : p)}
                className={`shrink-0 px-4 py-2 rounded-full font-dm-sans text-[13px] font-medium transition-colors ${
                  profession === p
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Results count */}
          {!isFetching && (
            <p className="font-dm-sans text-[13px] text-gray-400 mt-3">
              {total === 0 ? "No professionals found" : `${total.toLocaleString()} professional${total !== 1 ? "s" : ""} found`}
            </p>
          )}
        </div>

        {/* Profile cards grid */}
        {isFetching && allProfiles.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[color:var(--line)] overflow-hidden">
                <div className="h-[72px] animate-shimmer" />
                <div className="px-4 pt-2 pb-4">
                  <div className="w-[52px] h-[52px] rounded-full animate-shimmer -mt-6 mb-3" />
                  <div className="h-3.5 animate-shimmer rounded w-3/4 mb-2" />
                  <div className="h-3 animate-shimmer rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : allProfiles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[color:var(--line)]">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 ring-1 ring-orange-100 flex items-center justify-center mx-auto mb-5">
              <Search className="w-7 h-7 text-primary" strokeWidth={2} />
            </div>
            <h3 className="font-playfair font-bold text-xl text-[color:var(--ink)] mb-2">No fundis found</h3>
            <p className="font-dm-sans text-[13px] text-[color:var(--ink-soft)] max-w-xs mx-auto leading-relaxed">
              Try a different profession or location — or clear the filters to see everyone.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allProfiles.map((profile: any, i: number) => {
              const isFollowed = followedIds.has(profile.id);
              const gradient = getProfessionGradient(profile.profession);
              const initialColor = getInitialColor(profile.fullName);
              return (
                <Link
                  key={`${profile.id}-${i}`}
                  href={`/profile/${profile.username}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Banner */}
                  <div
                    className="h-[72px] overflow-hidden relative"
                    style={{ background: gradient }}
                  >
                    {profile.bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.bannerUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.06) 8px, rgba(0,0,0,0.06) 9px)",
                        }}
                      />
                    )}
                  </div>

                  {/* Avatar + badge row */}
                  <div className="relative -mt-6 px-4">
                    <div
                      className={`w-[52px] h-[52px] rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-white text-[18px] ${
                        profile.avatarUrl ? "" : initialColor
                      }`}
                    >
                      {profile.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-dm-sans">{profile.fullName?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    {profile.profession && (
                      <span className="absolute top-0 right-4 bg-orange-50 text-[color:var(--orange-700)] border border-orange-100 rounded-full px-3 py-1 font-dm-sans text-[11px] font-semibold uppercase tracking-wide">
                        {profile.profession}
                      </span>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="px-4 pt-2 pb-0">
                    <p className="font-dm-sans text-[15px] font-semibold text-gray-900 mt-1 truncate">
                      {profile.fullName}
                    </p>
                    <p className="font-dm-sans text-[12px] text-gray-400 mt-0.5">
                      @{profile.username}
                    </p>

                    {profile.location && (
                      <div className="flex items-center gap-1 mt-2">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="font-dm-sans text-[13px] text-gray-500 truncate">{profile.location}</span>
                      </div>
                    )}

                    {profile.bio && (
                      <p className="font-dm-sans text-[13px] text-gray-400 italic mt-2 line-clamp-1">
                        {profile.bio.slice(0, 60)}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2.5">
                      <span className="font-dm-sans text-[13px]">
                        <span className="font-semibold text-gray-900 tabular-nums">
                          {Number(profile.followersCount ?? 0).toLocaleString()}
                        </span>
                        <span className="text-[11px] text-gray-400 ml-1">followers</span>
                      </span>
                      {profile.postsCount != null && (
                        <span className="font-dm-sans text-[13px]">
                          <span className="font-semibold text-gray-900 tabular-nums">
                            {Number(profile.postsCount).toLocaleString()}
                          </span>
                          <span className="text-[11px] text-gray-400 ml-1">posts</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="flex items-center justify-between border-t border-gray-50 mx-4 mt-3 pt-3 pb-4">
                    <span className="flex items-center gap-1 font-dm-sans text-[13px] text-orange-500 font-medium">
                      View profile
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <button
                      onClick={(e) => handleFollow(e, profile.id)}
                      className={`font-dm-sans text-[12px] font-medium px-3 py-1 rounded-full transition-all ${
                        isFollowed
                          ? "bg-orange-500 text-white"
                          : "border border-orange-300 text-orange-500 hover:bg-orange-50"
                      }`}
                    >
                      {isFollowed ? "Following ✓" : "Follow"}
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {allProfiles.length > 0 && page < totalPages && (
          <div className="mt-8 mb-2 text-center">
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={isFetching}
              className="inline-flex items-center gap-2 h-11 px-8 bg-white border border-gray-200 rounded-xl font-dm-sans text-[14px] font-medium text-gray-700 hover:border-orange-300 hover:text-orange-500 transition-colors disabled:opacity-50"
            >
              {isFetching ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load more professionals
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Right sidebar — xl only */}
      <aside className="hidden xl:block w-72 shrink-0 sticky top-20">
        <BrowseRightSidebar
          activeProfession={profession}
          onProfessionClick={handleProfessionChange}
          activeLocation={location}
          onLocationClick={handleLocationFilter}
        />
      </aside>
    </div>
  );
}
