"use client";

import { Phone, MessageCircle, GraduationCap, Briefcase } from "lucide-react";
import { THEME_COLORS } from "./ThemeSelector";
import EditableField from "./EditableField";
import type { SetupState } from "@/hooks/useProfileSetup";

interface Props {
  state: SetupState;
  editMode?: boolean;
  onField?: (key: keyof SetupState, value: string) => void;
  onServiceEdit?: (i: number, value: string) => void;
}

function Placeholder({ text }: { text: string }) {
  return <span className="text-gray-300 italic text-sm">{text}</span>;
}

export default function ProfilePreview({ state, editMode, onField, onServiceEdit }: Props) {
  const color = THEME_COLORS[state.theme] || THEME_COLORS.orange;
  const initials = state.fullName
    ? state.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const edit = (key: keyof SetupState) => editMode && onField
    ? (v: string) => onField(key, v)
    : undefined;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 max-w-sm w-full mx-auto">

      {/* ── Banner + Avatar ── */}
      <div className="relative">
        {/* Banner */}
        <div className="h-28 w-full overflow-hidden">
          {state.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.bannerUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }}
            />
          )}
        </div>

        {/* Avatar — overlaps banner bottom edge */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2">
          {state.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.avatarUrl}
              alt=""
              className="w-20 h-20 rounded-full object-cover"
              style={{ border: "3px solid white" }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold font-playfair"
              style={{ backgroundColor: color, border: "3px solid white" }}
            >
              {initials}
            </div>
          )}
        </div>
      </div>

      {/* ── Name / Profession / Tagline ── */}
      <div className="pt-14 pb-3 px-6 text-center">
        {editMode && edit("fullName") ? (
          <EditableField
            value={state.fullName}
            onSave={edit("fullName")!}
            placeholder="Your name"
            className="text-xl font-bold font-playfair text-gray-900 block"
          />
        ) : (
          <h2 className="text-xl font-bold font-playfair text-gray-900">
            {state.fullName || <Placeholder text="Your Name" />}
          </h2>
        )}

        <div className="flex items-center justify-center gap-1 mt-0.5 text-gray-500 text-sm">
          {editMode && edit("profession") ? (
            <EditableField value={state.profession} onSave={edit("profession")!} placeholder="Profession" className="text-gray-500" />
          ) : (
            <span>{state.profession || <Placeholder text="Profession" />}</span>
          )}
          {(state.profession || state.location) && <span>·</span>}
          {editMode && edit("location") ? (
            <EditableField value={state.location} onSave={edit("location")!} placeholder="Location" className="text-gray-500" />
          ) : (
            <span>{state.location || <Placeholder text="Location" />}</span>
          )}
        </div>

        <div className="mt-1.5 text-gray-400 text-sm italic">
          {editMode && edit("tagline") ? (
            <EditableField value={state.tagline} onSave={edit("tagline")!} placeholder="Your tagline" className="text-gray-400 italic" />
          ) : (
            state.tagline || <Placeholder text="Your tagline..." />
          )}
        </div>
      </div>

      {/* ── Contact buttons ── */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          type="button"
          disabled={!state.phone}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: color }}
        >
          <Phone size={14} /> Call
        </button>
        <button
          type="button"
          disabled={!state.phone && !state.whatsapp}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: color }}
        >
          <MessageCircle size={14} /> WhatsApp
        </button>
      </div>

      {/* ── About ── */}
      <div className="px-4 pt-2 pb-2 border-t border-gray-50">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">
          About {state.fullName?.split(" ")[0] || "Me"}
        </h3>
        <div className="text-sm text-gray-600 leading-relaxed">
          {editMode && edit("bio") ? (
            <EditableField value={state.bio} onSave={edit("bio")!} placeholder="Your bio appears here..." multiline className="text-gray-600 text-sm" />
          ) : (
            state.bio || <Placeholder text="Your bio will appear here..." />
          )}
        </div>
        {state.yearsExperience > 0 && (
          <span
            className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {state.yearsExperience} yrs experience
          </span>
        )}
      </div>

      {/* ── Services ── */}
      {state.services.length > 0 && (
        <div className="px-4 py-2">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">What I Offer</h3>
          <div className="flex flex-wrap gap-1.5">
            {state.services.map((s, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: color }}
              >
                {editMode && onServiceEdit ? (
                  <EditableField value={s} onSave={(v) => onServiceEdit(i, v)} className="text-white text-xs" />
                ) : s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Education ── */}
      {state.education.length > 0 && (
        <div className="px-4 py-2">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Education</h3>
          <div className="space-y-2">
            {state.education.map((item, i) => (
              <div key={i} className="flex gap-2.5">
                <GraduationCap size={14} className="text-gray-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700 font-medium leading-tight">{item.degree}</p>
                  <p className="text-xs text-gray-400">{item.institution}{item.year ? ` · ${item.year}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Experience ── */}
      {state.experience.length > 0 && (
        <div className="px-4 py-2">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Experience</h3>
          <div className="space-y-2">
            {state.experience.map((item, i) => (
              <div key={i} className="flex gap-2.5">
                <Briefcase size={14} className="text-gray-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700 font-medium leading-tight">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.company}{item.duration ? ` · ${item.duration}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Gallery ── */}
      {state.photos.length > 0 ? (
        <div className="px-4 py-2">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">My Work</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {state.photos.slice(0, 4).map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="aspect-square rounded-lg object-cover w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 py-2">
          <div className="border-2 border-dashed border-gray-100 rounded-xl py-4 flex items-center justify-center gap-2 text-gray-300 text-xs">
            <span>Add work photos</span>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="px-4 py-3 text-center">
        <p className="text-[10px] text-gray-300">Powered by Fundi</p>
      </div>
    </div>
  );
}
