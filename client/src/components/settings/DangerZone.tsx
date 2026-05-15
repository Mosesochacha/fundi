"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logOut } from "@/store/authSlice";
import { useToastContext } from "@/context/ToastContext";
import SettingsSection from "./SettingsSection";
import SettingsRow from "./SettingsRow";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

export default function DangerZone() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((s) => s.auth);
  const { error, success } = useToastContext();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/auth/account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      dispatch(logOut());
      router.push("/login");
    } catch (e: any) {
      error(e?.message || "Failed to delete account. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <>
      <SettingsSection title="Danger zone" danger>
        <SettingsRow
          label="Delete account"
          description="Permanently delete your account and all your data. This cannot be undone."
          danger
          last
        >
          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            Delete
          </button>
        </SettingsRow>
      </SettingsSection>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="font-playfair text-xl font-bold text-gray-900 mb-1">Delete your account?</h3>
            <p className="text-sm text-gray-500 mb-4">
              This will permanently delete your profile, posts, and all your data. You cannot undo this action.
            </p>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4 text-sm text-red-700 space-y-1">
              <p>• Your public profile will be removed</p>
              <p>• All your posts and comments will be deleted</p>
              <p>• Your followers and following list will be erased</p>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-mono font-bold">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-red-400"
              placeholder="DELETE"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteInput(""); }}
                className="flex-1 h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteInput !== "DELETE" || deleting}
                className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-40"
              >
                {deleting ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
