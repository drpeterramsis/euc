import assert from "assert";
import { normalizeUrl } from "../src/utils/normalizeUrl";

function runTests() {
  console.log("Running normalizeUrl tests...");

  // Test Case 1: Already http:// or https:// (should preserve original casing and paths)
  assert.strictEqual(normalizeUrl("http://example.com"), "http://example.com", "Test 1 Failed");
  assert.strictEqual(normalizeUrl("https://example.com"), "https://example.com", "Test 2 Failed");
  assert.strictEqual(normalizeUrl("  HTTPS://example.com/path  "), "HTTPS://example.com/path", "Test 3 Failed");

  // Test Case 2: No prefix -> auto-prefix https://
  assert.strictEqual(normalizeUrl("example.com"), "https://example.com", "Test 4 Failed");
  assert.strictEqual(normalizeUrl("example.com/test?query=1"), "https://example.com/test?query=1", "Test 5 Failed");
  assert.strictEqual(normalizeUrl("  test.org  "), "https://test.org", "Test 6 Failed");

  // Test Case 3: Empty or falsy values
  assert.strictEqual(normalizeUrl(""), "", "Test 7 Failed");
  assert.strictEqual(normalizeUrl("   "), "", "Test 8 Failed");
  assert.strictEqual(normalizeUrl(null as any), "", "Test 9 Failed");
  assert.strictEqual(normalizeUrl(undefined as any), "", "Test 10 Failed");

  console.log("All normalizeUrl tests passed successfully! ✅");
}

try {
  runTests();
} catch (error) {
  console.error("Test execution failed:", error);
  process.exit(1);
}
