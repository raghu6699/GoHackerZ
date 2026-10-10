import { prisma } from "../lib/prisma";

async function main() {
  console.log("DATABASE_URL present?", Boolean(process.env.DATABASE_URL));
  try {
    const hackathons = await prisma.hackathon.findMany();
    console.log("Hackathons count:", hackathons.length, hackathons.map(h => ({ id: h.id, slug: h.slug })));

    const participants = await prisma.hackathonParticipant.findMany({
      take: 10,
    });
    console.log("Participants count:", participants.length, participants.map(p => ({ id: p.id, ticket: p.ticketNumber, email: p.email })));

    const submissions = await prisma.hackathonSubmission.findMany({
      take: 10,
    });
    console.log("Submissions count:", submissions.length, submissions);

    // Test creating or upserting a submission directly to test database write
    if (participants.length > 0) {
      const p = participants[0];
      console.log("Testing insert on participant:", p.id, p.ticketNumber);
      const testSub = await prisma.hackathonSubmission.upsert({
        where: { id: "test-sub-1" },
        update: {
          title: "Test Submission",
        },
        create: {
          id: "test-sub-1",
          hackathonId: p.hackathonId,
          participantId: p.id,
          title: "Test Submission",
          tagline: "Test Tagline",
          description: "Test Description",
          repoUrl: "https://github.com/test/repo",
          techStack: ["Next.js", "TypeScript"],
        },
      });
      console.log("Test submission upsert result:", testSub);
    }
  } catch (err) {
    console.error("Database test error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
