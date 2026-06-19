import assert from "assert";
import { generateAskSpeakerMessage, DEFAULT_ASK_SPEAKER_TEMPLATE } from "../src/utils/askSpeaker";

function runTests() {
  console.log("Running generateAskSpeakerMessage tests...");

  // Test Case 1: Template with all options on
  const message1 = generateAskSpeakerMessage({
    template: DEFAULT_ASK_SPEAKER_TEMPLATE,
    includeDate: true,
    includeTime: true,
    includeLocation: true,
    speakerName: "Dr. Peter Salib",
    senderName: "Dr. Michael",
    sessionTitle: "Urology Advancements",
    dateStr: "2026-06-25",
    timeStr: "11:00 AM",
    locationStr: "Main Hall A",
    questionText: "Can laser therapies be used safely for this?"
  });

  assert(message1.includes("Hello *Dr. Peter Salib*"), "Test 1 Speaker placeholder failed");
  assert(message1.includes("My name is *Dr. Michael*"), "Test 1 Sender placeholder failed");
  assert(message1.includes("Date: 2026-06-25"), "Test 1 Date placeholder failed");
  assert(message1.includes("Time: 11:00 AM"), "Test 1 Time placeholder failed");
  assert(message1.includes("Location: Main Hall A"), "Test 1 Location placeholder failed");
  assert(message1.includes('_"Can laser therapies be used safely for this?"_'), "Test 1 Question formatting failed");

  // Test Case 2: Template with date and location turned off (should strip those lines)
  const message2 = generateAskSpeakerMessage({
    template: DEFAULT_ASK_SPEAKER_TEMPLATE,
    includeDate: false,
    includeTime: true,
    includeLocation: false,
    speakerName: "Dr. Peter Salib",
    senderName: "Dr. Michael",
    sessionTitle: "Urology Advancements",
    dateStr: "2026-06-25",
    timeStr: "11:00 AM",
    locationStr: "Main Hall A",
    questionText: "What are safe margins?"
  });

  assert(!message2.includes("Date:"), "Test 2 Date line should be stripped");
  assert(message2.includes("Time: 11:00 AM"), "Test 2 Time should be included");
  assert(!message2.includes("Location:"), "Test 2 Location line should be stripped");

  console.log("All generateAskSpeakerMessage tests passed successfully! ✅");
}

try {
  runTests();
} catch (error) {
  console.error("Test execution failed:", error);
  process.exit(1);
}
