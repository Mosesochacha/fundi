"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import {
  useDeleteAccount,
  useExportData,
  usePauseAccount,
} from "@/features/worker/settings";
import { cn } from "@/lib/utils";
import {
  apiError,
  BTN_DANGER,
  BTN_DANGER_OUTLINE,
  BTN_GOLD,
  BTN_OUTLINE,
  btn,
  FIELD_INPUT,
  Modal,
  Panel,
  PanelBody,
} from "../_components/ui";

type Dialog = null | "pause" | "delete";

export default function DangerPanel() {
  const { success, error: toastError } = useToastContext();
  const pause = usePauseAccount();
  const exportData = useExportData();
  const del = useDeleteAccount();

  const [dialog, setDialog] = useState<Dialog>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");

  function closeDialog() {
    setDialog(null);
    setDeleteStep(1);
    setConfirmText("");
  }

  async function onPause() {
    try {
      await pause.mutateAsync();
      success("Your account is paused");
      closeDialog();
    } catch (e) {
      toastError(apiError(e, "Could not pause your account"));
    }
  }

  async function onExport() {
    try {
      const res = await exportData.mutateAsync();
      const blob = res.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fundi-data-export.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      success("Your data export has downloaded");
    } catch (e) {
      toastError(apiError(e, "Could not export your data"));
    }
  }

  async function onDelete() {
    try {
      await del.mutateAsync();
      success("Your account has been deleted");
      if (typeof window !== "undefined") window.location.href = "/";
    } catch (e) {
      toastError(apiError(e, "Could not delete your account"));
    }
  }

  return (
    <Panel
      id="danger"
      title="Danger zone"
      subtitle="Irreversible and account-level actions."
      danger
    >
      <PanelBody>
        <div className="flex items-center justify-between gap-4 py-4 border-b-[0.5px] border-cream-2 first:pt-0 last:border-b-0 last:pb-0">
          <div>
            <div className="text-sm font-medium text-ink">Pause account</div>
            <div className="text-[11px] text-ink-3 mt-[3px] leading-[1.5] max-w-[420px]">
              Temporarily hide your profile from search and stop receiving
              requests. Reactivate anytime.
            </div>
          </div>
          <button
            type="button"
            className={btn(BTN_OUTLINE, true)}
            onClick={() => setDialog("pause")}
          >
            Pause account
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 py-4 border-b-[0.5px] border-cream-2 first:pt-0 last:border-b-0 last:pb-0">
          <div>
            <div className="text-sm font-medium text-ink">Export my data</div>
            <div className="text-[11px] text-ink-3 mt-[3px] leading-[1.5] max-w-[420px]">
              Download all your profile data, job history, messages, and
              reviews.
            </div>
          </div>
          <button
            type="button"
            className={btn(BTN_OUTLINE, true)}
            onClick={onExport}
            disabled={exportData.isPending}
          >
            <Download size={14} />
            {exportData.isPending ? "Preparing…" : "Export data"}
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 py-4 border-b-[0.5px] border-cream-2 first:pt-0 last:border-b-0 last:pb-0">
          <div>
            <div className="text-sm font-medium text-red-600">
              Delete account
            </div>
            <div className="text-[11px] text-ink-3 mt-[3px] leading-[1.5] max-w-[420px]">
              Permanently delete your account and all data. This cannot be
              undone.
            </div>
          </div>
          <button
            type="button"
            className={btn(BTN_DANGER_OUTLINE, true)}
            onClick={() => setDialog("delete")}
          >
            Delete account
          </button>
        </div>
      </PanelBody>

      {dialog === "pause" && (
        <Modal
          title="Pause your account?"
          onClose={closeDialog}
          footer={
            <>
              <button
                type="button"
                className={btn(BTN_OUTLINE, true)}
                onClick={closeDialog}
                disabled={pause.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className={btn(BTN_GOLD, true)}
                onClick={onPause}
                disabled={pause.isPending}
              >
                {pause.isPending ? "Pausing…" : "Yes, pause account"}
              </button>
            </>
          }
        >
          <p className="text-sm text-ink-2 leading-[1.55] mt-2">
            You won&apos;t appear in search until you reactivate. You can turn
            your account back on at any time.
          </p>
        </Modal>
      )}

      {dialog === "delete" && (
        <Modal
          title="Delete your account?"
          danger
          onClose={closeDialog}
          footer={
            deleteStep === 1 ? (
              <>
                <button
                  type="button"
                  className={btn(BTN_OUTLINE, true)}
                  onClick={closeDialog}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={btn(BTN_DANGER, true)}
                  onClick={() => setDeleteStep(2)}
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={btn(BTN_OUTLINE, true)}
                  onClick={closeDialog}
                  disabled={del.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={btn(BTN_DANGER, true)}
                  onClick={onDelete}
                  disabled={confirmText !== "DELETE" || del.isPending}
                >
                  {del.isPending ? "Deleting…" : "Yes, delete my account"}
                </button>
              </>
            )
          }
        >
          {deleteStep === 1 ? (
            <p className="text-sm text-ink-2 leading-[1.55] mt-2">
              This permanently deletes your profile, job history, messages, and
              reviews. This action cannot be undone.
            </p>
          ) : (
            <>
              <p className="text-sm text-ink-2 leading-[1.55] mt-2">
                Type <strong>DELETE</strong> to confirm.
              </p>
              <input
                className={cn(FIELD_INPUT, "mt-2.5")}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                aria-label="Type DELETE to confirm"
              />
            </>
          )}
        </Modal>
      )}
    </Panel>
  );
}
