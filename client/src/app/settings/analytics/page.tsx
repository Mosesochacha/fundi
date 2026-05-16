"use client";

import { useEffect, useState } from "react";
import { Eye, TrendingUp, Calendar, Share2 } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

interface DayCount { date: string; count: number }
interface Referrers { whatsapp: number; instagram: number; google: number; direct: number }
interface Analytics {
  totalViews: number;
  viewsToday: number;
  viewsThisWeek: number;
  daily: DayCount[];
  referrers: Referrers;
}

export default function AnalyticsPage() {
  const { accessToken } = useAppSelector((s) => s.auth);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/profile/analytics`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((j) => { if (j?.data) setData(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-gray-500">Could not load analytics.</p>;
  }

  const maxCount = Math.max(...data.daily.map((d) => d.count), 1);

  const STAT_CARDS = [
    { label: "Total views", value: data.totalViews.toLocaleString(), icon: Eye, color: "bg-orange-50 text-[#f97316]" },
    { label: "This week", value: data.viewsThisWeek.toLocaleString(), icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
    { label: "Today", value: data.viewsToday.toLocaleString(), icon: Calendar, color: "bg-green-50 text-green-600" },
  ];

  const REFERRER_LABELS: Record<string, string> = {
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    google: "Google",
    direct: "Direct / Other",
  };

  const totalRefs = Object.values(data.referrers).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">How people are finding your profile</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* 7-day bar chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-5">Views — last 7 days</h2>
        <div className="flex items-end gap-2 h-32">
          {data.daily.map(({ date, count }) => {
            const pct = (count / maxCount) * 100;
            const label = new Date(date + "T00:00:00").toLocaleDateString("en-KE", { weekday: "short" });
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400">{count > 0 ? count : ""}</span>
                <div className="w-full flex items-end" style={{ height: "80px" }}>
                  <div
                    className="w-full bg-[#f97316] rounded-t-md transition-all"
                    style={{ height: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referrer breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-5">
          <Share2 className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Traffic sources (this week)</h2>
        </div>
        <div className="space-y-3">
          {Object.entries(data.referrers).map(([key, count]) => {
            const pct = Math.round((count / totalRefs) * 100);
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">{REFERRER_LABELS[key]}</span>
                  <span className="text-gray-400">{count} ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#f97316] rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
