"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, UserPlus, CheckCircle2 } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useBrowseProfilesQuery, useGetProfileQuery, useToggleFollowMutation } from "@/store/apiSlice";

const TRENDING_PROFESSIONS = ['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Mason', 'Welder'];

function SectionLabel({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-3.5 h-3.5 text-[color:var(--orange-700)]" strokeWidth={2.5} />
      <h3 className="font-dm-sans text-[10.5px] font-bold text-[color:var(--ink-soft)] uppercase tracking-[0.14em]">
        {children}
      </h3>
    </div>
  );
}

export default function RightSidebar() {
  const { profile: me } = useAppSelector((s) => s.auth);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [toggleFollow] = useToggleFollowMutation();

  const { data: browseData } = useBrowseProfilesQuery({ limit: 6 });
  const suggested = ((browseData as any)?.data?.profiles ?? [])
    .filter((p: any) => p.username !== me?.username)
    .slice(0, 3);

  const { data: profileData } = useGetProfileQuery(me?.username ?? '', { skip: !me?.username });
  const myProfile = (profileData as any)?.data;
  const missingItems = [
    !myProfile?.avatarUrl && 'Add a profile photo',
    !myProfile?.bio && 'Write your bio',
    !myProfile?.phone && 'Add your phone number',
  ].filter(Boolean) as string[];
  const profileScore = myProfile
    ? ((myProfile.avatarUrl ? 1 : 0) + (myProfile.bio ? 1 : 0) + (myProfile.phone ? 1 : 0)) / 3 * 100
    : 100;

  const handleFollow = async (profileId: string) => {
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
    <div className="space-y-3">
      {/* Who to follow */}
      <div className="bg-white rounded-2xl border border-[color:var(--line)] shadow-[0_1px_3px_rgba(40,20,5,0.05)] p-4">
        <SectionLabel icon={UserPlus}>People to follow</SectionLabel>

        {suggested.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">No suggestions right now.</p>
        ) : (
          <div className="space-y-3.5">
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
                        ? 'bg-[color:var(--ink)] text-white'
                        : 'bg-primary text-white hover:bg-[color:var(--orange-600)] shadow-[0_2px_8px_-2px_rgba(249,115,22,0.4)]'
                    }`}
                  >
                    {isFollowed ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <Link href="/browse" className="block mt-4 pt-3 border-t border-[color:var(--line)] text-[11px] text-primary font-semibold hover:underline underline-offset-2 font-dm-sans">
          Discover more fundis →
        </Link>
      </div>

      {/* Trending professions */}
      <div className="bg-white rounded-2xl border border-[color:var(--line)] shadow-[0_1px_3px_rgba(40,20,5,0.05)] p-4">
        <SectionLabel icon={TrendingUp}>Trending trades</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {TRENDING_PROFESSIONS.map((name, i) => (
            <Link
              key={name}
              href={`/browse?profession=${encodeURIComponent(name)}`}
              className="group inline-flex items-center gap-1.5 bg-[color:var(--line-soft)] hover:bg-orange-50 text-[color:var(--ink)] hover:text-[color:var(--orange-700)] border border-transparent hover:border-orange-200 text-[11px] px-2.5 py-1.5 rounded-lg transition-all font-medium"
            >
              <span className="text-[9px] text-primary font-bold tabular-nums opacity-60 group-hover:opacity-100">{String(i + 1).padStart(2, "0")}</span>
              {name}
            </Link>
          ))}
        </div>
      </div>

      {/* Complete your profile */}
      {missingItems.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-[#fff7ed] p-4 shadow-[0_2px_8px_-4px_rgba(249,115,22,0.15)]">
          <SectionLabel icon={CheckCircle2}>Complete your profile</SectionLabel>
          <div className="mb-3">
            <div className="flex justify-between items-baseline text-[11px] mb-1.5 font-dm-sans">
              <span className="text-[color:var(--ink-soft)] font-medium">Strength</span>
              <span className="font-playfair text-[15px] font-bold text-[color:var(--orange-700)]">{Math.round(profileScore)}%</span>
            </div>
            <div className="h-2 bg-white/70 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-primary rounded-full transition-all duration-700 shadow-[0_1px_4px_rgba(249,115,22,0.4)]"
                style={{ width: `${profileScore}%` }}
              />
            </div>
          </div>
          <p className="text-[12px] text-[color:var(--ink)] font-dm-sans mb-3 leading-relaxed">
            <span className="text-[color:var(--orange-700)] font-semibold">Next:</span> {missingItems[0]}
          </p>
          <Link href="/settings" className="inline-flex items-center text-[11px] bg-primary text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[color:var(--orange-600)] transition-colors font-dm-sans shadow-[0_2px_8px_-2px_rgba(249,115,22,0.4)]">
            Complete now →
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="px-2 pt-2 text-[10px] text-gray-400 font-dm-sans leading-relaxed">
        <p>Fundi · Built for skilled workers</p>
      </div>
    </div>
  );
}
