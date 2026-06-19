export const DEFAULT_ASK_SPEAKER_TEMPLATE = `Hello *{speakerName}*,

My name is *{senderName}*.

I have a question regarding your session "*{sessionTitle}*":
Date: {date}
Time: {time}
Location: {location}

_"{questionText}"_`;

interface GeneratorConfig {
  template: string;
  includeDate: boolean;
  includeTime: boolean;
  includeLocation: boolean;
  speakerName: string;
  senderName: string;
  sessionTitle: string;
  dateStr: string;
  timeStr: string;
  locationStr: string;
  questionText: string;
}

/**
 * Builds the customized WhatsApp/Plain-text message for the scientific speaker
 * based on selected template placeholders and toggled config options.
 */
export function generateAskSpeakerMessage(config: GeneratorConfig): string {
  const {
    template,
    includeDate,
    includeTime,
    includeLocation,
    speakerName,
    senderName,
    sessionTitle,
    dateStr,
    timeStr,
    locationStr,
    questionText,
  } = config;

  const lines = template.split("\n");
  const filteredLines = lines
    .map((line) => {
      // If a placeholder toggle is disabled, strip out the line containing that placeholder entirely
      if (!includeDate && line.includes("{date}")) return null;
      if (!includeTime && line.includes("{time}")) return null;
      if (!includeLocation && line.includes("{location}")) return null;

      // Substitute active placeholders
      return line
        .replace(/{speakerName}/g, speakerName)
        .replace(/{senderName}/g, senderName)
        .replace(/{sessionTitle}/g, sessionTitle)
        .replace(/{questionText}/g, questionText)
        .replace(/{date}/g, dateStr)
        .replace(/{time}/g, timeStr)
        .replace(/{location}/g, locationStr);
    })
    .filter((line) => line !== null) as string[];

  return filteredLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
