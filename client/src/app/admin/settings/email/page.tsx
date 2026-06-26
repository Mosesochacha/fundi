"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminPageHeader, AdminShell, DetailCard } from "@/components/admin";
import { Button } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import {
  adminEndpoints,
  type EmailTemplate,
  useAdminAction,
  useAdminEmailTemplates,
} from "@/features/admin";
import { cn } from "@/lib/utils";

type Draft = { subject: string; body: string };

export default function AdminEmailTemplatesPage() {
  const { data, isLoading } = useAdminEmailTemplates();
  const { success } = useToastContext();
  const action = useAdminAction();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [preview, setPreview] = useState(false);

  // Seed local drafts + default selection once templates arrive.
  useEffect(() => {
    if (!data) return;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const t of data) {
        if (!next[t.id]) next[t.id] = { subject: t.subject, body: t.body };
      }
      return next;
    });
    setSelectedId((cur) => cur ?? data[0]?.id ?? null);
  }, [data]);

  const templates: EmailTemplate[] = data ?? [];
  const selected = templates.find((t) => t.id === selectedId) ?? null;
  const draft = selectedId ? drafts[selectedId] : undefined;

  const patch = (p: Partial<Draft>) => {
    if (!selectedId) return;
    setDrafts((d) => ({
      ...d,
      [selectedId]: {
        subject: d[selectedId]?.subject ?? "",
        body: d[selectedId]?.body ?? "",
        ...p,
      },
    }));
  };

  return (
    <AdminShell>
      <AdminPageHeader
        backHref="/admin/settings"
        backLabel="Settings"
        title="Email templates"
        subtitle="Edit transactional emails."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* Template list */}
        <DetailCard title="Templates">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton rows
                  key={`tsk-${i}`}
                  className="h-9 rounded-lg bg-cream-2 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(t.id);
                    setPreview(false);
                  }}
                  className={cn(
                    "text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                    t.id === selectedId
                      ? "bg-gold-light text-gold-dark font-medium"
                      : "text-ink-2 hover:bg-cream",
                  )}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </DetailCard>

        {/* Editor */}
        <DetailCard
          title={selected ? selected.name : "Editor"}
          action={
            <Button
              variant="outline"
              size="sm"
              icon={preview ? <EyeOff size={15} /> : <Eye size={15} />}
              onClick={() => setPreview((p) => !p)}
              disabled={!selected}
            >
              {preview ? "Edit" : "Preview"}
            </Button>
          }
        >
          {!selected || !draft ? (
            <p className="text-sm text-ink-3 py-6 text-center">
              Select a template to edit.
            </p>
          ) : preview ? (
            <div className="border border-border rounded-xl bg-cream/50 p-5">
              <h2 className="font-serif text-lg text-ink mb-3">
                {draft.subject}
              </h2>
              <div className="text-sm text-ink-2 whitespace-pre-line leading-relaxed">
                {draft.body}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="tpl-subject"
                  className="text-sm font-medium text-ink-2"
                >
                  Subject line
                </label>
                <input
                  id="tpl-subject"
                  value={draft.subject}
                  onChange={(e) => patch({ subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-border bg-cream text-ink placeholder:text-ink-3 outline-none focus:border-gold focus:bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="tpl-body"
                  className="text-sm font-medium text-ink-2"
                >
                  Body
                </label>
                <textarea
                  id="tpl-body"
                  value={draft.body}
                  onChange={(e) => patch({ body: e.target.value })}
                  rows={12}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm font-mono border border-border bg-cream text-ink placeholder:text-ink-3 outline-none focus:border-gold focus:bg-white resize-y"
                />
                <p className="text-[12px] text-ink-3">
                  Use {"{{name}}"}, {"{{link}}"} and similar placeholders.
                </p>
              </div>
              <div>
                <Button
                  variant="gold"
                  disabled={action.isPending}
                  onClick={async () => {
                    if (!selectedId || !draft) return;
                    await action.mutateAsync(
                      adminEndpoints.updateEmailTemplate(selectedId, {
                        subject: draft.subject,
                        body: draft.body,
                      }),
                    );
                    success("Template saved.");
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </DetailCard>
      </div>
    </AdminShell>
  );
}
