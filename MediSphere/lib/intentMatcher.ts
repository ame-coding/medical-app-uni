// MediSphere/lib/intentMatcher.ts
// Simple intent matcher for Kitty (replace this file in your repo)

type MatchResult = { intent: string; score: number };

const HELP_PHRASES = [
  "help",
  "what can you do",
  "how can you help",
  "options",
  "what can you do for me",
  "show options",
  "tell me what you can do",
];

const GREET_PHRASES = [
  "hi",
  "hello",
  "hey",
  "hiya",
  "good morning",
  "good evening",
];

const RECOMMEND_PHRASES = [
  "recommend",
  "recommend me",
  "recommendation",
  "what should i test",
  "what tests",
];

const RECENT_PHRASES = [
  "recent",
  "recent tests",
  "show recent",
  "my recent",
  "show my tests",
];

const SET_REMINDER_PHRASES = [
  "reminder",
  "set reminder",
  "remind me",
  "remind",
];

function scoreContainsAny(text: string, phrases: string[]) {
  for (const p of phrases) {
    if (text.includes(p)) return true;
  }
  return false;
}

export function matchIntent(rawText: string): MatchResult {
  if (!rawText) return { intent: "none", score: 0 };
  const text = String(rawText).toLowerCase().trim();

  // exact/help shortcuts
  if (HELP_PHRASES.some((p) => text === p || text.includes(p))) {
    return { intent: "help", score: 0.95 };
  }

  // greetings
  if (GREET_PHRASES.some((g) => text === g || text.startsWith(g + " "))) {
    return { intent: "greeting", score: 0.9 };
  }

  // show recommendations (explicit)
  if (RECOMMEND_PHRASES.some((p) => text.includes(p))) {
    return { intent: "show_recommendations", score: 0.9 };
  }

  // show recent tests
  if (RECENT_PHRASES.some((p) => text.includes(p))) {
    return { intent: "show_recent_tests", score: 0.9 };
  }

  // set reminder
  if (SET_REMINDER_PHRASES.some((p) => text.includes(p))) {
    return { intent: "set_reminder", score: 0.9 };
  }

  // view record direct phrase (e.g., "view record 12", "open record 12")
  const viewMatch = text.match(
    /\b(view|open)\b.*\b(record|test|report)\b.*?(\d{1,6})?/
  );
  if (viewMatch) {
    return { intent: "view_record", score: 0.9 };
  }

  // fallback: low confidence none
  return { intent: "none", score: 0.1 };
}

export default matchIntent;
