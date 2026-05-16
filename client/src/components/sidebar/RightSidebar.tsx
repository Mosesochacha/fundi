"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { useBrowseProfilesQuery, useGetProfileQuery, useToggleFollowMutation } from "@/store/apiSlice";

const TRENDING_PROFESSIONS = ['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Mason', 'Welder'];

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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="font-dm-sans text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Who to follow
        </h3>

        {suggested.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">No suggestions right now.</p>
        ) : (
          <div className="space-y-3">
            {suggested.map((person: any) => {
              const isFollowed = followedIds.has(person.id);
              return (
                <div key={person.id} className="flex items-center gap-2.5">
                  <Link href={`/profile/${person.username}`} className="shrink-0">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm overflow-hidden">
                      {person.avatarUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : person.fullName?.[0]?.toUpperCase()}
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/profile/${person.username}`}>
                      <p className="text-sm font-medium text-gray-900 truncate hover:text-primary transition-colors">{person.fullName}</p>
                    </Link>
                    <p className="text-xs text-gray-400 truncate">{person.profession}</p>
                  </div>
                  <button
                    onClick={() => handleFollow(person.id)}
                    className={`shrink-0 text-xs px-3 py-1 rounded-full transition-all ${
                      isFollowed
                        ? 'bg-primary text-white'
                        : 'border border-orange-500 text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    {isFollowed ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <Link href="/browse" className="block mt-3 text-xs text-primary font-medium hover:underline font-dm-sans">
          See more →
        </Link>
      </div>

      {/* Trending professions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="font-dm-sans text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Trending professions
        </h3>
        <div className="flex flex-wrap gap-2">
          {TRENDING_PROFESSIONS.map((name) => (
            <Link
              key={name}
              href={`/browse?profession=${encodeURIComponent(name)}`}
              className="bg-orange-50 text-orange-700 border border-orange-100 text-xs px-3.5 py-1.5 rounded-full hover:bg-orange-100 transition-colors font-dm-sans"
            >
              {name}
            </Link>
          ))}
        </div>
      </div>

      {/* Complete your profile */}
      {missingItems.length > 0 && (
        <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4">
          <h3 className="font-dm-sans text-[11px] font-semibold text-orange-700 uppercase tracking-wide mb-2">
            Complete your profile
          </h3>
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1 font-dm-sans">
              <span>Profile strength</span>
              <span>{Math.round(profileScore)}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${profileScore}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-600 font-dm-sans mb-2">{missingItems[0]}</p>
          <Link href="/settings" className="text-xs text-primary font-medium hover:underline font-dm-sans">
            Complete now →
          </Link>
        </div>
      )}
    </div>
  );
}
