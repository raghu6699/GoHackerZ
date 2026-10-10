"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Award,
  Play,
  CheckCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Search,
  ExternalLink,
  Users,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
  Zap,
} from "lucide-react";
import type { HackathonParticipant, HackathonCertificate, CertificateType } from "@/lib/hackathons";

interface AdminControlClientProps {
  slug: string;
  initialStatus: string;
  hackathonTitle: string;
  participants: HackathonParticipant[];
  initialCertificates: HackathonCertificate[];
}

export function AdminControlClient({
  slug,
  initialStatus,
  hackathonTitle,
  participants,
  initialCertificates,
}: AdminControlClientProps) {
  const [status, setStatus] = useState(initialStatus);
  const [certificates, setCertificates] = useState<HackathonCertificate[]>(initialCertificates);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Award studio state
  const [selectedTicket, setSelectedTicket] = useState<string>("");
  const [awardType, setAwardType] = useState<CertificateType>("WINNER_FIRST");
  const [customAwardTitle, setCustomAwardTitle] = useState("1st Place · Grand Champion");
  const [trackName, setTrackName] = useState("Autonomous AI Agents");
  const [isIssuingAward, setIsIssuingAward] = useState(false);
  const [awardSuccessMsg, setAwardSuccessMsg] = useState<string | null>(null);

  // Filter & search
  const [searchQuery, setSearchQuery] = useState("");

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "COMPLETED") {
      const confirmClose = window.confirm(
        "Finalizing and closing this hackathon will AUTOMATICALLY generate and issue official Participation Certificates and Visa Stamps to all registered participants. Proceed?"
      );
      if (!confirmClose) return;
    }

    setIsUpdatingStatus(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/hackathons/${slug}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
        setStatusMessage(data.message || `Status updated to ${newStatus}`);

        // Refresh certificates list
        const certsRes = await fetch(`/api/hackathons/${slug}/certificates`);
        const certsData = await certsRes.json();
        if (certsData.success) {
          setCertificates(certsData.certificates || []);
        }
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (e: any) {
      alert("Error updating status: " + e.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleIssueAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) {
      alert("Please select a participant/ticket.");
      return;
    }

    setIsIssuingAward(true);
    setAwardSuccessMsg(null);

    try {
      const res = await fetch(`/api/hackathons/${slug}/awards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketNumber: selectedTicket,
          type: awardType,
          awardTitle: customAwardTitle,
          trackName: awardType === "TRACK_WINNER" ? trackName : undefined,
          rank:
            awardType === "WINNER_FIRST"
              ? 1
              : awardType === "WINNER_SECOND"
              ? 2
              : awardType === "WINNER_THIRD"
              ? 3
              : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.certificate) {
        setAwardSuccessMsg(data.message);
        // Refresh certs
        setCertificates((prev) => [
          data.certificate,
          ...prev.filter((c) => c.certNumber !== data.certificate.certNumber && c.ticketNumber !== data.certificate.ticketNumber),
        ]);
        setSelectedTicket("");
      } else {
        alert(data.error || "Failed to issue award");
      }
    } catch (e: any) {
      alert("Error issuing award: " + e.message);
    } finally {
      setIsIssuingAward(false);
    }
  };

  const filteredCerts = certificates.filter(
    (c) =>
      c.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.certNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.awardTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070512] text-white py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#251F47]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C6FF3D]">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Hackathon & Awards Studio</span>
            </div>
            <h1 className="text-3xl font-bold mt-1 text-white tracking-tight">
              {hackathonTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/hackathons/${slug}`}
              className="px-4 py-2 rounded-xl bg-[#161233] hover:bg-[#201b47] text-xs font-medium text-[#a59fcf] border border-[#2c2459] transition-colors"
            >
              View Public Page
            </Link>
          </div>
        </div>

        {/* Section 1: Lifecycle Management */}
        <div className="p-6 rounded-2xl bg-[#0F0C24] border border-[#251F47] shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#C6FF3D]" />
                Hackathon Lifecycle Control
              </h2>
              <p className="text-xs text-[#8e88b8] mt-0.5">
                Control the state of submissions, judging, and automated certificate issuance.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181339] border border-[#2e2763]">
              <span className="text-xs text-[#8e88b8]">Current Status:</span>
              <span
                className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full ${
                  status === "ACTIVE"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : status === "JUDGING"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : status === "COMPLETED"
                    ? "bg-purple-500/20 text-[#C6FF3D] border border-purple-500/30"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}
              >
                {status}
              </span>
            </div>
          </div>

          {/* Status buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => handleStatusChange("UPCOMING")}
              disabled={isUpdatingStatus || status === "UPCOMING"}
              className={`p-4 rounded-xl border text-left transition-all ${
                status === "UPCOMING"
                  ? "bg-blue-600/20 border-blue-500 text-white"
                  : "bg-[#141030] border-[#272054] text-[#8e88b8] hover:bg-[#1b1542] hover:text-white"
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-400" />
                1. UPCOMING
              </div>
              <p className="text-[11px] text-[#8e88b8] mt-1">
                Registrations open, submissions locked.
              </p>
            </button>

            <button
              onClick={() => handleStatusChange("ACTIVE")}
              disabled={isUpdatingStatus || status === "ACTIVE"}
              className={`p-4 rounded-xl border text-left transition-all ${
                status === "ACTIVE"
                  ? "bg-emerald-600/20 border-emerald-500 text-white"
                  : "bg-[#141030] border-[#272054] text-[#8e88b8] hover:bg-[#1b1542] hover:text-white"
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1.5">
                <Play className="w-4 h-4 text-emerald-400" />
                2. ACTIVE (Hackathon Live)
              </div>
              <p className="text-[11px] text-[#8e88b8] mt-1">
                Live hacking, team formation, and open submissions.
              </p>
            </button>

            <button
              onClick={() => handleStatusChange("JUDGING")}
              disabled={isUpdatingStatus || status === "JUDGING"}
              className={`p-4 rounded-xl border text-left transition-all ${
                status === "JUDGING"
                  ? "bg-amber-600/20 border-amber-500 text-white"
                  : "bg-[#141030] border-[#272054] text-[#8e88b8] hover:bg-[#1b1542] hover:text-white"
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                3. JUDGING
              </div>
              <p className="text-[11px] text-[#8e88b8] mt-1">
                Submissions locked. Judges review pitches.
              </p>
            </button>

            <button
              onClick={() => handleStatusChange("COMPLETED")}
              disabled={isUpdatingStatus || status === "COMPLETED"}
              className={`p-4 rounded-xl border text-left transition-all ${
                status === "COMPLETED"
                  ? "bg-[#7C5CFF]/30 border-[#7C5CFF] text-white"
                  : "bg-[#141030] border-[#272054] text-[#8e88b8] hover:bg-[#1b1542] hover:text-white"
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1.5 text-[#C6FF3D]">
                <Trophy className="w-4 h-4 text-[#C6FF3D]" />
                4. CLOSE & AUTO-ISSUE
              </div>
              <p className="text-[11px] text-[#a59fcf] mt-1">
                Finalizes event & auto-mints certificates to all hackers.
              </p>
            </button>
          </div>

          {statusMessage && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Section 2: Special Winner & Awards Studio */}
        <div className="p-6 rounded-2xl bg-[#0F0C24] border border-[#251F47] shadow-xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Special Winner & Podium Awards Studio
            </h2>
            <p className="text-xs text-[#8e88b8] mt-0.5">
              Select podium winners or track champions to issue exclusive gold/silver/track honor certificates and profile badges.
            </p>
          </div>

          <form onSubmit={handleIssueAward} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Participant selector */}
              <div>
                <label className="block text-xs font-semibold text-[#8e88b8] uppercase tracking-wider mb-1.5">
                  Select Participant / Squad
                </label>
                <select
                  value={selectedTicket}
                  onChange={(e) => setSelectedTicket(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#161233] border border-[#2c2459] text-xs text-white focus:outline-none focus:border-[#7C5CFF]"
                  required
                >
                  <option value="">-- Choose Builder or Team --</option>
                  {participants.map((p) => (
                    <option key={p.ticketNumber} value={p.ticketNumber}>
                      {p.name} ({p.ticketNumber}) {p.teamName ? `· Squad: ${p.teamName}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Award Type */}
              <div>
                <label className="block text-xs font-semibold text-[#8e88b8] uppercase tracking-wider mb-1.5">
                  Award Tier
                </label>
                <select
                  value={awardType}
                  onChange={(e) => {
                    const type = e.target.value as CertificateType;
                    setAwardType(type);
                    if (type === "WINNER_FIRST") setCustomAwardTitle("1st Place · Grand Champion");
                    else if (type === "WINNER_SECOND") setCustomAwardTitle("2nd Place · First Runner-Up");
                    else if (type === "WINNER_THIRD") setCustomAwardTitle("3rd Place · Second Runner-Up");
                    else if (type === "TRACK_WINNER") setCustomAwardTitle("Track Champion · Best AI Agent");
                    else setCustomAwardTitle("Honorable Mention");
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-[#161233] border border-[#2c2459] text-xs text-white focus:outline-none focus:border-[#7C5CFF]"
                >
                  <option value="WINNER_FIRST">🥇 1st Place · Grand Champion</option>
                  <option value="WINNER_SECOND">🥈 2nd Place · Runner-Up</option>
                  <option value="WINNER_THIRD">🥉 3rd Place · 2nd Runner-Up</option>
                  <option value="TRACK_WINNER">🎖️ Track Winner</option>
                  <option value="HONORABLE_MENTION">🌟 Honorable Mention</option>
                </select>
              </div>

              {/* Custom Award Title */}
              <div>
                <label className="block text-xs font-semibold text-[#8e88b8] uppercase tracking-wider mb-1.5">
                  Certificate Distinction Title
                </label>
                <input
                  type="text"
                  value={customAwardTitle}
                  onChange={(e) => setCustomAwardTitle(e.target.value)}
                  placeholder="e.g. 1st Place Grand Winner"
                  className="w-full h-10 px-3 rounded-xl bg-[#161233] border border-[#2c2459] text-xs text-white focus:outline-none focus:border-[#7C5CFF]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-[#8e88b8]">
                Once issued, this award automatically stamps their Passport and unlocks their gold credential.
              </div>

              <button
                type="submit"
                disabled={isIssuingAward || !selectedTicket}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C5CFF] to-[#5B3EE8] hover:from-[#6d4be0] hover:to-[#4e32d1] text-xs font-bold text-white shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isIssuingAward ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Minting Award...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#C6FF3D]" />
                    Issue Special Award & Badge
                  </>
                )}
              </button>
            </div>

            {awardSuccessMsg && (
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#C6FF3D] shrink-0" />
                <span>{awardSuccessMsg}</span>
              </div>
            )}
          </form>
        </div>

        {/* Section 3: Issued Credentials & Certificates Roster */}
        <div className="p-6 rounded-2xl bg-[#0F0C24] border border-[#251F47] shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#C6FF3D]" />
                Issued Credentials & Certificates ({certificates.length})
              </h2>
              <p className="text-xs text-[#8e88b8] mt-0.5">
                Live directory of tamper-proof certificates generated for this hackathon.
              </p>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8e88b8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search builder, cert ID..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#161233] border border-[#2c2459] text-xs text-white placeholder:text-[#5d5687] focus:outline-none focus:border-[#7C5CFF]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161233] text-[#8e88b8] uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Recipient</th>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Award Distinction</th>
                  <th className="py-3 px-4">Certificate ID</th>
                  <th className="py-3 px-4">Issued Date</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1942]">
                {filteredCerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#8e88b8]">
                      No certificates generated yet. Finalize the hackathon or issue a special award above to mint.
                    </td>
                  </tr>
                ) : (
                  filteredCerts.map((cert) => (
                    <tr key={cert.certNumber} className="hover:bg-[#141030] transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        {cert.recipientName}
                        {cert.teamName && (
                          <div className="text-[10px] text-[#8e88b8]">Squad: {cert.teamName}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#a59fcf]">{cert.ticketNumber}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            cert.type === "WINNER_FIRST"
                              ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                              : cert.type === "WINNER_SECOND"
                              ? "bg-slate-300/20 text-slate-200 border border-slate-300/30"
                              : cert.type === "WINNER_THIRD"
                              ? "bg-amber-700/20 text-amber-500 border border-amber-700/30"
                              : cert.type === "TRACK_WINNER"
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {cert.awardTitle}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#C6FF3D] font-semibold">
                        {cert.certNumber}
                      </td>
                      <td className="py-3 px-4 text-[#8e88b8]">
                        {new Date(cert.issuedAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/verify/${cert.certNumber}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#201a45] hover:bg-[#2e2663] text-white text-[11px] font-medium transition-colors"
                        >
                          Verify View
                          <ExternalLink className="w-3 h-3 text-[#C6FF3D]" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
