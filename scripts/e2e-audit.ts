import assert from "assert";

const BASE_URL = "http://localhost:3000";

interface TestResult {
  name: string;
  url: string;
  status: number;
  ok: boolean;
  notes?: string;
}

const results: TestResult[] = [];

async function checkRoute(name: string, path: string, expectedText?: string, method = "GET") {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, { method, headers: { "Accept": "text/html,application/json" } });
    const text = await res.text();
    const ok = res.status >= 200 && res.status < 400;
    
    let hasExpected = true;
    if (expectedText && !text.includes(expectedText)) {
      hasExpected = false;
    }

    results.push({
      name,
      url,
      status: res.status,
      ok: ok && hasExpected,
      notes: !hasExpected ? `Missing expected text: "${expectedText}"` : `Length: ${text.length} bytes`,
    });
    console.log(`[${ok && hasExpected ? "PASS" : "FAIL"}] ${name} (${res.status}) - ${path}`);
  } catch (err: any) {
    results.push({
      name,
      url,
      status: 0,
      ok: false,
      notes: err.message,
    });
    console.log(`[FAIL] ${name} - Exception: ${err.message}`);
  }
}

async function runFullAudit() {
  console.log("==========================================");
  console.log("    STARTING END-TO-END SYSTEM AUDIT      ");
  console.log("==========================================");

  // Pages
  await checkRoute("1. Homepage", "/", "HI");
  await checkRoute("2. Article Detail Page (/article/hi)", "/article/hi", "HI");
  await checkRoute("3. Topic Page (/topic/ai)", "/topic/ai", "AI");
  await checkRoute("4. Writer Profile Page", "/writer/testuser_df27bf", "testuser");
  await checkRoute("5. Write Editor Page", "/write", "title");
  await checkRoute("6. Guestbook Page", "/guestbook", "Guestbook");
  await checkRoute("7. Search Page", "/search?q=HI", "Search");
  await checkRoute("8. Settings / Profile Page", "/profile", "profile");
  await checkRoute("9. Topics Index Page", "/topics", "Topics");

  // API Endpoints
  await checkRoute("10. API: View Counter", "/api/articles/hi/view", undefined, "POST");
  await checkRoute("11. API: Article React State", "/api/articles/hi/react");
  await checkRoute("12. API: Article Bookmark State", "/api/articles/hi/bookmark");
  await checkRoute("13. API: Article Comments", "/api/articles/hi/comments");
  await checkRoute("14. API: Guestbook Notes", "/api/guestbook");

  console.log("\n==========================================");
  console.log("            AUDIT SUMMARY                 ");
  console.log("==========================================");
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`Total Checks: ${results.length} | Passed: ${passed} | Failed: ${failed}\n`);

  if (failed > 0) {
    console.error("FAILED CHECKS:");
    results.filter(r => !r.ok).forEach(r => {
      console.error(`- ${r.name} (${r.url}): Status ${r.status}, Notes: ${r.notes}`);
    });
    process.exit(1);
  } else {
    console.log("ALL FLOWS AND ENDPOINTS ARE 100% OPERATIONAL!");
  }
}

runFullAudit();
