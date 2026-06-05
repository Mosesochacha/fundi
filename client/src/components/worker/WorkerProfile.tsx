"use client";

import {
  Award,
  BookOpen,
  CircleCheck,
  CircleDashed,
  GraduationCap,
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
import { useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import {
  useUpdateAbout,
  useUpdateServices,
  useUpdateRate,
  useUpdateServiceArea,
} from "@/features/worker/profile";
import { useAddPhoto, useDeletePhoto } from "@/features/worker/portfolio";
import {
  useAddExperience,
  useDeleteExperience,
} from "@/features/worker/experience";
import {
  useAddCertification,
  useDeleteCertification,
} from "@/features/worker/certifications";
import {
  useAddEducation,
  useDeleteEducation,
} from "@/features/worker/education";
import type {
  Certification,
  EducationItem,
  ExperienceItem,
  PortfolioPhoto,
  WorkerProfileData,
} from "./workerProfileData";
import "./workerProfile.css";

type Mode = "own" | "public";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

function Stars({ value }: { value: number }) {
  return (
    <span className="wp-stars" role="img" aria-label={`${value} out of 5`}>
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
}: {
  mode: Mode;
  initialData: WorkerProfileData;
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

  const money = (n: number) => `${data.currency} ${n.toLocaleString()}`;

  return (
    <div className={`wp${own ? "" : " wp-public"}`}>
      {/* ── HEADER CARD ── */}
      <div className="wp-header">
        <div className="wp-cover">
          <div className="wp-cover-accent" />
        </div>
        <div className="wp-headbody">
          <div className="wp-avatar-wrap">
            <div className="wp-avatar">{data.initials}</div>
            {data.isAvailable && <span className="wp-avatar-dot" />}
          </div>

          <div className="wp-name">{data.name}</div>
          <div className="wp-trade">
            {data.trade} · {data.yearsExperience} yrs experience
          </div>
          <div className="wp-loc">
            <MapPin size={12} />
            {data.location}
          </div>

          <div className="wp-badges">
            {data.isVerified && (
              <span className="wp-badge wp-badge-verified">
                <ShieldCheck size={11} /> Verified
              </span>
            )}
            {data.isAvailable && (
              <span className="wp-badge wp-badge-available">Available now</span>
            )}
            <span className="wp-badge wp-badge-rating">
              <span className="wp-star">★</span> {data.rating} ·{" "}
              {data.reviewCount} reviews
            </span>
          </div>

          <div className="wp-stats">
            <div className="wp-stat">
              <div className="wp-stat-num">{data.jobsDone}</div>
              <div className="wp-stat-label">Jobs done</div>
            </div>
            <span className="wp-stat-sep" />
            <div className="wp-stat">
              <div className="wp-stat-num">{data.rating}</div>
              <div className="wp-stat-label">Rating</div>
            </div>
            <span className="wp-stat-sep" />
            <div className="wp-stat">
              <div className="wp-stat-num">{data.yearsExperience}</div>
              <div className="wp-stat-label">Years exp.</div>
            </div>
            <span className="wp-stat-sep" />
            <div className="wp-stat">
              {editRate && own ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    className="wp-rate-input"
                    value={rateDraft}
                    onChange={(e) => setRateDraft(e.target.value)}
                    inputMode="numeric"
                    aria-label="Daily rate"
                  />
                  <button type="button" className="wp-act" onClick={saveRate}>
                    Save
                  </button>
                  <button
                    type="button"
                    className="wp-link"
                    onClick={() => setEditRate(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div
                  className="wp-stat-num"
                  style={
                    own
                      ? { display: "inline-flex", alignItems: "center", gap: 6 }
                      : undefined
                  }
                >
                  {money(data.dailyRate)}
                  {own && (
                    <button
                      type="button"
                      className="wp-link"
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
              <div className="wp-stat-label">Per day</div>
            </div>
          </div>

          <div className="wp-actions">
            {own ? (
              <>
                <button type="button" className="wp-btn-outline wp-btn-sm">
                  <Pencil size={13} /> Edit profile
                </button>
                <button
                  type="button"
                  className="wp-btn wp-btn-sm"
                  onClick={share}
                >
                  <Share2 size={13} /> Share
                </button>
              </>
            ) : (
              <>
                <button type="button" className="wp-btn-outline wp-btn-sm">
                  <MessageSquare size={13} /> Message
                </button>
                <button type="button" className="wp-btn wp-btn-sm">
                  Request hire
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── TWO COLUMNS ── */}
      <div className="wp-grid">
        {/* LEFT */}
        <div className="wp-col">
          {/* About */}
          <section className="wp-card">
            <div className="wp-cardhead">
              <span className="wp-title">About</span>
              {own && !editAbout && (
                <button
                  type="button"
                  className="wp-act"
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
                  className="wp-textarea"
                  value={aboutDraft}
                  onChange={(e) => setAboutDraft(e.target.value)}
                />
                <div className="wp-editrow">
                  <button
                    type="button"
                    className="wp-btn wp-btn-sm"
                    onClick={saveAbout}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="wp-link"
                    onClick={() => setEditAbout(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <p className="wp-about-text">
                {data.about || "No description yet."}
              </p>
            )}
          </section>

          {/* Services */}
          <section className="wp-card">
            <div className="wp-cardhead">
              <span className="wp-title">Services</span>
              {own && (
                <button
                  type="button"
                  className="wp-act"
                  onClick={() => setEditServices((v) => !v)}
                >
                  <Pencil size={12} /> {editServices ? "Done" : "Edit"}
                </button>
              )}
            </div>
            <div className="wp-pills">
              {editServices
                ? data.services.map((s) => (
                    <span className="wp-tag" key={s}>
                      {s}
                      <button
                        type="button"
                        onClick={() => removeService(s)}
                        aria-label={`Remove ${s}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                : data.services.map((s) => (
                    <span className="wp-pill" key={s}>
                      {s}
                    </span>
                  ))}
            </div>
            {editServices && (
              <div className="wp-editrow">
                <input
                  className="wp-input"
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
                  className="wp-btn wp-btn-sm"
                  onClick={() => addService(serviceInput)}
                >
                  Add
                </button>
              </div>
            )}
          </section>

          {/* Portfolio */}
          <section className="wp-card">
            <div className="wp-cardhead">
              <span className="wp-title">Portfolio</span>
              {own && (
                <button
                  type="button"
                  className="wp-act"
                  onClick={() => setAddPhoto((v) => !v)}
                >
                  <Plus size={12} /> Add work
                </button>
              )}
            </div>

            <div className="wp-folio">
              {standalonePhotos.map((p) => (
                <div className="wp-folio-item" key={p.id}>
                  {own && (
                    <button
                      type="button"
                      className="wp-folio-del"
                      onClick={() => removePhoto(p.id)}
                      aria-label="Delete photo"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  <div
                    className="wp-folio-img"
                    style={
                      p.url ? { backgroundImage: `url(${p.url})` } : undefined
                    }
                  >
                    {!p.url && <ZoomIn size={18} />}
                    <div className="wp-folio-overlay">
                      <ZoomIn size={22} />
                    </div>
                  </div>
                  <div className="wp-folio-cap">
                    <div className="wp-folio-cap-title">{p.caption}</div>
                    <div className="wp-folio-cap-type">{p.jobType}</div>
                  </div>
                </div>
              ))}
            </div>

            {beforePhotos.length > 0 && (
              <>
                <div className="wp-ba-label">Before &amp; after</div>
                {beforePhotos.map((b) => {
                  const after = data.portfolio.find(
                    (p) => p.id === b.afterPhotoId,
                  );
                  return (
                    <div key={b.id}>
                      <div className="wp-ba-grid">
                        <div className="wp-ba-item">
                          <div
                            className="wp-folio-img"
                            style={
                              b.url
                                ? { backgroundImage: `url(${b.url})` }
                                : undefined
                            }
                          >
                            {!b.url && <ZoomIn size={18} />}
                          </div>
                          <div className="wp-ba-tag before">Before</div>
                        </div>
                        <div className="wp-ba-item">
                          <div
                            className="wp-folio-img"
                            style={
                              after?.url
                                ? { backgroundImage: `url(${after.url})` }
                                : undefined
                            }
                          >
                            {!after?.url && <ZoomIn size={18} />}
                          </div>
                          <div className="wp-ba-tag after">After</div>
                        </div>
                      </div>
                      <div className="wp-ba-desc">{b.caption}</div>
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

          {/* Experience */}
          <section className="wp-card">
            <div className="wp-cardhead">
              <span className="wp-title">Experience</span>
              {own && (
                <button
                  type="button"
                  className="wp-act"
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
            <div className="wp-timeline">
              {data.experience.map((e) => (
                <div className="wp-exp" key={e.id}>
                  <span className="wp-exp-dot" />
                  {own && (
                    <button
                      type="button"
                      className="wp-act wp-exp-del"
                      onClick={() => removeExp(e.id)}
                      aria-label="Delete experience"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <div className="wp-exp-title">{e.title}</div>
                  <div className="wp-exp-co">{e.company}</div>
                  <div className="wp-exp-period">
                    {e.startYear} – {e.endYear ?? "Present"}
                  </div>
                  <div className="wp-exp-desc">{e.description}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Service area */}
          <section className="wp-card">
            <div className="wp-cardhead">
              <span className="wp-title">Service area</span>
              {own && (
                <button
                  type="button"
                  className="wp-act"
                  onClick={() => setEditAreas((v) => !v)}
                >
                  <Pencil size={12} /> {editAreas ? "Done" : "Edit"}
                </button>
              )}
            </div>
            <div className="wp-pills">
              {editAreas
                ? data.serviceAreas.map((a) => (
                    <span className="wp-tag" key={a}>
                      <MapPin size={11} /> {a}
                      <button
                        type="button"
                        onClick={() => removeArea(a)}
                        aria-label={`Remove ${a}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                : data.serviceAreas.map((a) => (
                    <span className="wp-pill" key={a}>
                      <MapPin size={12} /> {a}
                    </span>
                  ))}
            </div>
            {editAreas && (
              <div className="wp-editrow">
                <input
                  className="wp-input"
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
                  className="wp-btn wp-btn-sm"
                  onClick={() => addArea(areaInput)}
                >
                  Add
                </button>
              </div>
            )}
          </section>

          {/* Reviews */}
          <section className="wp-card">
            <div className="wp-cardhead">
              <span className="wp-title">Reviews</span>
              <button type="button" className="wp-link">
                See all →
              </button>
            </div>
            <div className="wp-rev-summary">
              <div className="wp-rev-bigwrap">
                <div className="wp-rev-big">{data.rating}</div>
                <Stars value={data.rating} />
                <div className="wp-rev-count">{data.reviewCount} reviews</div>
              </div>
              <div className="wp-rev-bars">
                {data.ratingBreakdown.map((b) => (
                  <div className="wp-bar-row" key={b.stars}>
                    <span className="wp-bar-label">{b.stars}★</span>
                    <span className="wp-bar-track">
                      <span
                        className="wp-bar-fill"
                        style={{ width: `${(b.count / maxBucket) * 100}%` }}
                      />
                    </span>
                    <span className="wp-bar-count">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>
            {data.reviews.map((r) => (
              <div className="wp-review" key={r.id}>
                <div className="wp-rev-top">
                  <span className="wp-rev-av">{r.initials}</span>
                  <span className="wp-rev-name">{r.author}</span>
                  <Stars value={r.rating} />
                </div>
                <p className="wp-rev-text">{r.text}</p>
                <div className="wp-rev-foot">
                  <span className="wp-rev-tag">
                    <Wrench size={11} /> {r.jobType}
                  </span>
                  <span className="wp-rev-date">{r.date}</span>
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* RIGHT */}
        <div className="wp-col">
          {/* Profile strength (own only) */}
          {own && (
            <section className="wp-card wp-strength">
              <div className="wp-cardhead">
                <span className="wp-title">Profile strength</span>
                <span className="wp-pct">{strengthPct}%</span>
              </div>
              <div className="wp-prog-track">
                <div
                  className="wp-prog-fill"
                  style={{ width: `${strengthPct}%` }}
                />
              </div>
              {checklist.map((c) => (
                <div
                  className={`wp-check ${c.done ? "done" : "todo"}`}
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
          <section className="wp-card wp-certs">
            <div className="wp-cardhead">
              <span className="wp-title">Certifications</span>
              {own && (
                <button
                  type="button"
                  className="wp-act"
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
              <div className="wp-cert" key={c.id}>
                {own && (
                  <button
                    type="button"
                    className="wp-act wp-cert-del"
                    onClick={() => removeCert(c.id)}
                    aria-label="Delete certification"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                <div className="wp-cert-icon">
                  <Award size={20} />
                </div>
                <div>
                  <div className="wp-cert-name">{c.name}</div>
                  <div className="wp-cert-body">{c.issuingBody}</div>
                  <div className="wp-cert-year">
                    {c.yearIssued}
                    {c.expiryYear ? ` · expires ${c.expiryYear}` : ""}
                  </div>
                  {c.isVerified && (
                    <span className="wp-cert-verified">
                      <ShieldCheck size={9} /> Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* Education & training */}
          <section className="wp-card wp-edu-card">
            <div className="wp-cardhead">
              <span className="wp-title">Education &amp; training</span>
              {own && (
                <button
                  type="button"
                  className="wp-act"
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
              <div className="wp-edu" key={e.id}>
                {own && (
                  <button
                    type="button"
                    className="wp-act wp-edu-del"
                    onClick={() => removeEdu(e.id)}
                    aria-label="Delete education"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                <div className="wp-edu-icon">{eduIcon(e.type)}</div>
                <div>
                  <div className="wp-edu-name">{e.name}</div>
                  <div className="wp-edu-sub">
                    {e.institution} · {e.startYear}–{e.endYear}
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>

      {/* Sticky mobile employer actions */}
      {!own && (
        <div className="wp-stickybar">
          <button type="button" className="wp-btn-outline">
            <MessageSquare size={14} /> Message
          </button>
          <button type="button" className="wp-btn">
            Request hire
          </button>
        </div>
      )}
    </div>
  );
}

// ── Inline add forms ────────────────────────────────────────────────────────

function FormButtons({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="wp-editrow">
      <button type="submit" className="wp-btn wp-btn-sm">
        Save
      </button>
      <button type="button" className="wp-link" onClick={onCancel}>
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
  return (
    <form
      className="wp-form"
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
      <div className="wp-form-row">
        <input
          className="wp-input"
          placeholder="Job title / caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <input
          className="wp-input"
          placeholder="Job type"
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
        />
      </div>
      <input
        className="wp-input"
        placeholder="Image URL (optional)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <label className="wp-check todo" style={{ cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={isBefore}
          onChange={(e) => setIsBefore(e.target.checked)}
          style={{ accentColor: "#c9a84c" }}
        />{" "}
        This is a “before” photo
      </label>
      <FormButtons onCancel={onCancel} />
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
      className="wp-form"
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
      <div className="wp-form-row">
        <input
          className="wp-input"
          placeholder="Job title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="wp-input"
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>
      <div className="wp-form-row">
        <input
          className="wp-input"
          placeholder="Start year"
          inputMode="numeric"
          value={startYear}
          onChange={(e) => setStartYear(e.target.value)}
        />
        <input
          className="wp-input"
          placeholder="End year"
          inputMode="numeric"
          value={endYear}
          disabled={current}
          onChange={(e) => setEndYear(e.target.value)}
        />
      </div>
      <label className="wp-check todo" style={{ cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={current}
          onChange={(e) => setCurrent(e.target.checked)}
          style={{ accentColor: "#c9a84c" }}
        />{" "}
        I currently work here
      </label>
      <textarea
        className="wp-textarea"
        placeholder="What you did"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ minHeight: 70 }}
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
      className="wp-form"
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
        className="wp-input"
        placeholder="Certification name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="wp-input"
        placeholder="Issuing body"
        value={issuingBody}
        onChange={(e) => setIssuingBody(e.target.value)}
      />
      <div className="wp-form-row">
        <input
          className="wp-input"
          placeholder="Year issued"
          inputMode="numeric"
          value={yearIssued}
          onChange={(e) => setYearIssued(e.target.value)}
        />
        <input
          className="wp-input"
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
      className="wp-form"
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
        className="wp-input"
        value={type}
        onChange={(e) => setType(e.target.value as EducationItem["type"])}
      >
        <option value="school">School</option>
        <option value="training">Training</option>
        <option value="course">Course</option>
      </select>
      <input
        className="wp-input"
        placeholder="Qualification / programme"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="wp-input"
        placeholder="Institution"
        value={institution}
        onChange={(e) => setInstitution(e.target.value)}
      />
      <div className="wp-form-row">
        <input
          className="wp-input"
          placeholder="Start year"
          inputMode="numeric"
          value={startYear}
          onChange={(e) => setStartYear(e.target.value)}
        />
        <input
          className="wp-input"
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
