"use client";

import {
  Award,
  BookOpen,
  CircleCheck,
  CircleDashed,
  GraduationCap,
  ImagePlus,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  Share2,
  ShieldCheck,
  Trash2,
  Wrench,
  X,
  ZoomIn,
} from "lucide-react";
import { useRef, useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import {
  useAddCertification,
  useDeleteCertification,
} from "@/features/worker/certifications";
import {
  useAddEducation,
  useDeleteEducation,
} from "@/features/worker/education";
import {
  useAddExperience,
  useDeleteExperience,
} from "@/features/worker/experience";
import {
  useAddPhoto,
  useDeletePhoto,
  useUploadPhoto,
} from "@/features/worker/portfolio";
import {
  useUpdateAbout,
  useUpdateRate,
  useUpdateServiceArea,
  useUpdateServices,
} from "@/features/worker/profile";
import { symbolOf } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type {
  Certification,
  EducationItem,
  ExperienceItem,
  PortfolioPhoto,
  WorkerProfileData,
} from "./workerProfileData";

type Mode = "own" | "public";

/* ── Shared class strings (ported from workerProfile.css) ─────────────────── */
const CARD = "bg-white border border-border rounded-xl p-[18px]";
const CARDHEAD = "flex items-center justify-between mb-3.5";
const TITLE = "font-serif text-base font-medium text-ink";
const BTN_BASE =
  "font-sans cursor-pointer rounded-lg font-medium transition-all duration-150 inline-flex items-center justify-center gap-1.5";
const BTN =
  "bg-gold text-navy border border-gold py-[9px] px-4 text-sm hover:bg-gold-dark hover:border-gold-dark disabled:opacity-60 disabled:cursor-not-allowed";
const BTN_OUTLINE =
  "bg-white text-ink-2 border border-border py-[9px] px-4 text-sm hover:border-gold hover:text-ink disabled:opacity-60 disabled:cursor-not-allowed";
const BTN_SM = "py-[7px] px-3.5 text-sm rounded-[7px]";
const ACT =
  "bg-cream text-ink-2 border-[0.5px] border-border py-[5px] px-2.5 text-[11px] rounded-[7px] hover:border-gold hover:text-gold-dark";
const LINK =
  "bg-transparent border-none text-gold-dark text-sm cursor-pointer font-sans no-underline hover:text-navy";
const INPUT =
  "w-full border border-border rounded-lg py-2 px-3 text-sm font-sans text-ink bg-cream outline-none focus:border-gold focus:bg-white";
const TEXTAREA =
  "w-full min-h-[110px] border border-border rounded-lg py-2.5 px-3 text-sm font-sans text-ink bg-cream outline-none leading-[1.6] resize-y focus:border-gold focus:bg-white";
const EDITROW = "flex gap-2 mt-3 items-center";
const FORM =
  "flex flex-col gap-2 mt-3 p-3 bg-cream border border-border rounded-[10px]";
const FOLIO_IMG =
  "relative aspect-[4/3] bg-cream-2 bg-cover bg-center flex items-center justify-center text-ink-3";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

function Stars({ value }: { value: number }) {
  return (
    <span
      className="text-gold text-sm tracking-[1px]"
      role="img"
      aria-label={`${value} out of 5`}
    >
      {"★".repeat(Math.round(value))}
      {"☆".repeat(5 - Math.round(value))}
    </span>
  );
}

function eduIcon(type: EducationItem["type"]) {
  if (type === "training") return <Wrench size={16} />;
  if (type === "course") return <BookOpen size={16} />;
  return <GraduationCap size={16} />;
}

export default function WorkerProfile({
  mode,
  initialData,
  onMessage,
  onHire,
}: {
  mode: Mode;
  initialData: WorkerProfileData;
  /** Public-view actions (employer/visitor). Wired by the page. */
  onMessage?: () => void;
  onHire?: () => void;
}) {
  const own = mode === "own";
  const { success } = useToastContext();
  const [data, setData] = useState<WorkerProfileData>(initialData);

  // Best-effort persistence to the worker API. Local state is updated
  // optimistically; a failed request is swallowed (the user keeps their edit).
  const updateAbout = useUpdateAbout();
  const updateServices = useUpdateServices();
  const updateRate = useUpdateRate();
  const updateServiceArea = useUpdateServiceArea();
  const addPhotoMutation = useAddPhoto();
  const deletePhotoMutation = useDeletePhoto();
  const addExperienceMutation = useAddExperience();
  const deleteExperienceMutation = useDeleteExperience();
  const addCertificationMutation = useAddCertification();
  const deleteCertificationMutation = useDeleteCertification();
  const addEducationMutation = useAddEducation();
  const deleteEducationMutation = useDeleteEducation();

  // Inline-edit state
  const [editAbout, setEditAbout] = useState(false);
  const [aboutDraft, setAboutDraft] = useState(data.about);
  const [editServices, setEditServices] = useState(false);
  const [serviceInput, setServiceInput] = useState("");
  const [editAreas, setEditAreas] = useState(false);
  const [areaInput, setAreaInput] = useState("");
  const [editRate, setEditRate] = useState(false);
  const [rateDraft, setRateDraft] = useState(String(data.dailyRate));

  // Add-form toggles
  const [addPhoto, setAddPhoto] = useState(false);
  const [addExp, setAddExp] = useState(false);
  const [addCert, setAddCert] = useState(false);
  const [addEdu, setAddEdu] = useState(false);

  const set = (patch: Partial<WorkerProfileData>) =>
    setData((d) => ({ ...d, ...patch }));

  // ── About ──
  const saveAbout = () => {
    set({ about: aboutDraft });
    updateAbout.mutate({ about: aboutDraft });
    setEditAbout(false);
  };

  // ── Services ──
  const addService = (v: string) => {
    const t = v.trim();
    if (!t || data.services.includes(t)) return;
    const services = [...data.services, t];
    set({ services });
    updateServices.mutate({ services });
    setServiceInput("");
  };
  const removeService = (t: string) => {
    const services = data.services.filter((s) => s !== t);
    set({ services });
    updateServices.mutate({ services });
  };

  // ── Service area ──
  const addArea = (v: string) => {
    const t = v.trim();
    if (!t || data.serviceAreas.includes(t)) return;
    const areas = [...data.serviceAreas, t];
    set({ serviceAreas: areas });
    updateServiceArea.mutate({ areas });
    setAreaInput("");
  };
  const removeArea = (t: string) => {
    const areas = data.serviceAreas.filter((a) => a !== t);
    set({ serviceAreas: areas });
    updateServiceArea.mutate({ areas });
  };

  // ── Rate ──
  const saveRate = () => {
    const rate = Math.max(0, Number(rateDraft.replace(/[^0-9]/g, "")) || 0);
    set({ dailyRate: rate });
    updateRate.mutate({ dailyRate: rate });
    setEditRate(false);
  };

  // ── Portfolio ──
  const removePhoto = (id: string) => {
    set({ portfolio: data.portfolio.filter((p) => p.id !== id) });
    deletePhotoMutation.mutate(id);
  };
  const createPhoto = (p: Omit<PortfolioPhoto, "id">) => {
    const photo: PortfolioPhoto = { ...p, id: uid() };
    set({ portfolio: [...data.portfolio, photo] });
    addPhotoMutation.mutate(p);
    setAddPhoto(false);
  };

  // ── Experience ──
  const removeExp = (id: string) => {
    set({ experience: data.experience.filter((e) => e.id !== id) });
    deleteExperienceMutation.mutate(id);
  };
  const createExp = (e: Omit<ExperienceItem, "id">) => {
    set({ experience: [{ ...e, id: uid() }, ...data.experience] });
    addExperienceMutation.mutate(e);
    setAddExp(false);
  };

  // ── Certifications ──
  const removeCert = (id: string) => {
    set({ certifications: data.certifications.filter((c) => c.id !== id) });
    deleteCertificationMutation.mutate(id);
  };
  const createCert = (c: Omit<Certification, "id" | "isVerified">) => {
    set({
      certifications: [
        ...data.certifications,
        { ...c, id: uid(), isVerified: false },
      ],
    });
    addCertificationMutation.mutate(c);
    setAddCert(false);
  };

  // ── Education ──
  const removeEdu = (id: string) => {
    set({ education: data.education.filter((e) => e.id !== id) });
    deleteEducationMutation.mutate(id);
  };
  const createEdu = (e: Omit<EducationItem, "id">) => {
    set({ education: [...data.education, { ...e, id: uid() }] });
    addEducationMutation.mutate(e);
    setAddEdu(false);
  };

  const share = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/worker/${data.id}`
        : "";
    try {
      await navigator.clipboard.writeText(url);
      success("Profile link copied to clipboard");
    } catch {
      success(`Share your profile: ${url}`);
    }
  };

  // Portfolio split: standalone photos vs before/after pairs
  const beforePhotos = data.portfolio.filter((p) => p.isBefore);
  const standalonePhotos = data.portfolio.filter(
    (p) => !p.isBefore && !beforePhotos.some((b) => b.afterPhotoId === p.id),
  );

  // Profile strength
  const checklist = [
    { label: "Phone verified", done: data.phoneVerified },
    { label: "About added", done: data.about.trim().length > 0 },
    { label: "Services listed (3+)", done: data.services.length >= 3 },
    { label: "Work photos added (2+)", done: data.portfolio.length >= 2 },
    { label: "Experience added", done: data.experience.length >= 1 },
    { label: "Certification added", done: data.certifications.length >= 1 },
    { label: "Daily rate set", done: data.dailyRate > 0 },
  ];
  const strengthPct = Math.round(
    (checklist.filter((c) => c.done).length / checklist.length) * 100,
  );
  const maxBucket = Math.max(1, ...data.ratingBreakdown.map((b) => b.count));

  // Show the worker's currency symbol verbatim — no FX conversion.
  const money = (n: number) =>
    `${symbolOf(data.currency)} ${n.toLocaleString()}`;

  // Public-view polish: soften zero-states and hide empty sections so a sparse
  // profile reads as "new" rather than broken. Own view always shows every
  // section (with its add/edit controls) so the worker can fill them in.
  const rateText =
    data.dailyRate > 0 ? `${money(data.dailyRate)}/day` : "Rate on request";
  const hasRightCol =
    data.certifications.length > 0 || data.education.length > 0;
  /** When not own view, hide a section that has no content. */
  const hideIfEmpty = (has: boolean) => !own && !has;

  return (
    <div
      className={cn(
        "font-sans text-ink-2",
        !own && "w-full pb-0 max-lg:pb-[72px]",
      )}
    >
      {/* ── HEADER CARD ── */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="h-24 relative bg-navy bg-[radial-gradient(rgba(201,168,76,0.1)_1px,transparent_1px)] [background-size:20px_20px]">
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold to-transparent" />
        </div>
        <div className="px-5 pb-[18px]">
          <div className="relative w-16 -mt-7">
            <div className="w-16 h-16 rounded-full bg-gold-light border-[3px] border-white text-gold-dark text-xl font-semibold flex items-center justify-center">
              {data.initials}
            </div>
            {data.isAvailable && (
              <span className="absolute bottom-0.5 right-0.5 w-[13px] h-[13px] rounded-full bg-green-400 border-2 border-white" />
            )}
          </div>

          <div className="font-serif text-[22px] font-normal text-ink mt-2.5">
            {data.name}
          </div>
          <div className="text-sm text-ink-2 mt-0.5">
            {data.trade}
            {data.yearsExperience > 0
              ? ` · ${data.yearsExperience} yrs experience`
              : ""}
          </div>
          <div className="inline-flex items-center gap-1 text-sm text-ink-3 mt-1">
            <MapPin size={12} className="text-ink-3" />
            {data.location}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {data.isVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] rounded-[20px] py-[3px] px-[9px] border border-gold/30 bg-gold-light text-gold-dark">
                <ShieldCheck size={11} /> Verified
              </span>
            )}
            {data.isAvailable && (
              <span className="inline-flex items-center gap-1 text-[11px] rounded-[20px] py-[3px] px-[9px] border border-green-200 bg-green-50 text-green-600">
                Available now
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] rounded-[20px] py-[3px] px-[9px] border border-border bg-cream text-ink-2">
              {data.reviewCount > 0 ? (
                <>
                  <span className="text-gold">★</span> {data.rating} ·{" "}
                  {data.reviewCount} reviews
                </>
              ) : (
                "New"
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-5 border-t-[0.5px] border-border mt-4 pt-4">
            <div className="text-left">
              <div className="font-serif text-2xl font-medium text-ink leading-none">
                {data.jobsDone || "-"}
              </div>
              <div className="text-[11px] text-ink-3 mt-1">Jobs done</div>
            </div>
            <span className="w-1 h-1 rounded-full bg-gold" />
            <div className="text-left">
              <div className="font-serif text-2xl font-medium text-ink leading-none">
                {data.reviewCount > 0 ? data.rating : "-"}
              </div>
              <div className="text-[11px] text-ink-3 mt-1">Rating</div>
            </div>
            <span className="w-1 h-1 rounded-full bg-gold" />
            <div className="text-left">
              <div className="font-serif text-2xl font-medium text-ink leading-none">
                {data.yearsExperience || "-"}
              </div>
              <div className="text-[11px] text-ink-3 mt-1">Years exp.</div>
            </div>
            <span className="w-1 h-1 rounded-full bg-gold" />
            <div className="text-left">
              {editRate && own ? (
                <div className="flex items-center gap-1.5">
                  <input
                    className="w-[90px] font-serif text-xl border border-gold rounded-md py-0.5 px-1.5 bg-white text-ink outline-none"
                    value={rateDraft}
                    onChange={(e) => setRateDraft(e.target.value)}
                    inputMode="numeric"
                    aria-label="Daily rate"
                  />
                  <button
                    type="button"
                    className={cn(BTN_BASE, ACT)}
                    onClick={saveRate}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className={LINK}
                    onClick={() => setEditRate(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div
                  className={cn(
                    "font-serif text-2xl font-medium text-ink leading-none",
                    own && "inline-flex items-center gap-1.5",
                  )}
                >
                  {rateText}
                  {own && (
                    <button
                      type="button"
                      className={LINK}
                      onClick={() => {
                        setRateDraft(String(data.dailyRate));
                        setEditRate(true);
                      }}
                      aria-label="Edit daily rate"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              )}
              <div className="text-[11px] text-ink-3 mt-1">Per day</div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {own ? (
              <>
                <button
                  type="button"
                  className={cn(BTN_BASE, BTN_OUTLINE, BTN_SM)}
                >
                  <Pencil size={13} /> Edit profile
                </button>
                <button
                  type="button"
                  className={cn(BTN_BASE, BTN, BTN_SM)}
                  onClick={share}
                >
                  <Share2 size={13} /> Share
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={cn(BTN_BASE, BTN_OUTLINE, BTN_SM)}
                  onClick={onMessage}
                >
                  <MessageSquare size={13} /> Message
                </button>
                <button
                  type="button"
                  className={cn(BTN_BASE, BTN, BTN_SM)}
                  onClick={onHire}
                >
                  Request hire
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── TWO COLUMNS ── */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 mt-4 min-[900px]:items-start",
          !own && !hasRightCol
            ? "min-[900px]:grid-cols-1"
            : "min-[900px]:grid-cols-[1.5fr_1fr]",
        )}
      >
        {/* LEFT */}
        <div className="flex flex-col gap-4">
          {/* About */}
          {!hideIfEmpty(data.about.trim().length > 0) && (
            <section className={CARD}>
              <div className={CARDHEAD}>
                <span className={TITLE}>About</span>
                {own && !editAbout && (
                  <button
                    type="button"
                    className={cn(BTN_BASE, ACT)}
                    onClick={() => {
                      setAboutDraft(data.about);
                      setEditAbout(true);
                    }}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                )}
              </div>
              {editAbout ? (
                <>
                  <textarea
                    className={TEXTAREA}
                    value={aboutDraft}
                    onChange={(e) => setAboutDraft(e.target.value)}
                  />
                  <div className={EDITROW}>
                    <button
                      type="button"
                      className={cn(BTN_BASE, BTN, BTN_SM)}
                      onClick={saveAbout}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className={LINK}
                      onClick={() => setEditAbout(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-ink-2 leading-[1.7]">
                  {data.about || "No description yet."}
                </p>
              )}
            </section>
          )}

          {/* Services */}
          {!hideIfEmpty(data.services.length > 0) && (
            <section className={CARD}>
              <div className={CARDHEAD}>
                <span className={TITLE}>Services</span>
                {own && (
                  <button
                    type="button"
                    className={cn(BTN_BASE, ACT)}
                    onClick={() => setEditServices((v) => !v)}
                  >
                    <Pencil size={12} /> {editServices ? "Done" : "Edit"}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {editServices
                  ? data.services.map((s) => (
                      <span
                        className="inline-flex items-center gap-1.5 py-[5px] pl-3 pr-2 rounded-[20px] bg-gold-light border-[0.5px] border-gold/30 text-gold-dark text-sm"
                        key={s}
                      >
                        {s}
                        <button
                          type="button"
                          className="bg-transparent border-none text-gold-dark cursor-pointer flex p-0"
                          onClick={() => removeService(s)}
                          aria-label={`Remove ${s}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  : data.services.map((s) => (
                      <span
                        className="inline-flex items-center gap-[5px] py-[5px] px-3 rounded-[20px] bg-cream-2 border-[0.5px] border-border text-ink-2 text-sm"
                        key={s}
                      >
                        {s}
                      </span>
                    ))}
              </div>
              {editServices && (
                <div className={EDITROW}>
                  <input
                    className={INPUT}
                    placeholder="Add a service and press Enter"
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addService(serviceInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={cn(BTN_BASE, BTN, BTN_SM)}
                    onClick={() => addService(serviceInput)}
                  >
                    Add
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Portfolio */}
          {!hideIfEmpty(data.portfolio.length > 0) && (
            <section className={CARD}>
              <div className={CARDHEAD}>
                <span className={TITLE}>Portfolio</span>
                {own && (
                  <button
                    type="button"
                    className={cn(BTN_BASE, ACT)}
                    onClick={() => setAddPhoto((v) => !v)}
                  >
                    <Plus size={12} /> Add work
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 min-[900px]:grid-cols-3 gap-2.5">
                {standalonePhotos.map((p) => (
                  <div
                    className="group border-[0.5px] border-border rounded-[10px] overflow-hidden relative"
                    key={p.id}
                  >
                    {own && (
                      <button
                        type="button"
                        className="absolute top-1.5 right-1.5 z-[2] w-[26px] h-[26px] rounded-[7px] border-none bg-white/90 text-red-600 flex items-center justify-center cursor-pointer"
                        onClick={() => removePhoto(p.id)}
                        aria-label="Delete photo"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <div
                      className={FOLIO_IMG}
                      style={
                        p.url ? { backgroundImage: `url(${p.url})` } : undefined
                      }
                    >
                      {!p.url && <ZoomIn size={18} />}
                      <div className="absolute inset-0 bg-navy/55 text-white flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <ZoomIn size={22} />
                      </div>
                    </div>
                    <div className="py-2 px-2.5">
                      <div className="text-sm font-medium text-ink">
                        {p.caption}
                      </div>
                      <div className="text-[11px] text-ink-3">{p.jobType}</div>
                    </div>
                  </div>
                ))}
              </div>

              {beforePhotos.length > 0 && (
                <>
                  <div className="text-sm font-medium text-ink mt-[18px] mb-2.5">
                    Before &amp; after
                  </div>
                  {beforePhotos.map((b) => {
                    const after = data.portfolio.find(
                      (p) => p.id === b.afterPhotoId,
                    );
                    return (
                      <div key={b.id}>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="border-[0.5px] border-border rounded-[10px] overflow-hidden">
                            <div
                              className={FOLIO_IMG}
                              style={
                                b.url
                                  ? { backgroundImage: `url(${b.url})` }
                                  : undefined
                              }
                            >
                              {!b.url && <ZoomIn size={18} />}
                            </div>
                            <div className="text-[11px] font-semibold py-[5px] px-2.5 text-red-600">
                              Before
                            </div>
                          </div>
                          <div className="border-[0.5px] border-border rounded-[10px] overflow-hidden">
                            <div
                              className={FOLIO_IMG}
                              style={
                                after?.url
                                  ? { backgroundImage: `url(${after.url})` }
                                  : undefined
                              }
                            >
                              {!after?.url && <ZoomIn size={18} />}
                            </div>
                            <div className="text-[11px] font-semibold py-[5px] px-2.5 text-green-600">
                              After
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-ink-2 mt-2">
                          {b.caption}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {addPhoto && (
                <PhotoForm
                  onCancel={() => setAddPhoto(false)}
                  onSave={createPhoto}
                />
              )}
            </section>
          )}

          {/* Experience */}
          {!hideIfEmpty(data.experience.length > 0) && (
            <section className={CARD}>
              <div className={CARDHEAD}>
                <span className={TITLE}>Experience</span>
                {own && (
                  <button
                    type="button"
                    className={cn(BTN_BASE, ACT)}
                    onClick={() => setAddExp((v) => !v)}
                  >
                    <Plus size={12} /> Add
                  </button>
                )}
              </div>
              {addExp && (
                <ExperienceForm
                  onCancel={() => setAddExp(false)}
                  onSave={createExp}
                />
              )}
              <div className="relative pl-[22px] before:content-[''] before:absolute before:left-[5px] before:top-1 before:bottom-1 before:w-px before:bg-border">
                {data.experience.map((e) => (
                  <div
                    className="relative pb-4 mb-4 border-b-[0.5px] border-border last:border-b-0 last:mb-0 last:pb-0"
                    key={e.id}
                  >
                    <span className="absolute -left-[22px] top-[3px] w-[13px] h-[13px] rounded-full bg-gold border-2 border-white shadow-[0_0_0_2px_var(--color-border)]" />
                    {own && (
                      <button
                        type="button"
                        className={cn(BTN_BASE, ACT, "absolute right-0 top-0")}
                        onClick={() => removeExp(e.id)}
                        aria-label="Delete experience"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    <div className="text-sm font-medium text-ink">
                      {e.title}
                    </div>
                    <div className="text-sm text-ink-2">{e.company}</div>
                    <div className="text-[11px] text-ink-3 my-0.5 mb-1.5">
                      {e.startYear} – {e.endYear ?? "Present"}
                    </div>
                    <div className="text-sm text-ink-3 leading-[1.6]">
                      {e.description}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Service area */}
          {!hideIfEmpty(data.serviceAreas.length > 0) && (
            <section className={CARD}>
              <div className={CARDHEAD}>
                <span className={TITLE}>Service area</span>
                {own && (
                  <button
                    type="button"
                    className={cn(BTN_BASE, ACT)}
                    onClick={() => setEditAreas((v) => !v)}
                  >
                    <Pencil size={12} /> {editAreas ? "Done" : "Edit"}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {editAreas
                  ? data.serviceAreas.map((a) => (
                      <span
                        className="inline-flex items-center gap-1.5 py-[5px] pl-3 pr-2 rounded-[20px] bg-gold-light border-[0.5px] border-gold/30 text-gold-dark text-sm"
                        key={a}
                      >
                        <MapPin size={11} /> {a}
                        <button
                          type="button"
                          className="bg-transparent border-none text-gold-dark cursor-pointer flex p-0"
                          onClick={() => removeArea(a)}
                          aria-label={`Remove ${a}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  : data.serviceAreas.map((a) => (
                      <span
                        className="inline-flex items-center gap-[5px] py-[5px] px-3 rounded-[20px] bg-cream-2 border-[0.5px] border-border text-ink-2 text-sm [&>svg]:text-gold"
                        key={a}
                      >
                        <MapPin size={12} /> {a}
                      </span>
                    ))}
              </div>
              {editAreas && (
                <div className={EDITROW}>
                  <input
                    className={INPUT}
                    placeholder="Add an area and press Enter"
                    value={areaInput}
                    onChange={(e) => setAreaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addArea(areaInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={cn(BTN_BASE, BTN, BTN_SM)}
                    onClick={() => addArea(areaInput)}
                  >
                    Add
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Reviews */}
          <section className={CARD}>
            <div className={CARDHEAD}>
              <span className={TITLE}>Reviews</span>
              {data.reviewCount > 0 && (
                <button type="button" className={LINK}>
                  See all →
                </button>
              )}
            </div>
            {!hideIfEmpty(data.reviewCount > 0) && (
              <div className="flex gap-6 flex-wrap items-center pb-4 mb-4 border-b-[0.5px] border-border">
                <div className="text-center">
                  <div className="font-serif text-[38px] font-medium text-ink leading-none">
                    {data.rating}
                  </div>
                  <Stars value={data.rating} />
                  <div className="text-[11px] text-ink-3 mt-1">
                    {data.reviewCount} reviews
                  </div>
                </div>
                <div className="flex-1 min-w-[180px] flex flex-col gap-[5px]">
                  {data.ratingBreakdown.map((b) => (
                    <div className="flex items-center gap-2" key={b.stars}>
                      <span className="text-[10px] text-ink-3 w-[22px]">
                        {b.stars}★
                      </span>
                      <span className="flex-1 h-1 bg-cream-2 rounded overflow-hidden">
                        <span
                          className="block h-full bg-gold rounded"
                          style={{ width: `${(b.count / maxBucket) * 100}%` }}
                        />
                      </span>
                      <span className="text-[10px] text-ink-3 w-[18px] text-right">
                        {b.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.reviews.map((r) => (
              <div
                className="py-3 border-b-[0.5px] border-border last:border-b-0 last:pb-0"
                key={r.id}
              >
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-gold-light text-gold-dark text-[10px] font-semibold flex items-center justify-center shrink-0">
                    {r.initials}
                  </span>
                  <span className="text-sm font-medium text-ink flex-1">
                    {r.author}
                  </span>
                  <Stars value={r.rating} />
                </div>
                <p className="text-sm text-ink-2 leading-[1.6] my-2">
                  {r.text}
                </p>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1 text-[11px] py-0.5 px-2 rounded-[20px] bg-cream-2 text-ink-2">
                    <Wrench size={11} /> {r.jobType}
                  </span>
                  <span className="text-[10px] text-ink-3">{r.date}</span>
                </div>
              </div>
            ))}
            {data.reviewCount === 0 && (
              <p className="text-sm text-ink-3 px-0.5 pt-0.5 pb-1">
                No reviews yet.
              </p>
            )}
          </section>
        </div>

        {/* RIGHT */}
        {!hideIfEmpty(hasRightCol) && (
          <div className="flex flex-col gap-4 max-[899px]:contents">
            {/* Profile strength (own only) */}
            {own && (
              <section className={cn(CARD, "max-[899px]:order-3")}>
                <div className={CARDHEAD}>
                  <span className={TITLE}>Profile strength</span>
                  <span className="text-sm font-semibold text-gold-dark">
                    {strengthPct}%
                  </span>
                </div>
                <div className="h-[5px] bg-cream-2 rounded overflow-hidden my-1 mb-3.5">
                  <div
                    className="h-full bg-gold rounded transition-[width] duration-300"
                    style={{ width: `${strengthPct}%` }}
                  />
                </div>
                {checklist.map((c) => (
                  <div
                    className={cn(
                      "flex items-center gap-[9px] py-1.5 text-sm",
                      c.done
                        ? "text-ink-2 [&>svg]:text-green-600"
                        : "text-ink-3 [&>svg]:text-ink-3",
                    )}
                    key={c.label}
                  >
                    {c.done ? (
                      <CircleCheck size={15} />
                    ) : (
                      <CircleDashed size={15} />
                    )}
                    {c.label}
                  </div>
                ))}
              </section>
            )}

            {/* Certifications */}
            {!hideIfEmpty(data.certifications.length > 0) && (
              <section className={cn(CARD, "max-[899px]:order-1")}>
                <div className={CARDHEAD}>
                  <span className={TITLE}>Certifications</span>
                  {own && (
                    <button
                      type="button"
                      className={cn(BTN_BASE, ACT)}
                      onClick={() => setAddCert((v) => !v)}
                    >
                      <Plus size={12} /> Add
                    </button>
                  )}
                </div>
                {addCert && (
                  <CertForm
                    onCancel={() => setAddCert(false)}
                    onSave={createCert}
                  />
                )}
                {data.certifications.map((c) => (
                  <div
                    className="flex gap-3 p-3.5 bg-cream border border-border rounded-[10px] mb-2.5 last:mb-0 relative"
                    key={c.id}
                  >
                    {own && (
                      <button
                        type="button"
                        className={cn(
                          BTN_BASE,
                          ACT,
                          "absolute top-2.5 right-2.5",
                        )}
                        onClick={() => removeCert(c.id)}
                        aria-label="Delete certification"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    <div className="w-10 h-10 rounded-lg bg-gold-light border border-gold/30 flex items-center justify-center text-gold-dark shrink-0">
                      <Award size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {c.name}
                      </div>
                      <div className="text-sm text-ink-3 mt-px">
                        {c.issuingBody}
                      </div>
                      <div className="text-[11px] text-gold-dark mt-[3px]">
                        {c.yearIssued}
                        {c.expiryYear ? ` · expires ${c.expiryYear}` : ""}
                      </div>
                      {c.isVerified && (
                        <span className="inline-flex items-center gap-[3px] text-[9px] py-px px-1.5 rounded-[20px] bg-gold-light border border-gold/30 text-gold-dark mt-1.5">
                          <ShieldCheck size={9} /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Education & training */}
            {!hideIfEmpty(data.education.length > 0) && (
              <section className={cn(CARD, "max-[899px]:order-2")}>
                <div className={CARDHEAD}>
                  <span className={TITLE}>Education &amp; training</span>
                  {own && (
                    <button
                      type="button"
                      className={cn(BTN_BASE, ACT)}
                      onClick={() => setAddEdu((v) => !v)}
                    >
                      <Plus size={12} /> Add
                    </button>
                  )}
                </div>
                {addEdu && (
                  <EducationForm
                    onCancel={() => setAddEdu(false)}
                    onSave={createEdu}
                  />
                )}
                {data.education.map((e) => (
                  <div
                    className="flex gap-3 pt-3 mt-3 border-t-[0.5px] border-border first:pt-0 first:mt-0 first:border-t-0 relative"
                    key={e.id}
                  >
                    {own && (
                      <button
                        type="button"
                        className={cn(BTN_BASE, ACT, "absolute top-3 right-0")}
                        onClick={() => removeEdu(e.id)}
                        aria-label="Delete education"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    <div className="w-9 h-9 rounded-lg bg-cream-2 border border-border flex items-center justify-center text-ink-2 shrink-0">
                      {eduIcon(e.type)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {e.name}
                      </div>
                      <div className="text-sm text-ink-3 mt-px">
                        {e.institution} · {e.startYear}–{e.endYear}
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </div>

      {/* Sticky mobile employer actions */}
      {!own && (
        <div className="fixed left-0 right-0 bottom-[58px] z-[25] flex gap-2.5 bg-white border-t border-border py-3 px-4 lg:hidden">
          <button
            type="button"
            className={cn(BTN_BASE, BTN_OUTLINE, "flex-1")}
            onClick={onMessage}
          >
            <MessageSquare size={14} /> Message
          </button>
          <button
            type="button"
            className={cn(BTN_BASE, BTN, "flex-1")}
            onClick={onHire}
          >
            Request hire
          </button>
        </div>
      )}
    </div>
  );
}

// ── Inline add forms ────────────────────────────────────────────────────────

function FormButtons({
  onCancel,
  disabled,
}: {
  onCancel: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={EDITROW}>
      <button
        type="submit"
        className={cn(BTN_BASE, BTN, BTN_SM)}
        disabled={disabled}
      >
        Save
      </button>
      <button type="button" className={LINK} onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

function PhotoForm({
  onSave,
  onCancel,
}: {
  onSave: (p: Omit<PortfolioPhoto, "id">) => void;
  onCancel: () => void;
}) {
  const [caption, setCaption] = useState("");
  const [jobType, setJobType] = useState("");
  const [url, setUrl] = useState("");
  const [isBefore, setIsBefore] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadPhoto();
  const { error: toastError } = useToastContext();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    try {
      const res = await upload.mutateAsync(file);
      setUrl(res.data?.data?.url ?? "");
    } catch {
      toastError("Could not upload image. Please try again.");
    }
  }

  return (
    <form
      className={FORM}
      onSubmit={(e) => {
        e.preventDefault();
        if (caption.trim())
          onSave({
            caption: caption.trim(),
            jobType: jobType.trim(),
            url: url.trim(),
            isBefore,
          });
      }}
    >
      {/* Image uploader */}
      {url ? (
        <div className="flex flex-col gap-1.5 items-start">
          <div
            className="w-full aspect-[4/3] rounded-[10px] bg-cream-2 bg-cover bg-center"
            style={{ backgroundImage: `url(${url})` }}
          />
          <button type="button" className={LINK} onClick={() => setUrl("")}>
            Remove photo
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="flex items-center justify-center gap-2 w-full py-[22px] px-3 border-[1.5px] border-dashed border-border rounded-[10px] bg-white text-ink-2 font-sans text-sm cursor-pointer transition-[border-color,color] duration-150 hover:not-disabled:border-gold hover:not-disabled:text-gold-dark disabled:cursor-default disabled:opacity-70"
          onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}
        >
          <ImagePlus size={18} />
          {upload.isPending ? "Uploading…" : "Upload a work photo"}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onFile}
      />

      <div className="flex gap-2 [&>*]:flex-1">
        <input
          className={INPUT}
          placeholder="Job title / caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <input
          className={INPUT}
          placeholder="Job type"
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-[9px] py-1.5 text-sm text-ink-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isBefore}
          onChange={(e) => setIsBefore(e.target.checked)}
          className="accent-gold"
        />{" "}
        This is a “before” photo
      </label>
      <FormButtons onCancel={onCancel} disabled={upload.isPending} />
    </form>
  );
}

function ExperienceForm({
  onSave,
  onCancel,
}: {
  onSave: (e: Omit<ExperienceItem, "id">) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [current, setCurrent] = useState(false);
  const [description, setDescription] = useState("");
  return (
    <form
      className={FORM}
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSave({
          title: title.trim(),
          company: company.trim(),
          startYear: Number(startYear) || new Date().getFullYear(),
          endYear: current ? null : Number(endYear) || null,
          description: description.trim(),
        });
      }}
    >
      <div className="flex gap-2 [&>*]:flex-1">
        <input
          className={INPUT}
          placeholder="Job title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className={INPUT}
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>
      <div className="flex gap-2 [&>*]:flex-1">
        <input
          className={INPUT}
          placeholder="Start year"
          inputMode="numeric"
          value={startYear}
          onChange={(e) => setStartYear(e.target.value)}
        />
        <input
          className={INPUT}
          placeholder="End year"
          inputMode="numeric"
          value={endYear}
          disabled={current}
          onChange={(e) => setEndYear(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-[9px] py-1.5 text-sm text-ink-3 cursor-pointer">
        <input
          type="checkbox"
          checked={current}
          onChange={(e) => setCurrent(e.target.checked)}
          className="accent-gold"
        />{" "}
        I currently work here
      </label>
      <textarea
        className={cn(TEXTAREA, "min-h-[70px]")}
        placeholder="What you did"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <FormButtons onCancel={onCancel} />
    </form>
  );
}

function CertForm({
  onSave,
  onCancel,
}: {
  onSave: (c: Omit<Certification, "id" | "isVerified">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [issuingBody, setIssuingBody] = useState("");
  const [yearIssued, setYearIssued] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  return (
    <form
      className={FORM}
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({
          name: name.trim(),
          issuingBody: issuingBody.trim(),
          yearIssued: Number(yearIssued) || new Date().getFullYear(),
          expiryYear: expiryYear ? Number(expiryYear) : undefined,
        });
      }}
    >
      <input
        className={INPUT}
        placeholder="Certification name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className={INPUT}
        placeholder="Issuing body"
        value={issuingBody}
        onChange={(e) => setIssuingBody(e.target.value)}
      />
      <div className="flex gap-2 [&>*]:flex-1">
        <input
          className={INPUT}
          placeholder="Year issued"
          inputMode="numeric"
          value={yearIssued}
          onChange={(e) => setYearIssued(e.target.value)}
        />
        <input
          className={INPUT}
          placeholder="Expiry year (optional)"
          inputMode="numeric"
          value={expiryYear}
          onChange={(e) => setExpiryYear(e.target.value)}
        />
      </div>
      <FormButtons onCancel={onCancel} />
    </form>
  );
}

function EducationForm({
  onSave,
  onCancel,
}: {
  onSave: (e: Omit<EducationItem, "id">) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<EducationItem["type"]>("school");
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  return (
    <form
      className={FORM}
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({
          type,
          name: name.trim(),
          institution: institution.trim(),
          startYear: Number(startYear) || new Date().getFullYear(),
          endYear: Number(endYear) || new Date().getFullYear(),
        });
      }}
    >
      <select
        className={INPUT}
        value={type}
        onChange={(e) => setType(e.target.value as EducationItem["type"])}
      >
        <option value="school">School</option>
        <option value="training">Training</option>
        <option value="course">Course</option>
      </select>
      <input
        className={INPUT}
        placeholder="Qualification / programme"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className={INPUT}
        placeholder="Institution"
        value={institution}
        onChange={(e) => setInstitution(e.target.value)}
      />
      <div className="flex gap-2 [&>*]:flex-1">
        <input
          className={INPUT}
          placeholder="Start year"
          inputMode="numeric"
          value={startYear}
          onChange={(e) => setStartYear(e.target.value)}
        />
        <input
          className={INPUT}
          placeholder="End year"
          inputMode="numeric"
          value={endYear}
          onChange={(e) => setEndYear(e.target.value)}
        />
      </div>
      <FormButtons onCancel={onCancel} />
    </form>
  );
}
