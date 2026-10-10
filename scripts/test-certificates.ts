import {
  autoGenerateParticipationCertificates,
  issueSpecialAward,
  getCertificateByNumber,
  getCertificateByTicket,
  loadPersistedCertificates,
} from "../lib/participant-store";

async function main() {
  console.log("Testing Certificate System...");

  // 1. Auto generate participation certificates
  const autoResult = await autoGenerateParticipationCertificates("shipathon-2026");
  console.log("Auto-issue result:", autoResult);

  // 2. Issue special 1st place award to Alex Vance (GH-2026-X89B)
  const award = await issueSpecialAward({
    hackathonIdOrSlug: "shipathon-2026",
    ticketNumber: "GH-2026-X89B",
    type: "WINNER_FIRST",
    awardTitle: "1st Place · Grand Champion",
    trackName: "Autonomous AI Agents",
    rank: 1,
  });
  console.log("Special Award Issued:", award);

  // 3. Look up certificate by ticket
  const certByTicket = await getCertificateByTicket("GH-2026-X89B");
  console.log("Retrieved by ticket:", certByTicket?.certNumber, certByTicket?.awardTitle);

  // 4. Look up certificate by certNumber
  if (certByTicket) {
    const certByNum = await getCertificateByNumber(certByTicket.certNumber);
    console.log("Retrieved by certNumber:", certByNum?.recipientName, certByNum?.certNumber);
  }

  const all = loadPersistedCertificates();
  console.log("Total certificates in registry:", all.length);
}

main().catch(console.error);
