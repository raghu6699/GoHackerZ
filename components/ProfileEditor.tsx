"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import type { AvatarColor } from "@/lib/data";

const COLORS: AvatarColor[] = ["purple", "pink", "sky", "peach", "lime", "ink"];

export interface ProfileData {
  username: string;
  name: string;
  bio: string;
  company: string;
  avatarColor: AvatarColor;
  avatarUrl: string | null;
  email: string;
}

export function ProfileEditor({ initial }: { initial: ProfileData }) {
  const [name, setName] = useState(initial.name);
  const [bio, setBio] = useState(initial.bio);
  const [company, setCompany] = useState(initial.company);
  const [avatarColor, setAvatarColor] = useState<AvatarColor>(initial.avatarColor);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG or WebP images are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2MB.");
      return;
    }
    const preview = URL.createObjectURL(file);
    setAvatarUrl(preview);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatarUrl(data.avatarUrl);
    } catch (err) {
      setAvatarUrl(initial.avatarUrl);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      URL.revokeObjectURL(preview);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeAvatar() {
    setError(null);
    const prev = avatarUrl;
    setAvatarUrl(null);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!res.ok) throw new Error("Could not remove photo");
    } catch (err) {
      setAvatarUrl(prev);
      setError(err instanceof Error ? err.message : "Could not remove photo");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setSavedMsg(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, company, avatarColor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save changes");
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <span className="chip bg-lime mb-3 inline-block">✦ your corner</span>
      <h1 className="text-[34px] font-bold mb-1">Edit profile</h1>
      <p className="text-muted text-[15px] mb-8">
        Signed in as <b>{initial.email}</b> ·{" "}
        <Link href={`/writer/${initial.username}`} className="text-purple hover:underline">
          view public profile →
        </Link>
      </p>

      <div className="card p-7 space-y-6">
        {/* ── avatar ── */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar
              initials={name.slice(0, 2).toUpperCase() || initial.username.slice(0, 2).toUpperCase()}
              color={avatarColor}
              size="xl"
              src={avatarUrl}
            />
            {uploading && (
              <span className="absolute inset-0 grid place-items-center bg-ink/40 rounded-2xl font-mono text-[11px] text-white">…</span>
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
              id="avatar-input"
            />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn btn-sm disabled:opacity-50">
              {uploading ? "Uploading…" : avatarUrl ? "↻ Change photo" : "↑ Upload photo"}
            </button>
            {avatarUrl && !uploading && (
              <button type="button" onClick={removeAvatar} className="btn btn-sm block">
                Remove
              </button>
            )}
            <p className="font-mono text-[11px] text-subtle">JPG · PNG · WEBP · max 2MB</p>
          </div>
        </div>
        {/* ── fields ── */}
        <form onSubmit={handleSave} className="space-y-5">
          <label className="block">
            <span className="font-mono text-[11px] text-subtle font-bold">NAME</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
              className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 text-[15px] outline-none shadow-pop-sm bg-card text-ink"
            />
          </label>

          <label className="block">
            <span className="font-mono text-[11px] text-subtle font-bold">
              BIO <span className="font-normal">({bio.length}/280)</span>
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="What do you build? What do you write about?"
              className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 text-[15px] outline-none resize-none bg-card text-ink"
            />
          </label>

          <label className="block">
            <span className="font-mono text-[11px] text-subtle font-bold">COMPANY</span>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              maxLength={60}
              placeholder="Where do you ship?"
              className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 text-[15px] outline-none bg-card text-ink"
            />
          </label>

          <div>
            <span className="font-mono text-[11px] text-subtle font-bold">
              AVATAR COLOR <span className="font-normal">(fallback when no photo)</span>
            </span>
            <div className="flex gap-2 mt-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-9 h-9 rounded-lg border-2 border-ink transition-transform ${
                    avatarColor === c ? "scale-110 shadow-pop-sm" : "opacity-70"
                  }`}
                  style={{ backgroundColor: `var(--${c}, #7C5CFF)` }}
                  aria-label={`Pick ${c}`}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="font-mono text-[12px] font-bold bg-peach border-2 border-ink rounded-xl px-4 py-2.5 text-[#8a2b00]">
              ⚠ {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn btn-purple disabled:opacity-50">
              {saving ? "Saving…" : "Save changes ✦"}
            </button>
            {savedMsg && (
              <span className="font-mono text-[13px] font-bold text-[#3a7d00]">✓ Saved!</span>
            )}
          </div>
        </form>
      </div>
    </>
  );
}