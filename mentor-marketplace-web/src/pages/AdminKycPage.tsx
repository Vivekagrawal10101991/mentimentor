import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { normalizeApiError } from "@/lib/apiError";
import {
  clearStoredSession,
  getStoredAccessToken,
  getStoredRoles,
} from "@/lib/sessionUser";
import { endpoints, httpClient } from "@/services/api";
import type { PendingKycResponse, PortalAdminListItem } from "@/types";

function hasPortalAccess(roles: string[]): boolean {
  return roles.some((r) => r === "admin" || r === "super_admin");
}

export function AdminKycPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PendingKycResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [staff, setStaff] = useState<PortalAdminListItem[] | null>(null);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [createBusy, setCreateBusy] = useState(false);

  const isSuperAdmin = getStoredRoles().includes("super_admin");

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await httpClient.get<PendingKycResponse>(endpoints.adminKycPending);
      setData(res.data);
    } catch (e) {
      setErrorMessage(normalizeApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStaff = useCallback(async () => {
    if (!getStoredRoles().includes("super_admin")) {
      return;
    }
    setStaffLoading(true);
    setStaffError(null);
    try {
      const res = await httpClient.get<PortalAdminListItem[]>(endpoints.adminPortalAdmins);
      setStaff(res.data);
    } catch (e) {
      setStaffError(normalizeApiError(e));
    } finally {
      setStaffLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      navigate("/admin/login", { replace: true });
      return;
    }
    if (!hasPortalAccess(getStoredRoles())) {
      clearStoredSession();
      navigate("/admin/login", { replace: true });
      return;
    }
    void load();
  }, [load, navigate]);

  useEffect(() => {
    if (getStoredAccessToken() && getStoredRoles().includes("super_admin")) {
      void loadStaff();
    }
  }, [loadStaff]);

  async function approveParent(id: string) {
    setBusyId(`p-${id}`);
    setErrorMessage(null);
    try {
      await httpClient.post(endpoints.adminKycApproveParent(id));
      await load();
    } catch (e) {
      setErrorMessage(normalizeApiError(e));
    } finally {
      setBusyId(null);
    }
  }

  async function rejectParent(id: string) {
    setBusyId(`r-${id}`);
    setErrorMessage(null);
    try {
      await httpClient.post(endpoints.adminKycRejectParent(id), {});
      await load();
    } catch (e) {
      setErrorMessage(normalizeApiError(e));
    } finally {
      setBusyId(null);
    }
  }

  async function approveUser(userId: string) {
    setBusyId(`u-${userId}`);
    setErrorMessage(null);
    try {
      await httpClient.post(endpoints.adminKycApproveUserSelf(userId));
      await load();
    } catch (e) {
      setErrorMessage(normalizeApiError(e));
    } finally {
      setBusyId(null);
    }
  }

  async function rejectUser(userId: string) {
    setBusyId(`v-${userId}`);
    setErrorMessage(null);
    try {
      await httpClient.post(endpoints.adminKycRejectUserSelf(userId), {});
      await load();
    } catch (e) {
      setErrorMessage(normalizeApiError(e));
    } finally {
      setBusyId(null);
    }
  }

  function signOut() {
    clearStoredSession();
    navigate("/admin/login", { replace: true });
  }

  const newAdminValid = useMemo(() => {
    const u = newAdminUsername.trim().toLowerCase();
    return /^[a-z0-9_]{3,64}$/.test(u) && newAdminPassword.length >= 8;
  }, [newAdminUsername, newAdminPassword]);

  async function createStaffAdmin() {
    if (!newAdminValid || createBusy) {
      return;
    }
    setCreateBusy(true);
    setStaffError(null);
    try {
      await httpClient.post(endpoints.adminPortalAdmins, {
        username: newAdminUsername.trim().toLowerCase(),
        password: newAdminPassword,
      });
      setNewAdminUsername("");
      setNewAdminPassword("");
      await loadStaff();
    } catch (e) {
      setStaffError(normalizeApiError(e));
    } finally {
      setCreateBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">KYC review</h1>
            <p className="text-sm text-slate-600">
              Approve or reject identity submissions. Masked Aadhaar is shown for reference
              only—match against your internal verification process.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={signOut}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white"
            >
              Sign out
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {errorMessage}
          </div>
        )}

        {loading && <p className="text-slate-600">Loading queue…</p>}

        {!loading && data && (
          <div className="space-y-10">
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Parent / guardian (minors)
              </h2>
              {data.parentGuardianSubmissions.length === 0 ? (
                <p className="text-sm text-slate-500">No pending items.</p>
              ) : (
                <ul className="space-y-3">
                  {data.parentGuardianSubmissions.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                        <p>
                          <span className="font-medium text-slate-900">Learner age:</span>{" "}
                          {row.userAge ?? "—"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Learner phone:</span>{" "}
                          {row.userPhoneCountryCode} {row.userPhoneNational}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Guardian:</span>{" "}
                          {row.parentName}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Guardian phone:</span>{" "}
                          {row.parentPhone}
                        </p>
                        <p className="sm:col-span-2">
                          <span className="font-medium text-slate-900">Aadhaar (masked):</span>{" "}
                          {row.parentAadharMasked || "—"}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => void approveParent(row.id)}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                          {busyId === `p-${row.id}` ? "…" : "Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => void rejectParent(row.id)}
                          className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-800 disabled:opacity-50"
                        >
                          {busyId === `r-${row.id}` ? "…" : "Reject"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Adults (self-serve)
              </h2>
              {data.adultSelfSubmissions.length === 0 ? (
                <p className="text-sm text-slate-500">No pending items.</p>
              ) : (
                <ul className="space-y-3">
                  {data.adultSelfSubmissions.map((row) => (
                    <li
                      key={row.userId}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                        <p>
                          <span className="font-medium text-slate-900">Name:</span>{" "}
                          {row.firstName} {row.lastName}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Age:</span>{" "}
                          {row.age ?? "—"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Phone:</span>{" "}
                          {row.phoneCountryCode} {row.phoneNational}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">User id:</span>{" "}
                          <code className="text-xs">{row.userId}</code>
                        </p>
                        <p className="sm:col-span-2">
                          <span className="font-medium text-slate-900">Aadhaar (masked):</span>{" "}
                          {row.aadharMasked || "—"}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => void approveUser(row.userId)}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                          {busyId === `u-${row.userId}` ? "…" : "Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => void rejectUser(row.userId)}
                          className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-800 disabled:opacity-50"
                        >
                          {busyId === `v-${row.userId}` ? "…" : "Reject"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {isSuperAdmin && (
              <section className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6">
                <h2 className="mb-2 text-lg font-semibold text-slate-900">
                  Portal staff (super admin)
                </h2>
                <p className="mb-4 text-sm text-slate-600">
                  Create additional admin logins with username and password. Only super admins see this
                  section.
                </p>
                {staffError && (
                  <p className="mb-3 text-sm text-rose-700">{staffError}</p>
                )}
                <div className="mb-6 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      New username
                    </label>
                    <input
                      type="text"
                      value={newAdminUsername}
                      onChange={(e) =>
                        setNewAdminUsername(
                          e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                        )
                      }
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                      placeholder="ops_analyst"
                      maxLength={64}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Temporary password
                    </label>
                    <input
                      type="password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                      placeholder="8+ characters"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!newAdminValid || createBusy}
                  onClick={() => void createStaffAdmin()}
                  className="mb-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {createBusy ? "Creating…" : "Create admin login"}
                </button>
                {staffLoading && (
                  <p className="text-sm text-slate-600">Loading staff list…</p>
                )}
                {!staffLoading && staff && staff.length === 0 && (
                  <p className="text-sm text-slate-600">No accounts yet.</p>
                )}
                {!staffLoading && staff && staff.length > 0 && (
                  <ul className="space-y-2 text-sm">
                    {staff.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <span className="font-medium text-slate-900">{row.username}</span>
                        <span className="text-slate-600">
                          {row.kind === "SUPER_ADMIN" ? "Super admin" : "Admin"}
                          {row.active ? "" : " (inactive)"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        )}

        <p className="mt-10 text-center text-sm text-slate-500">
          <Link to="/" className="text-indigo-600 underline">
            Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
