// MediSphere/lib/intentMatcher.ts (DEBUG-ENHANCED)
import intentConfig from "../constants/intentConfig.json";
import documentTypes from "../constants/documentTypes.json";

/**
 * Normalize helper for matching
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
  console.log("--------------------------------------------------");
  console.log("[intentMatcher] RAW INPUT:", rawText);

  const text = normalize(rawText);
  console.log("[intentMatcher] NORMALIZED:", text);

  // 1) DOC-TYPE MATCHING
  for (const docType of Object.keys(documentTypes)) {
    const normDoc = normalize(docType);
    const words = normDoc.split(" ");

    const allWordsPresent = words.every((w) => text.includes(w));

    console.log(
      `[intentMatcher] Checking docType '${docType}' → normalized '${normDoc}'`
    );
    console.log("    → words:", words, "present=", allWordsPresent);

    if (allWordsPresent) {
      const askedRecommend = /(recommend|suggest|advice|what should)/i.test(
        rawText
      );
      console.log(
        "    ✔ docType MATCHED:",
        docType,
        "askedRecommend=",
        askedRecommend
      );

      if (askedRecommend) {
        console.log("    → RETURN show_recommendations for docType:", docType);
        return { intent: "show_recommendations", entity: docType };
      }
      console.log("    → RETURN show_recent_tests for docType:", docType);
      return { intent: "show_recent_tests", entity: docType };
    }
  }

  // 2) FIELD-LEVEL MATCHING
  for (const [docType, fields] of Object.entries(documentTypes) as [
    string,
    string[]
  ][]) {
    for (const field of fields) {
      const fieldNorm = normalize(field);
      const triggerWord = fieldNorm.split(" ")[0];

      console.log(
        `[intentMatcher] Checking field '${field}' (norm='${fieldNorm}') with trigger '${triggerWord}'`
      );

      if (triggerWord && text.includes(triggerWord)) {
        const askedRecommend = /(recommend|suggest|advice|what should)/i.test(
          rawText
        );
        console.log(
          "    ✔ FIELD MATCHED:",
          field,
          "→ belongs to docType:",
          docType,
          "askedRecommend=",
          askedRecommend
        );

        if (askedRecommend) {
          console.log("    → RETURN show_recommendations for FIELD:", field);
          return { intent: "show_recommendations", entity: field };
        }

        console.log(
          "    → RETURN show_recent_tests for FIELD docType:",
          docType
        );
        return { intent: "show_recent_tests", entity: docType };
      }
    }
  }

  // 3) INTENT CONFIG PATTERNS
  for (const [intentName, patterns] of Object.entries(intentConfig.intents)) {
    for (const pattern of patterns) {
      const re = new RegExp(pattern, "i");
      if (re.test(rawText)) {
        console.log(
          `[intentMatcher] ✔ Pattern Match → intent '${intentName}' via ${pattern}`
        );
        return { intent: intentName };
      }
    }
  }

  // 4) GREETING FALLBACK
  if (/(hi|hello|hey|yo)/i.test(rawText)) {
    console.log("[intentMatcher] ✔ Greeting matched → RETURN greeting");
    return { intent: "greeting" };
  }

  // 5) UNKNOWN INTENT
  console.log("[intentMatcher] ❗ NO MATCH FOUND → RETURN unknown");
  return { intent: "unknown" };
}
