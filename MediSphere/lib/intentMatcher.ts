// MediSphere/lib/intentMatcher.ts
import intentConfig from "../constants/intentConfig.json";
import documentTypes from "../constants/documentTypes.json";

/**
 * Normalizes text for simpler matching
 */
function normalize(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchIntent(rawText: string): {
  intent: string;
  entity?: string;
} {
  const text = normalize(rawText);

  // 1) Check document type mentions first (e.g., "blood test")
  for (const docType of Object.keys(documentTypes)) {
    if (
      normalize(docType)
        .split(" ")
        .every((w) => text.includes(w))
    ) {
      // If user explicitly asked for recommendations, return that immediately
      if (/(recommend|suggest|advice|what should)/i.test(rawText)) {
        return { intent: "show_recommendations", entity: docType };
      }
      // If they just mention the docType, return as 'show_recent_tests' by default
      return { intent: "show_recent_tests", entity: docType };
    }
  }

  // 2) Check for field names across all document types (e.g., "hemoglobin", "cholesterol")
  for (const [docType, fields] of Object.entries(documentTypes) as [
    string,
    string[]
  ][]) {
    for (const field of fields) {
      const fieldNorm = normalize(field);
      // match if the user text contains the full field name or key parts
      // e.g., "cholesterol", "blood sugar", "glucose"
      if (fieldNorm && text.includes(fieldNorm.split(" ")[0])) {
        // if user asked for recommendation, return a recommendation intent with the field as entity
        if (/(recommend|suggest|advice|what should)/i.test(rawText)) {
          return { intent: "show_recommendations", entity: field };
        }
        // else, treat as a request to show recent tests for that docType
        return { intent: "show_recent_tests", entity: docType };
      }
    }
  }

  // 3) Fallback to configured intents (keywords from intentConfig.json)
  for (const [intentName, patterns] of Object.entries(intentConfig.intents)) {
    for (const pattern of patterns) {
      const re = new RegExp(pattern, "i");
      if (re.test(rawText)) return { intent: intentName };
    }
  }

  // 4) greetings / small talk fallback
  if (/(hi|hello|hey|yo)/i.test(rawText)) return { intent: "greeting" };

  return { intent: "unknown" };
}
