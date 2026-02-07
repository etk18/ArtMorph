"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { clearAccessToken } from "@/lib/auth";
import {
  Loader2,
  User,
  Mail,
  CalendarDays,
  ImageIcon,
  Upload,
  Sparkles,
  Pencil,
  Check,
  X,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Shield
} from "lucide-react";

/* ── Types ── */
type Profile = {
  id: string;
  email: string;
  displayName: string | null;
  age: number | null;
  gender: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  stats: {
    totalJobs: number;
    totalUploads: number;
    totalGenerated: number;
  };
};

type Tab = "personal" | "security";

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

export default function ProfilePage() {
  const router = useRouter();

  /* ── Profile state ── */
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("personal");

  /* ── Edit personal info ── */
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    age: "",
    gender: "",
    bio: ""
  });
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalMsg, setPersonalMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /* ── Change password ── */
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /* ── Delete account ── */
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  /* ── Fetch ── */
  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiFetch<{ profile: Profile }>("/profile");
      setProfile(data.profile);
      setError(null);
    } catch (err) {
      setError(
        (err as { message?: string })?.message ?? "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* ── Populate form when toggling edit ── */
  const startEditing = () => {
    if (!profile) return;
    setForm({
      displayName: profile.displayName ?? "",
      age: profile.age?.toString() ?? "",
      gender: profile.gender ?? "",
      bio: profile.bio ?? ""
    });
    setPersonalMsg(null);
    setEditingPersonal(true);
  };

  const cancelEditing = () => {
    setEditingPersonal(false);
    setPersonalMsg(null);
  };

  /* ── Save personal info ── */
  const savePersonalInfo = async () => {
    setSavingPersonal(true);
    setPersonalMsg(null);
    try {
      const body: Record<string, unknown> = {};
      body.displayName = form.displayName.trim();
      body.age = form.age ? parseInt(form.age, 10) : null;
      body.gender = form.gender || null;
      body.bio = form.bio.trim() || null;

      if (body.age !== null && (isNaN(body.age as number) || (body.age as number) < 1 || (body.age as number) > 150)) {
        setPersonalMsg({ type: "error", text: "Age must be between 1 and 150." });
        setSavingPersonal(false);
        return;
      }

      const data = await apiFetch<{ profile: Profile }>("/profile", {
        method: "PATCH",
        body: JSON.stringify(body)
      });
      setProfile((prev) => (prev ? { ...prev, ...data.profile } : prev));
      setPersonalMsg({ type: "success", text: "Profile updated successfully." });
      setEditingPersonal(false);
    } catch (err) {
      setPersonalMsg({
        type: "error",
        text: (err as { message?: string })?.message ?? "Failed to update"
      });
    } finally {
      setSavingPersonal(false);
    }
  };

  /* ── Change password ── */
  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!pwForm.currentPassword) {
      setPwMsg({ type: "error", text: "Current password is required." });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({
        type: "error",
        text: "New password must be at least 6 characters."
      });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (pwForm.currentPassword === pwForm.newPassword) {
      setPwMsg({
        type: "error",
        text: "New password must be different from current."
      });
      return;
    }

    setChangingPw(true);
    try {
      await apiFetch("/profile/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword
        })
      });
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwMsg({
        type: "error",
        text:
          (err as { message?: string })?.message ?? "Failed to change password"
      });
    } finally {
      setChangingPw(false);
    }
  };

  /* ── Delete account ── */
  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE") return;
    setDeleting(true);
    setDeleteMsg(null);
    try {
      await apiFetch("/profile", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "DELETE" })
      });
      clearAccessToken();
      router.push("/login");
    } catch (err) {
      setDeleteMsg(
        (err as { message?: string })?.message ?? "Failed to delete account"
      );
      setDeleting(false);
    }
  };

  /* ── Helpers ── */
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

  /* ── Loading / Error ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-aurora-500" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <User className="mb-3 h-8 w-8 text-[var(--muted)]" />
        <p className="text-sm font-medium">Could not load profile</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{error}</p>
        <button onClick={fetchProfile} className="button button-primary mt-4">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-heading">Profile</h1>
        <p className="mt-1 text-xs sm:text-sm text-[var(--muted)]">
          Manage your account, personal information, and security.
        </p>
      </div>

      {/* Avatar & Name Card */}
      <div className="card p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-full bg-aurora-100 text-aurora-600 dark:bg-aurora-900/30 dark:text-aurora-400">
            <User size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold truncate">
              {profile.displayName || "No display name"}
            </h2>
            <p className="text-sm text-[var(--muted)] truncate">
              {profile.email}
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              Member since {formatDate(profile.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="card p-3 sm:p-5 text-center">
          <Sparkles size={18} className="mx-auto mb-1 sm:mb-2 text-aurora-500" />
          <p className="text-lg sm:text-2xl font-semibold">{profile.stats.totalJobs}</p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Generations
          </p>
        </div>
        <div className="card p-3 sm:p-5 text-center">
          <Upload size={18} className="mx-auto mb-1 sm:mb-2 text-aurora-500" />
          <p className="text-lg sm:text-2xl font-semibold">{profile.stats.totalUploads}</p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Uploads
          </p>
        </div>
        <div className="card p-3 sm:p-5 text-center">
          <ImageIcon size={18} className="mx-auto mb-1 sm:mb-2 text-aurora-500" />
          <p className="text-lg sm:text-2xl font-semibold">
            {profile.stats.totalGenerated}
          </p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Images
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1">
        <button
          onClick={() => setTab("personal")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "personal"
              ? "bg-[var(--bg)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          <User size={14} className="mr-1.5 inline-block" />
          Personal Info
        </button>
        <button
          onClick={() => setTab("security")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "security"
              ? "bg-[var(--bg)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          <Shield size={14} className="mr-1.5 inline-block" />
          Security
        </button>
      </div>

      {/* ─── PERSONAL INFO TAB ─── */}
      {tab === "personal" && (
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="section-title text-base">Personal Information</h3>
            {!editingPersonal && (
              <button
                onClick={startEditing}
                className="button button-ghost text-sm"
              >
                <Pencil size={14} className="mr-1.5" />
                Edit
              </button>
            )}
          </div>

          {personalMsg && (
            <div
              className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                personalMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              }`}
            >
              {personalMsg.text}
            </div>
          )}

          {editingPersonal ? (
            <div className="mt-4 space-y-4">
              {/* Display Name */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                  Display Name
                </label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, displayName: e.target.value }))
                  }
                  className="input mt-1 w-full"
                  placeholder="Your name"
                  maxLength={100}
                />
              </div>

              {/* Age & Gender row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                    Age
                  </label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, age: e.target.value }))
                    }
                    className="input mt-1 w-full"
                    placeholder="Your age"
                    min={1}
                    max={150}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, gender: e.target.value }))
                    }
                    className="input mt-1 w-full"
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                  Bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bio: e.target.value }))
                  }
                  className="input mt-1 w-full resize-none"
                  placeholder="Tell us about yourself"
                  rows={3}
                  maxLength={300}
                />
                <p className="mt-1 text-right text-xs text-[var(--muted)]">
                  {form.bio.length}/300
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={savePersonalInfo}
                  disabled={savingPersonal}
                  className="button button-primary"
                >
                  {savingPersonal ? (
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                  ) : (
                    <Check size={14} className="mr-1.5" />
                  )}
                  Save Changes
                </button>
                <button onClick={cancelEditing} className="button button-ghost">
                  <X size={14} className="mr-1.5" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <InfoRow
                icon={<User size={16} />}
                label="Display Name"
                value={profile.displayName || "Not set"}
              />
              <InfoRow
                icon={<Mail size={16} />}
                label="Email"
                value={profile.email}
              />
              <InfoRow
                icon={<CalendarDays size={16} />}
                label="Age"
                value={profile.age ? `${profile.age} years old` : "Not set"}
              />
              <InfoRow
                icon={<User size={16} />}
                label="Gender"
                value={profile.gender || "Not set"}
              />
              <InfoRow
                icon={<Pencil size={16} />}
                label="Bio"
                value={profile.bio || "Not set"}
              />
              <InfoRow
                icon={<CalendarDays size={16} />}
                label="Member Since"
                value={formatDate(profile.createdAt)}
              />
            </div>
          )}
        </div>
      )}

      {/* ─── SECURITY TAB ─── */}
      {tab === "security" && (
        <div className="space-y-6">
          {/* Change Password */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-aurora-500" />
              <h3 className="section-title text-base">Change Password</h3>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Update your password to keep your account secure.
            </p>

            {pwMsg && (
              <div
                className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                  pwMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {pwMsg.text}
              </div>
            )}

            <div className="mt-4 space-y-4">
              {/* Current password */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                  Current Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    value={pwForm.currentPassword}
                    onChange={(e) =>
                      setPwForm((f) => ({
                        ...f,
                        currentPassword: e.target.value
                      }))
                    }
                    className="input w-full pr-10"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--text)]"
                  >
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                  New Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showNewPw ? "text" : "password"}
                    value={pwForm.newPassword}
                    onChange={(e) =>
                      setPwForm((f) => ({ ...f, newPassword: e.target.value }))
                    }
                    className="input w-full pr-10"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--text)]"
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm new password */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({
                      ...f,
                      confirmPassword: e.target.value
                    }))
                  }
                  className="input mt-1 w-full"
                  placeholder="Re-enter new password"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={changingPw}
                className="button button-primary"
              >
                {changingPw ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : (
                  <Lock size={14} className="mr-1.5" />
                )}
                Update Password
              </button>
            </div>
          </div>

          {/* Danger Zone – Delete Account */}
          <div className="card border-red-200 p-4 sm:p-6 dark:border-red-900/40">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              <h3 className="section-title text-base text-red-600 dark:text-red-400">
                Danger Zone
              </h3>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="button button-danger mt-4"
              >
                <Trash2 size={14} className="mr-1.5" />
                Delete Account
              </button>
            ) : (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-900/40 dark:bg-red-900/10">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Are you absolutely sure?
                </p>
                <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">
                  This will permanently delete your profile, all uploaded
                  images, generated images, and job history. Type{" "}
                  <span className="font-mono font-bold">DELETE</span> to
                  confirm.
                </p>

                {deleteMsg && (
                  <div className="mt-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {deleteMsg}
                  </div>
                )}

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    className="input w-full sm:w-40"
                    placeholder='Type "DELETE"'
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteText !== "DELETE" || deleting}
                    className="button button-danger disabled:opacity-40"
                  >
                    {deleting ? (
                      <Loader2 size={14} className="mr-1.5 animate-spin" />
                    ) : (
                      <Trash2 size={14} className="mr-1.5" />
                    )}
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteText("");
                      setDeleteMsg(null);
                    }}
                    className="button button-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Reusable info row component ── */
function InfoRow({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-[var(--muted)]">{icon}</span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          {label}
        </p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}
