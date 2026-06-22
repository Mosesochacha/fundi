"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import {
  useDeleteAccount,
  useExportData,
  usePauseAccount,
} from "@/features/worker/settings";
import { apiError, Modal, Panel, PanelBody } from "../_components/ui";

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
        {/* Pause */}
        <div className="ws-danger-row">
          <div>
            <div className="ws-danger-title">Pause account</div>
            <div className="ws-danger-sub">
              Temporarily hide your profile from search and stop receiving
              requests. Reactivate anytime.
            </div>
          </div>
          <button
            type="button"
            className="ws-btn ws-btn-sm ws-btn-outline"
            onClick={() => setDialog("pause")}
          >
            Pause account
          </button>
        </div>

        {/* Export */}
        <div className="ws-danger-row">
          <div>
            <div className="ws-danger-title">Export my data</div>
            <div className="ws-danger-sub">
              Download all your profile data, job history, messages, and
              reviews.
            </div>
          </div>
          <button
            type="button"
            className="ws-btn ws-btn-sm ws-btn-outline"
            onClick={onExport}
            disabled={exportData.isPending}
          >
            <Download size={14} />
            {exportData.isPending ? "Preparing…" : "Export data"}
          </button>
        </div>

        {/* Delete */}
        <div className="ws-danger-row">
          <div>
            <div className="ws-danger-title red">Delete account</div>
            <div className="ws-danger-sub">
              Permanently delete your account and all data. This cannot be
              undone.
            </div>
          </div>
          <button
            type="button"
            className="ws-btn ws-btn-sm ws-btn-danger-outline"
            onClick={() => setDialog("delete")}
          >
            Delete account
          </button>
        </div>
      </PanelBody>

      {/* Pause modal */}
      {dialog === "pause" && (
        <Modal
          title="Pause your account?"
          onClose={closeDialog}
          footer={
            <>
              <button
                type="button"
                className="ws-btn ws-btn-sm ws-btn-outline"
                onClick={closeDialog}
                disabled={pause.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ws-btn ws-btn-sm ws-btn-gold"
                onClick={onPause}
                disabled={pause.isPending}
              >
                {pause.isPending ? "Pausing…" : "Yes, pause account"}
              </button>
            </>
          }
        >
          <p className="ws-modal-text">
            You won&apos;t appear in search until you reactivate. You can turn
            your account back on at any time.
          </p>
        </Modal>
      )}

      {/* Delete modal — two-step */}
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
                  className="ws-btn ws-btn-sm ws-btn-outline"
                  onClick={closeDialog}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ws-btn ws-btn-sm ws-btn-danger"
                  onClick={() => setDeleteStep(2)}
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="ws-btn ws-btn-sm ws-btn-outline"
                  onClick={closeDialog}
                  disabled={del.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ws-btn ws-btn-sm ws-btn-danger"
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
            <p className="ws-modal-text">
              This permanently deletes your profile, job history, messages, and
              reviews. This action cannot be undone.
            </p>
          ) : (
            <>
              <p className="ws-modal-text">
                Type <strong>DELETE</strong> to confirm.
              </p>
              <input
                className="ws-input"
                style={{ marginTop: 10 }}
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
