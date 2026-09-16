import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { normalizeApiError } from "@/lib/apiError";
import { clearStoredSession, getStoredAccessToken } from "@/lib/sessionUser";
import { endpoints, httpClient } from "@/services/api";

type DeleteAccountSectionProps = {
  className?: string;
};

/**
 * Two-step delete account control: primary button, then an "Are you sure?" confirm.
 */
export function DeleteAccountSection({ className = "" }: DeleteAccountSectionProps) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    const token = getStoredAccessToken();
    if (!token) {
      setErrorMessage("Your session expired. Please sign in again, then retry.");
      return;
    }

    setDeleting(true);
    setErrorMessage(null);
    try {
      await httpClient.delete(endpoints.usersMe, {
        headers: { Authorization: `Bearer ${token}` },
      });
      clearStoredSession();
      navigate("/", { replace: true });
    } catch (e) {
      setErrorMessage(normalizeApiError(e));
      setDeleting(false);
    }
  }

  return (
    <div className={className}>
      {!confirming ? (
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center rounded-xl border border-rose-300 text-rose-600 transition hover:bg-rose-50"
          onClick={() => {
            setErrorMessage(null);
            setConfirming(true);
          }}
        >
          <Trash2 className="mr-2 h-5 w-5" aria-hidden />
          Delete account
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-900">Are you sure?</p>
          <p className="text-sm text-rose-800">
            This permanently deletes your account, profiles, bookings, and related data.
            This cannot be undone.
          </p>
          {errorMessage && (
            <div className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm text-rose-800">
              {errorMessage}
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setConfirming(false);
                setErrorMessage(null);
              }}
              className="flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => void handleDelete()}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-rose-600 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, delete my account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
