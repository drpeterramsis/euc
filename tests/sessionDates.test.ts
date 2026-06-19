import assert from "assert";
import { getNearestSessionDate } from "../src/utils/session";

function runTests() {
  console.log("Running getNearestSessionDate tests...");

  const availableDates = ["2026-06-24", "2026-06-25", "2026-06-27", "2026-06-28"];

  // Test Case 1: Today's date is in availableDates (June 25)
  const todayOverride1 = new Date(2026, 5, 25); // Month index 5 is June
  assert.strictEqual(
    getNearestSessionDate(availableDates, todayOverride1),
    "2026-06-25",
    "Test 1 failed: Should select today's date if available."
  );

  // Test Case 2: Today is June 23 (before all dates). Nearest upcoming is June 24.
  const todayOverride2 = new Date(2026, 5, 23);
  assert.strictEqual(
    getNearestSessionDate(availableDates, todayOverride2),
    "2026-06-24",
    "Test 2 failed: Should select nearest upcoming date."
  );

  // Test Case 3: Today is June 26 (gap between 25 and 27). Nearest upcoming is June 27.
  const todayOverride3 = new Date(2026, 5, 26);
  assert.strictEqual(
    getNearestSessionDate(availableDates, todayOverride3),
    "2026-06-27",
    "Test 3 failed: Should select nearest upcoming date from a gap."
  );

  // Test Case 4: Today is June 29 (after all dates). Most recent past date is June 28.
  const todayOverride4 = new Date(2026, 5, 29);
  assert.strictEqual(
    getNearestSessionDate(availableDates, todayOverride4),
    "2026-06-28",
    "Test 4 failed: Should select most recent past date if no upcoming exists."
  );

  // Test Case 5: Empty dates list
  assert.strictEqual(
    getNearestSessionDate([], todayOverride1),
    "",
    "Test 5 failed: Should return empty string for empty inputs."
  );

  console.log("All getNearestSessionDate tests passed successfully! ✅");
}

try {
  runTests();
} catch (error) {
  console.error("Test execution failed:", error);
  process.exit(1);
}
