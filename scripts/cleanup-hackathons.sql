-- RepoRally: keep ONLY the "football-cup" hackathon.
-- Removes every other hackathon plus their registrations, squads, projects and
-- certificates (all cascade from "Hackathon"), and the host proposals that would
-- otherwise re-create them. IRREVERSIBLE once COMMIT runs.
--
-- Run in Supabase -> SQL Editor.
--   STEP 1: run only the DRY RUN block and read the result.
--   STEP 2: run the DELETE block (it is a transaction; check the output, then it commits).

-- ============ STEP 1: DRY RUN (read-only) ============
SELECT h.slug, h.title,
       (SELECT count(*) FROM "HackathonParticipant" p WHERE p."hackathonId" = h.id) AS registrations,
       (SELECT count(*) FROM "HackathonTeam" t WHERE t."hackathonId" = h.id)        AS squads,
       (SELECT count(*) FROM "HackathonSubmission" s WHERE s."hackathonId" = h.id)  AS projects,
       (SELECT count(*) FROM "HackathonCertificate" c WHERE c."hackathonId" = h.id) AS certificates,
       CASE WHEN h.slug = 'football-cup' THEN 'KEEP' ELSE 'DELETE' END               AS action
FROM "Hackathon" h
ORDER BY action, h.slug;

SELECT "refNumber", "hackathonTitle", "status",
       CASE WHEN lower("hackathonTitle") = 'football cup' THEN 'KEEP' ELSE 'DELETE' END AS action
FROM "HackathonHostProposal"
ORDER BY action, "hackathonTitle";

-- ============ STEP 2: DELETE (run after checking STEP 1) ============
BEGIN;

DELETE FROM "Hackathon" WHERE slug <> 'football-cup';
DELETE FROM "HackathonHostProposal" WHERE lower("hackathonTitle") <> 'football cup';

-- Verify: only football-cup should remain.
SELECT slug, title FROM "Hackathon";
SELECT "refNumber", "hackathonTitle" FROM "HackathonHostProposal";

COMMIT;
