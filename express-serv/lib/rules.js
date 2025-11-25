// express-serv/lib/rules.js
// Simple rule engine returning array of recommendations per record.
// Each rec: { rule, text, level: 'urgent'|'warn'|'info', actions?: string[] }

function numericVal(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d.\-]/g, "");
    const n = parseFloat(cleaned);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export default function evaluateRules({ record, docinfo, docType, userId }) {
  const recs = [];
  const dt = (docType || "").toLowerCase();

  function push(rule, text, level = "info", actions = []) {
    recs.push({ rule, text, level, actions });
  }

  try {
    // Blood tests
    if (dt.includes("blood")) {
      // Hemoglobin
      if (docinfo["Hemoglobin"] !== undefined) {
        const v = numericVal(docinfo["Hemoglobin"]);
        if (v !== null) {
          if (v < 11)
            push(
              "hb-low",
              `Hemoglobin low (${v}). Possible anemia — consult doctor.`,
              "urgent",
              ["Set reminder", "View record"]
            );
          else if (v < 12.5)
            push(
              "hb-border",
              `Hemoglobin slightly low (${v}). Consider diet/iron check.`,
              "warn",
              ["Diet tips"]
            );
          else push("hb-ok", `Hemoglobin ${v} within expected range.`, "info");
        } else if (
          String(docinfo["Hemoglobin"]).toLowerCase().includes("low")
        ) {
          push(
            "hb-low-text",
            `Hemoglobin flagged low in your report.`,
            "warn",
            ["View record"]
          );
        }
      }

      // Glucose
      const glucoseKey =
        docinfo["Glucose (mg/dL)"] !== undefined
          ? "Glucose (mg/dL)"
          : docinfo["Glucose"] !== undefined
          ? "Glucose"
          : null;
      if (glucoseKey) {
        const v = numericVal(docinfo[glucoseKey]);
        if (v !== null) {
          if (v >= 200)
            push(
              "glucose-high-very",
              `Glucose ${v} mg/dL — high, urgent follow-up recommended.`,
              "urgent",
              ["Set reminder", "View record"]
            );
          else if (v >= 140)
            push(
              "glucose-high",
              `Glucose ${v} mg/dL — borderline/high. Discuss with clinician.`,
              "warn",
              ["Get recommendations"]
            );
          else
            push(
              "glucose-ok",
              `Glucose ${v} mg/dL within typical range.`,
              "info"
            );
        }
      }

      // Cholesterol
      const cholKey =
        docinfo["Cholesterol (mg/dL)"] !== undefined
          ? "Cholesterol (mg/dL)"
          : docinfo["Cholesterol"] !== undefined
          ? "Cholesterol"
          : null;
      if (cholKey) {
        const v = numericVal(docinfo[cholKey]);
        if (v !== null) {
          if (v >= 240)
            push(
              "chol-high",
              `Cholesterol ${v} mg/dL — high. Consider lifestyle changes and follow-up.`,
              "warn",
              ["Diet tips", "Set reminder"]
            );
          else if (v >= 200)
            push(
              "chol-border",
              `Cholesterol ${v} mg/dL — borderline. Consider diet/exercise.`,
              "info",
              ["Diet tips"]
            );
          else
            push(
              "chol-ok",
              `Cholesterol ${v} mg/dL within expected range.`,
              "info"
            );
        }
      }
    }

    // Pharmacy
    if (dt.includes("pharmacy")) {
      const med = docinfo["Medicine Name"] || docinfo["Medicine"] || "";
      const dur = docinfo["Duration"] || "";
      const dosage = docinfo["Dosage"] || "";

      if (med && typeof med === "string") {
        const mlow = med.toLowerCase();
        if (mlow.includes("antibiotic") || mlow.includes("antibiotics")) {
          push(
            "pharm-abx",
            `This record lists antibiotics (${med}). Complete the prescribed course and avoid unnecessary reuse.`,
            "info",
            ["Set reminder"]
          );
        } else {
          push(
            "pharm",
            `Medicine: ${med} ${dosage ? `— ${dosage}` : ""} ${
              dur ? `(for ${dur})` : ""
            }`,
            "info"
          );
        }
      }

      if (dur && typeof dur === "string") {
        const durNum = numericVal(dur);
        if (durNum && durNum >= 3) {
          push(
            "pharm-long-duration",
            `Medication duration ${dur} seems long. Review with prescriber.`,
            "warn"
          );
        }
      }
    }

    // Imaging (X-Ray, MRI, Ultrasound)
    if (
      dt.includes("x") ||
      dt.includes("ultrasound") ||
      dt.includes("mri") ||
      dt.includes("ecg")
    ) {
      const keys = Object.keys(docinfo || {});
      for (const k of keys) {
        const vraw = docinfo[k];
        if (!vraw) continue;
        const v = String(vraw).toLowerCase();
        if (v.includes("fracture") || v.includes("broken")) {
          push(
            "imaging-fracture",
            `Imaging mentions "fracture" or "broken". Urgent follow-up recommended.`,
            "urgent",
            ["View record"]
          );
        } else if (
          v.includes("ulcer") ||
          v.includes("mass") ||
          v.includes("lesion") ||
          v.includes("nodule")
        ) {
          push(
            "imaging-find",
            `Imaging findings: "${String(vraw).slice(
              0,
              80
            )}..." — discuss with specialist.`,
            "warn",
            ["View record", "Set reminder"]
          );
        } else if (v.includes("normal") || v.includes("no significant")) {
          push("imaging-ok", `Imaging appears unremarkable (${k}).`, "info");
        }
      }
    }

    // ECG quick checks
    if (dt.includes("ecg")) {
      if (docinfo["Heart Rate"]) {
        const hr = numericVal(docinfo["Heart Rate"]);
        if (hr !== null) {
          if (hr < 50 || hr > 120)
            push(
              "ecg-abn-hr",
              `Heart rate ${hr} bpm — abnormal. Consider cardiology follow-up.`,
              "warn"
            );
          else
            push(
              "ecg-ok",
              `Heart rate ${hr} bpm within expected range.`,
              "info"
            );
        }
      }
      if (
        docinfo["Rhythm"] &&
        String(docinfo["Rhythm"]).toLowerCase().includes("af")
      ) {
        push(
          "ecg-af",
          `ECG mentions irregular rhythm (AF). Please consult cardiology.`,
          "urgent"
        );
      }
    }

    // fallback: generic if nothing pushed
    if (recs.length === 0 && dt) {
      push(
        "generic",
        `Record (${
          docType || "unknown"
        }): no specific flagged findings detected by rules.`,
        "info"
      );
    }
  } catch (e) {
    console.error("[rules] error:", e);
    push("error", "Failed to evaluate rules for this record.", "info");
  }

  return recs;
}
