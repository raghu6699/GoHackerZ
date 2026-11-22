import type { HackathonData } from "./hackathons";

/**
 * Curated, code-defined events. These are real hackathons we host ourselves
 * (not demo data). They are served by getHackathonBySlug / getAllHackathons and
 * get a real database row the first time someone registers.
 *
 * NOTE: type-only import above — keep this file free of runtime imports so it
 * can be used from lib/participant-store.ts without a circular dependency.
 */

export const BOLO_SLUG = "bolo-and-build";

// 28 Nov 2026, 10:00–18:00 IST (= 04:30–12:30 UTC)
export const BOLO_AND_BUILD: HackathonData = {
  id: "gh-bolo-and-build",
  slug: BOLO_SLUG,
  title: "Bolo & Build",
  tagline: "Build something for India. Say every line out loud.",
  description:
    "A one-day, voice-only build, 10am to 6pm IST. Pick a problem for India, build the app with any coding agent, and drive it entirely by voice with Wispr Flow. Then publish your build log on RepoRally so the next builder can learn from it.",
  status: "UPCOMING",
  startDate: "2026-11-28T04:30:00.000Z",
  endDate: "2026-11-28T12:30:00.000Z",
  submissionDeadline: "2026-11-28T12:30:00.000Z",
  prizePool: "Awards, certificates and recognition",
  participantCount: 0,
  teamCount: 0,
  tracks: [
    {
      id: "health",
      title: "Health: understand your care",
      prize: "Track Winner",
      description:
        "Help a patient or caregiver understand a prescription, describe symptoms or find the nearest care, in their own language.",
      tags: ["healthcare", "accessibility", "multilingual"],
    },
    {
      id: "farm",
      title: "Farmers: advice when it matters",
      prize: "Track Winner",
      description:
        "Mandi prices, weather alerts and crop guidance for people working in the field with a basic phone.",
      tags: ["agritech", "weather", "markets"],
    },
    {
      id: "learn",
      title: "Learning: a tutor in every classroom",
      prize: "Track Winner",
      description:
        "Tools for Tier 2 and Tier 3 students and government-school teachers: homework help, lesson planning, revision.",
      tags: ["edtech", "teachers", "students"],
    },
    {
      id: "shops",
      title: "Small business: run a kirana faster",
      prize: "Track Winner",
      description:
        "Billing, stock and GST for the shopkeeper who has ten customers waiting and no time to spare.",
      tags: ["msme", "billing", "inventory"],
    },
    {
      id: "citizen",
      title: "Citizens: schemes, forms, complaints",
      prize: "Track Winner",
      description:
        "Help people find the government schemes they qualify for, fill the forms, and file the complaints that get answered.",
      tags: ["govtech", "civic", "forms"],
    },
  ],
  schedule: [
    { time: "10:00 IST", title: "Check-in and kickoff", description: "Registration desk, pass pickup, mic check, rules and tracks. Repo creation allowed from here.", status: "upcoming" },
    { time: "10:30 IST", title: "Build starts", description: "Voice only. Start the clock.", status: "upcoming" },
    { time: "13:30 IST", title: "Lunch and mentor round", description: "Quick break, mentor check-ins and a build-log reminder.", status: "upcoming" },
    { time: "15:30 IST", title: "Submissions close", description: "Repo, demo video (3 min max) and build log link due.", status: "upcoming" },
    { time: "16:00 IST", title: "Judging and shortlist", description: "Judges review submissions and pick the finalists.", status: "upcoming" },
    { time: "16:30 IST", title: "Finalist demos", description: "Shortlisted teams demo and answer questions.", status: "upcoming" },
    { time: "17:30 IST", title: "Awards", description: "Winners announced on stage and on RepoRally.", status: "upcoming" },
    { time: "18:00 IST", title: "Close", description: "Photos, networking and wrap-up.", status: "upcoming" },
  ],
  rules: [
    "Teams of 1 to 4. Mixed skills are welcome: developers, designers, data people and first-time builders.",
    "Pick one of the five tracks and build an app for that problem. Your app does not need voice features: the voice rule is about how you build it.",
    "Use Wispr Flow to dictate your prompts and instructions to your coding agent. Typing is allowed for small fixes, but the build should be driven by voice.",
    "Any coding agent and any model is fine: Claude Code, Codex, Cursor, GitHub Copilot, Open Code, Antigravity and others.",
    "Start from a blank repository. Templates and boilerplate are fine, previously built projects are not.",
    "Your repository must be public, with commits made during the event window.",
    "Publish your build log on RepoRally. It is required for prize eligibility.",
    "Submit by 15:30 IST: repo link, a demo video of 3 minutes or less, and the link to your build log.",
    "Add a screenshot of your Wispr Flow stats to your build log as proof of voice use.",
    "Judges' decisions are final. Be kind, credit your sources and respect other teams.",
  ],
  sponsors: [
    {
      name: "RepoRally",
      tier: "Title",
      logoText: "RepoRally",
      perk: "Host platform: registration, Builder Passports, build-log publishing and certificates.",
    },
  ],
  faqs: [
    {
      q: "What is Bolo & Build?",
      a: "Bolo & Build is a free, one-day hackathon run by RepoRally where you build an app for India entirely by voice. You dictate to a coding agent with Wispr Flow, pick one of five tracks (health, farmers, learning, small business, citizens), and publish your build log on RepoRally.",
    },
    {
      q: "When and where is Bolo & Build?",
      a: "Saturday 28 November 2026, 10:00 to 18:00 IST, in Hyderabad, India and online. You can join in person or from anywhere.",
    },
    {
      q: "What do I need to take part?",
      a: "A laptop, a free Wispr Flow install (wisprflow.ai/downloads), a coding agent of your choice, and a RepoRally account. You can join solo or with a squad.",
    },
    {
      q: "Do I have to use Wispr Flow?",
      a: "Yes. The whole point is building by voice with Wispr Flow. Typing is fine for small fixes, but the build should be driven by dictation.",
    },
    {
      q: "Does my app have to use voice?",
      a: "No. Your app can be anything useful for your track. The voice requirement is about how you build it.",
    },
    {
      q: "Can I join online?",
      a: "Yes. Online teams register the same way, build the same hours and submit the same things. Shortlisted online teams present on video in the finalist demos.",
    },
    {
      q: "What is the build log?",
      a: "A public article on RepoRally describing how you built your project by voice: the problem, example dictations, what worked, what broke and what you learned.",
    },
    {
      q: "Who are the judges?",
      a: "A panel of judges from global companies, mostly joining remotely. Names and the exact judging format will be announced on this page.",
    },
    {
      q: "Is it free?",
      a: "Yes, registration is free. Offline seats in Hyderabad are limited, so register early.",
    },
    {
      q: "Is this an official Wispr Flow event?",
      a: "No. It is a community event hosted by RepoRally, built around Wispr Flow. Wispr Flow is not a sponsor and is not providing prizes or credits. Participants can use Flow on its free plan or their own subscription.",
    },
  ],
};

export const CURATED_EVENTS: HackathonData[] = [BOLO_AND_BUILD];

export function getCuratedEvent(slugOrId: string): HackathonData | null {
  const clean = slugOrId.replace(/^gh-/, "");
  return CURATED_EVENTS.find((e) => e.slug === clean || e.id === slugOrId) ?? null;
}
