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
  Ticket,
  User,
  GitPullRequest,
  Check,
  Filter,
  Building2,
  Mail,
  MessageSquare,
  Calendar,
} from "lucide-react";
import type { HackathonParticipant, HackathonCertificate, CertificateType } from "@/lib/hackathons";
import type { HostHackathonProposal } from "@/lib/host-proposals";

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
  participants: initialParticipants,
  initialCertificates,
}: AdminControlClientProps) {
  const [status, setStatus] = useState(initialStatus);
  const [participants, setParticipants] = useState<HackathonParticipant[]>(initialParticipants);
  const [certificates, setCertificates] = useState<HackathonCertificate[]>(initialCertificates);
  const [hostProposals, setHostProposals] = useState<HostHackathonProposal[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Award studio state
  const [selectedTicket, setSelectedTicket] = useState<string>("");
  const [awardType, setAwardType] = useState<CertificateType>("WINNER_FIRST");
  const [customAwardTitle, setCustomAwardTitle] = useState("1st Place · Grand Champion");
  const [trackName, setTrackName] = useState("Autonomous AI Agents");
  const [isIssuingAward, setIsIssuingAward] = useState(false);
  const [awardSuccessMsg, setAwardSuccessMsg] = useState<string | null>(null);

  // Search & tab filters
  const [participantFilterTab, setParticipantFilterTab] = useState<"all" | "solo" | "team" | "submitted">("all");
  const [participantSearch, setParticipantSearch] = useState("");
  const [certSearch, setCertSearch] = useState("");

  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      const [pRes, cRes, sRes, hRes] = await Promise.all([
        fetch(`/api/hackathons/${slug}/participants`),
        fetch(`/api/hackathons/${slug}/certificates`),
        fetch(`/api/hackathons/${slug}/status`),
        fetch(`/api/hackathons/host-proposal`).catch(() => null),
      ]);

      const pData = await pRes.json();
      const cData = await cRes.json();
      const sData = await sRes.json();
      const hData = hRes ? await hRes.json().catch(() => null) : null;

      if (pData.success) setParticipants(pData.participants || []);
      if (cData.success) setCertificates(cData.certificates || []);
      if (sData.success) setStatus(sData.status);
      if (hData?.success && Array.isArray(hData.proposals)) {
        setHostProposals(hData.proposals);
      }
    } catch (err) {
      console.warn("Error refreshing admin data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetch(`/api/hackathons/host-proposal`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.proposals)) {
          setHostProposals(d.proposals);
        }
      })
      .catch(() => {});
  }, []);

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [launchSuccessInfo, setLaunchSuccessInfo] = useState<{
    slug: string;
    title: string;
    refNumber: string;
  } | null>(null);

  const handleApproveAndLaunchProposal = async (proposal: HostHackathonProposal) => {
    const confirmLaunch = window.confirm(
      `Approve proposal "${proposal.hackathonTitle}" for ${proposal.orgName}?\n\nThis will:\n1. Provision live hackathon arena (/hackathons/[slug])\n2. Set up director studio\n3. Automatically email launch credentials & links to ${proposal.contactEmail}`
    );
    if (!confirmLaunch) return;

    setApprovingId(proposal.id);
    try {
      const res = await fetch("/api/hackathons/host-proposal/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId: proposal.id }),
      });
      const data = await res.json();
      if (data.success && data.hackathon) {
        setLaunchSuccessInfo({
          slug: data.hackathon.slug,
          title: data.hackathon.title,
          refNumber: proposal.refNumber,
        });
        setHostProposals((prev) =>
          prev.map((p) => (p.id === proposal.id ? { ...p, status: "APPROVED" } : p))
        );
      } else {
        alert(data.error || "Failed to approve and provision hackathon.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleUpdateProposalStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/hackathons/host-proposal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.proposal) {
        setHostProposals((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus as any } : p))
        );
      }
    } catch (err) {
      console.error("Failed to update proposal status:", err);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "COMPLETED") {
      const confirmClose = window.confirm(
        `Finalizing and closing this hackathon will AUTOMATICALLY generate and issue official Participation Certificates and Visa Stamps to all ${participants.length} registered participants. Proceed?`
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
        await refreshAllData();
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
        await refreshAllData();
      } else {
        alert(data.error || "Failed to issue award");
      }
    } catch (e: any) {
      alert("Error issuing award: " + e.message);
    } finally {
      setIsIssuingAward(false);
    }
  };

  const selectParticipantForAward = (ticket: string, name: string) => {
    setSelectedTicket(ticket);
    const awardForm = document.getElementById("award-studio-form");
    if (awardForm) {
      awardForm.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Filtered participants
  const filteredParticipants = participants.filter((p) => {
    const q = participantSearch.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.ticketNumber.toLowerCase().includes(q) ||
      (p.teamName && p.teamName.toLowerCase().includes(q)) ||
      (p.roleTitle && p.roleTitle.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (participantFilterTab === "solo") return !p.teamCode && !p.teamName;
    if (participantFilterTab === "team") return !!p.teamCode || !!p.teamName;
    if (participantFilterTab === "submitted") return !!p.submission;
    return true;
  });

  // Filtered certificates
  const filteredCerts = certificates.filter(
    (c) =>
      c.recipientName.toLowerCase().includes(certSearch.toLowerCase()) ||
      c.certNumber.toLowerCase().includes(certSearch.toLowerCase()) ||
      c.ticketNumber.toLowerCase().includes(certSearch.toLowerCase()) ||
      c.awardTitle.toLowerCase().includes(certSearch.toLowerCase())
  );

  const soloCount = participants.filter((p) => !p.teamCode && !p.teamName).length;
  const teamCount = participants.filter((p) => !!p.teamCode || !!p.teamName).length;
  const submissionCount = participants.filter((p) => !!p.submission).length;

  return (
    <div className="min-h-screen bg-[#070512] text-white py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#251F47]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C6FF3D]">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Director & Awards Studio</span>
            </div>
            <h1 className="text-3xl font-bold mt-1 text-white tracking-tight">
              {hackathonTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshAllData}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-xl bg-[#161233] hover:bg-[#201b47] text-xs font-medium text-[#C6FF3D] border border-[#2c2459] transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh Roster & DB"}</span>
            </button>

            <Link
              href={`/hackathons/${slug}`}
              className="px-4 py-2 rounded-xl bg-[#161233] hover:bg-[#201b47] text-xs font-medium text-[#a59fcf] border border-[#2c2459] transition-colors"
            >
              Public Arena Page ↗
            </Link>
          </div>
        </div>

        {/* Section 1: Lifecycle Control Bar */}
        <div className="p-6 rounded-2xl bg-[#0F0C24] border border-[#251F47] shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#C6FF3D]" />
                Hackathon Lifecycle Control
              </h2>
              <p className="text-xs text-[#8e88b8] mt-0.5">
                Control the sprint phase. Closing the hackathon automatically issues official certificates to all {participants.length} hackers.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181339] border border-[#2e2763]">
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
                Live sprint, team matchmaking, open submissions.
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
                Submissions locked. Pitch review active.
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
                Finalizes event & auto-mints certificates to all.
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

        {/* Section 2: ALL REGISTERED PARTICIPANTS & SQUADS DIRECTORY */}
        <div className="p-6 rounded-2xl bg-[#0F0C24] border border-[#251F47] shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C6FF3D]" />
                Registered Participants & Squads ({participants.length})
              </h2>
              <p className="text-xs text-[#8e88b8] mt-0.5">
                Complete live directory of all Solo builders, Squad Captains, and Squad Members registered in this hackathon.
              </p>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8e88b8]" />
              <input
                type="text"
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                placeholder="Search builder, email, squad, ticket..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#161233] border border-[#2c2459] text-xs text-white placeholder:text-[#5d5687] focus:outline-none focus:border-[#7C5CFF]"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-4 font-mono text-xs">
            <button
              onClick={() => setParticipantFilterTab("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                participantFilterTab === "all"
                  ? "bg-[#7C5CFF] text-white shadow-sm"
                  : "bg-[#161233] text-[#8e88b8] hover:text-white"
              }`}
            >
              ALL BUILDERS ({participants.length})
            </button>
            <button
              onClick={() => setParticipantFilterTab("solo")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                participantFilterTab === "solo"
                  ? "bg-[#7C5CFF] text-white shadow-sm"
                  : "bg-[#161233] text-[#8e88b8] hover:text-white"
              }`}
            >
              SOLO BUILDERS ({soloCount})
            </button>
            <button
              onClick={() => setParticipantFilterTab("team")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                participantFilterTab === "team"
                  ? "bg-[#7C5CFF] text-white shadow-sm"
                  : "bg-[#161233] text-[#8e88b8] hover:text-white"
              }`}
            >
              SQUADS & TEAMS ({teamCount})
            </button>
            <button
              onClick={() => setParticipantFilterTab("submitted")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                participantFilterTab === "submitted"
                  ? "bg-[#7C5CFF] text-white shadow-sm"
                  : "bg-[#161233] text-[#8e88b8] hover:text-white"
              }`}
            >
              SUBMITTED PROJECTS ({submissionCount})
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161233] text-[#8e88b8] uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Builder</th>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Squad Type</th>
                  <th className="py-3 px-4">Project Submission</th>
                  <th className="py-3 px-4">Certificate Status</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1942]">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#8e88b8]">
                      No participants found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p) => {
                    const hasTeam = !!p.teamCode || !!p.teamName;
                    const hasSub = !!p.submission;
                    const hasCert = !!p.certificate;

                    return (
                      <tr key={p.ticketNumber} className="hover:bg-[#141030] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{p.name || "Anonymous Builder"}</div>
                          <div className="text-[11px] text-[#8e88b8] font-mono">{p.email}</div>
                          {p.roleTitle && (
                            <div className="text-[10px] text-[#C6FF3D] mt-0.5">{p.roleTitle}</div>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-[#a59fcf]">
                          {p.ticketNumber}
                        </td>

                        <td className="py-3 px-4">
                          {hasTeam ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple/20 text-purple border border-purple/30">
                                {p.isCaptain ? "★ CAPTAIN" : "● SQUAD"}
                              </span>
                              <div className="text-xs font-semibold text-white mt-1">
                                {p.teamName || "Team Squad"}
                              </div>
                              {p.teamCode && (
                                <div className="text-[10px] font-mono text-[#8e88b8]">
                                  Code: {p.teamCode}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-[#8e88b8] border border-slate-700">
                              SOLO BUILDER
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {hasSub ? (
                            <div>
                              <div className="font-semibold text-white truncate max-w-[180px]">
                                {p.submission?.title}
                              </div>
                              <div className="flex gap-2 text-[10px] text-[#C6FF3D] mt-0.5">
                                {p.submission?.demoUrl && <span>Live Demo ✓</span>}
                                {p.submission?.repoUrl && <span>Repo ✓</span>}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#645e8f] text-[11px]">No Submission Yet</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {hasCert ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.certificate?.type === "WINNER_FIRST"
                                  ? "bg-amber-400 text-black"
                                  : p.certificate?.type.startsWith("WINNER")
                                  ? "bg-purple text-white"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              }`}
                            >
                              {p.certificate?.awardTitle}
                            </span>
                          ) : (
                            <span className="text-[#645e8f] text-[11px]">Unissued</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => selectParticipantForAward(p.ticketNumber, p.name)}
                              className="px-2.5 py-1 rounded-lg bg-[#251f52] hover:bg-[#342b73] text-[#C6FF3D] font-mono text-[10px] font-bold transition-colors flex items-center gap-1"
                              title="Select for Award in Studio"
                            >
                              <Trophy className="w-3 h-3" />
                              Award
                            </button>

                            <Link
                              href={`/hackathons/${slug}/pass/${p.ticketNumber}`}
                              target="_blank"
                              className="px-2.5 py-1 rounded-lg bg-[#161233] hover:bg-[#201b47] text-white font-mono text-[10px] transition-colors"
                              title="Open 3D Passport"
                            >
                              Passport ↗
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Special Winner & Awards Studio Form */}
        <div id="award-studio-form" className="p-6 rounded-2xl bg-[#0F0C24] border border-[#251F47] shadow-xl">
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
                  Select Participant / Squad ({participants.length} Available)
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
                      {p.name} ({p.ticketNumber}) {p.teamName ? `· Squad: ${p.teamName}` : "· Solo"}
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
                {selectedTicket
                  ? `Ready to stamp honor badge for ${selectedTicket}`
                  : "Pick a builder from the table or dropdown above to mint their honor badge."}
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

        {/* Section 4: Issued Credentials & Certificates Roster */}
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
                value={certSearch}
                onChange={(e) => setCertSearch(e.target.value)}
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

        {/* Section 5: Partner Host Applications & Hackathon Inquiries */}
        <div id="host-proposals-section" className="p-6 rounded-2xl bg-[#0F0C24] border border-[#251F47] shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#C6FF3D]" />
                <h2 className="text-lg font-bold text-white">Partner Host Proposals & Applications</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#C6FF3D]/15 border border-[#C6FF3D]/30 text-[#C6FF3D] font-mono text-xs font-bold">
                  {hostProposals.filter((p) => p.status === "PENDING").length} Pending Review
                </span>
              </div>
              <p className="text-xs text-[#8e88b8] mt-0.5">
                Proposals submitted via the public Host Hackathon portal. Notifications are automatically emailed to admin.
              </p>
            </div>
          </div>

          {/* Proposals Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161233] text-[#8e88b8] uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Ref / Date</th>
                  <th className="py-3 px-4">Organization & Contact</th>
                  <th className="py-3 px-4">Proposed Hackathon</th>
                  <th className="py-3 px-4">Audience & Budget</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1942]">
                {hostProposals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#8e88b8]">
                      No partner host proposals submitted yet. Applications will appear here automatically when submitted.
                    </td>
                  </tr>
                ) : (
                  hostProposals.map((prop) => (
                    <tr key={prop.id} className="hover:bg-[#141030] transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[#C6FF3D] font-bold block">{prop.refNumber}</span>
                        <span className="text-[10px] text-[#8e88b8]">
                          {new Date(prop.createdAt).toLocaleDateString("en-GB")}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{prop.orgName}</div>
                        <div className="text-[11px] text-[#a59fcf]">
                          {prop.contactName} &lt;<a href={`mailto:${prop.contactEmail}`} className="text-[#C6FF3D] underline">{prop.contactEmail}</a>&gt;
                        </div>
                        {prop.contactHandle && (
                          <div className="text-[10px] text-[#8e88b8]">Handle: {prop.contactHandle}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{prop.hackathonTitle}</div>
                        {prop.targetDates && (
                          <div className="text-[10px] text-[#8e88b8]">Timeline: {prop.targetDates}</div>
                        )}
                        {prop.tracksAndGoals && (
                          <div className="text-[10px] text-[#ded8ff] max-w-xs truncate" title={prop.tracksAndGoals}>
                            Tracks: {prop.tracksAndGoals}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-white font-mono text-[11px]">
                          👥 {prop.expectedParticipants || "100-300"}
                        </div>
                        <div className="text-[#C6FF3D] font-mono text-[11px]">
                          💰 {prop.estimatedPrizePool || "TBD"}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={prop.status}
                          onChange={(e) => handleUpdateProposalStatus(prop.id, e.target.value)}
                          className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold outline-none border transition-colors ${
                            prop.status === "PENDING"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : prop.status === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : prop.status === "REVIEWED"
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          <option value="PENDING" className="bg-[#141030] text-white">PENDING</option>
                          <option value="REVIEWED" className="bg-[#141030] text-white">REVIEWED</option>
                          <option value="APPROVED" className="bg-[#141030] text-white">APPROVED</option>
                          <option value="DECLINED" className="bg-[#141030] text-white">DECLINED</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {prop.status !== "APPROVED" ? (
                            <button
                              onClick={() => handleApproveAndLaunchProposal(prop)}
                              disabled={approvingId === prop.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C6FF3D] hover:bg-[#b5f028] text-[#0A071B] font-mono text-[10px] font-black transition-all shadow-sm"
                              title="Approve proposal, create hackathon instance, and notify organizer"
                            >
                              <Zap className="w-3 h-3" />
                              {approvingId === prop.id ? "Launching..." : "Launch Event 🚀"}
                            </button>
                          ) : (
                            <Link
                              href={`/hackathons/${prop.hackathonTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold hover:bg-emerald-500/30 transition-colors"
                            >
                              Live Arena ↗
                            </Link>
                          )}

                          <a
                            href={`mailto:${prop.contactEmail}?subject=Re:%20GoHackerz%20Hackathon%20Hosting%20Proposal%20[${prop.refNumber}]`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#251f52] hover:bg-[#342b73] text-[#C6FF3D] font-mono text-[10px] font-bold transition-colors"
                          >
                            <Mail className="w-3 h-3" />
                            Email
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Launch Success Callout */}
          {launchSuccessInfo && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-300 block">
                  🎉 Hackathon "{launchSuccessInfo.title}" Successfully Launched!
                </span>
                <span className="text-xs text-[#ded8ff]">
                  Official approval and onboarding credentials dispatched for reference {launchSuccessInfo.refNumber}.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/hackathons/${launchSuccessInfo.slug}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg bg-[#C6FF3D] text-[#0A071B] font-mono text-xs font-bold"
                >
                  View Arena ↗
                </Link>
                <Link
                  href={`/hackathons/${launchSuccessInfo.slug}/admin`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg bg-[#7C5CFF] text-white font-mono text-xs font-bold"
                >
                  Open Studio ↗
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
