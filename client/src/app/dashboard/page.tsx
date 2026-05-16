"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useAppSelector } from "@/store/hooks";
import { useGetProfileStatsQuery, useGetProfileActivityQuery, useGetAnalyticsQuery, useGetProfilePostsQuery, useGetProfileQuery } from "@/store/apiSlice";
import { useToastContext } from "@/context/ToastContext";
import PostCard from "@/components/PostCard";

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ACTIVITY_COLORS: Record<string, string> = {
  view:    'bg-orange-100 text-orange-600',
  follow:  'bg-green-100 text-green-600',
  like:    'bg-red-100 text-red-500',
  comment: 'bg-blue-100 text-blue-600',
};

const ACTIVITY_ICONS: Record<string, React.ReactElement> = {
  view: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  follow: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  like: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  ),
  comment: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
};

export default function DashboardPage() {
  const { user, profile: me } = useAppSelector((s) => s.auth);
  const { success } = useToastContext();
  const [profileUrl, setProfileUrl] = useState('');
  const [tipsDismissed, setTipsDismissed] = useState(false);

  useEffect(() => {
    if (me?.username) {
      setProfileUrl(`${window.location.origin}/profile/${me.username}`);
    }
    setTipsDismissed(localStorage.getItem('fundi_tips_dismissed') === '1');
  }, [me?.username]);

  const { data: statsRes, isFetching: statsFetching } = useGetProfileStatsQuery();
  const { data: activityRes } = useGetProfileActivityQuery();
  const { data: analyticsRes } = useGetAnalyticsQuery();
  const { data: postsRes } = useGetProfilePostsQuery(
    { username: me?.username ?? '' },
    { skip: !me?.username }
  );
  const { data: profileData } = useGetProfileQuery(me?.username ?? '', { skip: !me?.username });

  const stats = (statsRes as any)?.data;
  const activity: any[] = (activityRes as any)?.data ?? [];
  const daily: any[] = (analyticsRes as any)?.data?.daily ?? [];
  const recentPosts: any[] = ((postsRes as any)?.data ?? []).slice(0, 3);
  const myProfile = (profileData as any)?.data;

  const profileScore = stats?.profileScore ?? 0;
  const maxDailyCount = Math.max(...daily.map((d: any) => d.count), 1);

  const checklistItems = [
    { label: 'Profile photo', done: !!myProfile?.avatarUrl, href: '/settings' },
    { label: 'Bio written', done: !!myProfile?.bio, href: '/settings' },
    { label: 'Phone number', done: !!myProfile?.phone, href: '/settings' },
    { label: 'Services listed', done: (myProfile?.services?.length ?? 0) > 0, href: '/settings' },
  ];

  const dismissTips = () => {
    localStorage.setItem('fundi_tips_dismissed', '1');
    setTipsDismissed(true);
  };

  const copyProfileUrl = () => {
    navigator.clipboard.writeText(profileUrl).then(() => success('Profile link copied!'));
  };

  return (
    <div className="flex gap-6 items-start">
      {/* Main column */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-playfair font-bold text-2xl text-gray-900">
            Welcome back, {user?.firstName}
          </h1>
          <p className="font-dm-sans text-sm text-gray-400 mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsFetching ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            ))
          ) : (
            <>
              <StatCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                value={stats?.totalViews ?? 0}
                label="Profile views"
                trend={`+${stats?.weeklyViews ?? 0} this week`}
              />
              <StatCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                value={stats?.followersCount ?? 0}
                label="Followers"
                trend={`${stats?.followingCount ?? 0} following`}
              />
              <StatCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
                value={stats?.postsCount ?? 0}
                label="Posts published"
                trend="Keep sharing your work"
              />
              <StatCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                value={`${profileScore}%`}
                label="Profile complete"
                trend={profileScore < 100 ? 'Add info to reach 100%' : 'Profile complete!'}
              />
            </>
          )}
        </div>

        {/* Analytics + Completeness ring */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Bar chart */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-dm-sans text-sm font-semibold text-gray-900">Profile views</p>
            <p className="font-dm-sans text-xs text-gray-400 mb-4">Last 7 days</p>
            {daily.length > 0 ? (
              <div className="flex items-end gap-1.5 h-24">
                {daily.map((d: any) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative flex-1 w-full flex items-end">
                      <div
                        className="w-full bg-primary rounded-t-sm transition-all"
                        style={{ height: `${(d.count / maxDailyCount) * 100}%`, minHeight: d.count > 0 ? '4px' : '2px' }}
                      />
                      {d.count > 0 && (
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                          {d.count}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(d.date).toLocaleDateString('en', { weekday: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center">
                <p className="text-xs text-gray-400 font-dm-sans">No view data yet</p>
              </div>
            )}
          </div>

          {/* Completeness ring */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-dm-sans text-sm font-semibold text-gray-900">Profile strength</p>
            <p className="font-dm-sans text-xs text-gray-400 mb-4">Complete your profile</p>
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="38" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle
                    cx="48" cy="48" r="38" fill="none"
                    stroke="#f97316" strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 38}
                    strokeDashoffset={2 * Math.PI * 38 * (1 - profileScore / 100)}
                    strokeLinecap="round"
                    transform="rotate(-90 48 48)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-playfair text-xl font-bold text-orange-500">{profileScore}%</span>
                  <span className="font-dm-sans text-[10px] text-gray-400">Complete</span>
                </div>
              </div>
              <div className="w-full space-y-1.5">
                {checklistItems.map(({ label, done, href }) => (
                  <div key={label} className="flex items-center gap-2">
                    {done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-500 shrink-0">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-400 shrink-0">
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                    )}
                    <span className={`font-dm-sans text-xs flex-1 ${done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{label}</span>
                    {!done && (
                      <Link href={href} className="font-dm-sans text-[10px] text-primary hover:underline">Add</Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-dm-sans text-sm font-semibold text-gray-900">Recent activity</p>
            <Link href="/profile" className="font-dm-sans text-xs text-primary hover:underline">View all</Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-xs text-gray-400 font-dm-sans py-4 text-center">
              No activity yet. Share your profile to get started.
            </p>
          ) : (
            <div>
              {activity.slice(0, 5).map((event: any, i: number) => (
                <div key={i}>
                  <div className="flex items-center gap-3 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ACTIVITY_COLORS[event.type] ?? 'bg-gray-100 text-gray-500'}`}>
                      {ACTIVITY_ICONS[event.type]}
                    </div>
                    <p className="font-dm-sans text-sm text-gray-700 flex-1">{event.message}</p>
                    <span className="font-dm-sans text-xs text-gray-400 shrink-0">{timeAgo(event.createdAt)}</span>
                  </div>
                  {i < Math.min(activity.length, 5) - 1 && <hr className="border-gray-100" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent posts + Share card */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Recent posts */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-dm-sans text-sm font-semibold text-gray-900">Your posts</p>
              <Link href="/post/new" className="font-dm-sans text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primaryDark transition-colors">
                New post
              </Link>
            </div>
            {recentPosts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <p className="font-dm-sans text-sm text-gray-400">No posts yet.</p>
                <Link href="/post/new" className="mt-3 inline-block font-dm-sans text-xs text-primary hover:underline">
                  Create your first post →
                </Link>
              </div>
            ) : (
              recentPosts.map((post: any) => <PostCard key={post.id} post={post} />)
            )}
            {recentPosts.length > 0 && me?.username && (
              <Link href={`/profile/${me.username}`} className="block font-dm-sans text-xs text-primary hover:underline text-center pt-1">
                View all posts →
              </Link>
            )}
          </div>

          {/* Share profile */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-dm-sans text-sm font-semibold text-gray-900 mb-4">Share your profile</p>

            {/* QR code */}
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="p-2 bg-orange-50 rounded-xl">
                <QRCodeSVG
                  value={profileUrl || 'https://fundimtaalam.com'}
                  size={96}
                  fgColor="#c2410c"
                  bgColor="#fff7ed"
                />
              </div>
              <p className="font-dm-sans text-[10px] text-gray-400">Scan to view profile</p>
            </div>

            {/* Profile URL */}
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 mb-3">
              <p className="font-dm-sans text-xs text-orange-700 truncate flex-1">{profileUrl || '...'}</p>
              <button onClick={copyProfileUrl} className="shrink-0 text-orange-500 hover:text-orange-700 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(profileUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full font-dm-sans text-xs text-green-700 border border-green-300 bg-white rounded-xl px-3 py-2 hover:bg-green-50 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                Share on WhatsApp
              </a>

              {/* Copy */}
              <button
                onClick={copyProfileUrl}
                className="flex items-center gap-2 w-full font-dm-sans text-xs text-gray-700 border border-gray-200 bg-white rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy profile link
              </button>

              {/* View profile */}
              {me?.username && (
                <Link
                  href={`/profile/${me.username}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full font-dm-sans text-xs text-white bg-primary rounded-xl px-3 py-2 hover:bg-primaryDark transition-colors"
                >
                  View my profile →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard right sidebar */}
      <aside className="hidden xl:block w-72 shrink-0 sticky top-20 space-y-4">

        {/* Profile preview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
              {me?.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={me.avatarUrl} alt="" className="w-full h-full object-cover" />
                : me?.fullName?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-dm-sans text-sm font-semibold text-gray-900 truncate">{me?.fullName}</p>
              {me?.profession && (
                <span className="inline-block text-[10px] bg-orange-50 text-primary border border-orange-100 px-2 py-0.5 rounded-full font-medium">
                  {me.profession}
                </span>
              )}
            </div>
          </div>
          {me?.username && (
            <Link
              href={`/profile/${me.username}`}
              target="_blank"
              className="block text-center font-dm-sans text-xs text-primary border border-orange-200 rounded-xl py-2 hover:bg-orange-50 transition-colors"
            >
              Preview public profile
            </Link>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-dm-sans text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Quick actions
          </h3>
          <div className="space-y-2">
            {[
              { label: 'Edit profile',     href: '/settings' },
              { label: 'Add work photos',  href: '/settings' },
              { label: 'Create a post',    href: '/post/new' },
              { label: 'Browse community', href: '/feed' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="block w-full font-dm-sans text-xs text-orange-600 border border-orange-200 rounded-xl px-3 py-2.5 hover:bg-orange-50 transition-colors text-center"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Getting started tips */}
        {!tipsDismissed && profileScore < 80 && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 relative">
            <button
              onClick={dismissTips}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <h3 className="font-dm-sans text-[11px] font-semibold text-orange-700 uppercase tracking-wide mb-2">
              Getting started
            </h3>
            <ul className="space-y-1.5">
              {[
                'Upload a clear profile photo',
                'Write a short bio about your work',
                'Share your first post to get discovered',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5 shrink-0">•</span>
                  <span className="font-dm-sans text-xs text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

function StatCard({ icon, value, label, trend }: { icon: React.ReactNode; value: number | string; label: string; trend: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <p className="font-playfair text-3xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="font-dm-sans text-xs text-gray-400 mt-1">{label}</p>
      <p className="font-dm-sans text-xs text-green-500 mt-0.5">{trend}</p>
    </div>
  );
}
