/** Visible FAQs that also feed FAQPage structured data (AEO). Keep answers short and self-contained. */
export type Faq = { q: string; a: string };

export const SITE_FAQS: Faq[] = [
  {
    q: "What is RepoRally?",
    a: "RepoRally is a free publishing platform and hackathon home for software builders. Developers publish engineering essays, build logs and post-mortems, and join community hackathons with verifiable certificates.",
  },
  {
    q: "Is RepoRally free to use?",
    a: "Yes. Reading, writing and joining hackathons on RepoRally is free.",
  },
  {
    q: "How do I publish an article on RepoRally?",
    a: "Create a free account, open the Write page, draft your post with the editor, choose a topic, and publish. Posts get their own page, share card and author profile.",
  },
  {
    q: "What kind of writing does RepoRally publish?",
    a: "Honest engineering writing: architecture trade-offs, incident post-mortems, performance tuning, AI systems, and build logs that show how something was actually made. No listicles.",
  },
  {
    q: "What is Bolo & Build?",
    a: "Bolo & Build is RepoRally's one-day, voice-only hackathon on Sunday 13 December 2026, 10:00 to 18:00 IST, in Hyderabad and online. Builders use Wispr Flow to dictate to a coding agent, build an app for India in one of five tracks, and publish their build log on RepoRally.",
  },
  {
    q: "Who can join a RepoRally hackathon?",
    a: "Anyone. Hackathons are free to join, solo or in a squad, in person or online, and every finisher can earn a certificate that anyone can verify on RepoRally.",
  },
  {
    q: "Who runs RepoRally?",
    a: "RepoRally is built and run by Lora Tech Solutions in Hyderabad, India. Contact hi@loratechsolutions.com for pitches, partnerships and corrections.",
  },
];

export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
