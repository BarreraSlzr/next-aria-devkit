import type { DevVector, InspectionContext } from "./types";
import { fmChat, fmStatus } from "./fm";

const QUESTIONS = {
  area: {
    type: "choice",
    instructions: "Which development area should move first?",
    criteria: {
      performance: "LCP, hydration, waterfalls, rerenders",
      ux: "flow friction or confusing state",
      ui: "layout, hierarchy, spacing",
      a11y: "keyboard, roles, names, focus",
      data: "fetch, cache, mutation",
      infra: "build, runtime, routing",
    },
  },
  severity: {
    type: "score",
    instructions: "How severe is this for shipping the current route?",
    criteria: ["Cosmetic", "Noticeable", "High", "Blocking"],
  },
  action: {
    type: "choice",
    instructions: "What should the developer do next?",
    criteria: {
      measure: "Need more evidence",
      "fix-now": "Clear local high-leverage fix",
      defer: "Real but not the bottleneck",
      "ask-user": "Missing product intent",
    },
  },
  worthFixing: {
    type: "boolean",
    instructions: "Is this worth changing in the current loop?",
  },
};

const FALLBACK: DevVector = {
  source: "unavailable",
  area: "unknown",
  severity: 0,
  action: "unknown",
  worthFixing: 0,
  direction: "No Jev key and fm serve is down",
};

export async function evaluateVector(ctx: InspectionContext): Promise<DevVector> {
  if (process.env.AI_GATEWAY_API_KEY || process.env.TYPESAFE_AI_API_KEY) {
    try {
      const { experimental_evaluate } = await import("ai");
      const result = await experimental_evaluate({
        model: "typesafe-ai/jev-latest",
        state: ctx,
        questions: QUESTIONS,
        providerOptions: { gateway: { zeroDataRetention: true } },
      });
      return {
        source: "jev",
        area: result.answers.area.choice,
        severity: result.answers.severity.score,
        action: result.answers.action.choice,
        worthFixing: result.answers.worthFixing.probability,
        direction: `${result.answers.area.choice} → ${result.answers.action.choice}`,
      };
    } catch (error) {
      const hint = error instanceof Error ? error.message : String(error);
      const status = await fmStatus();
      if (!status.ok) {
        return { ...FALLBACK, direction: `Jev failed (${hint}). ${status.hint ?? "fm serve is down"}` };
      }
    }
  }

  const status = await fmStatus();
  if (!status.ok) {
    return { ...FALLBACK, direction: status.hint ?? FALLBACK.direction };
  }

  const raw = await fmChat([
    { role: "system", content: "Return only JSON DevVector. Keys: area,severity,action,worthFixing,direction. area in performance|ux|ui|a11y|data|infra. action in measure|fix-now|defer|ask-user. severity 0-1. worthFixing 0-1." },
    { role: "user", content: JSON.stringify(ctx) },
  ]);
  const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  return {
    source: "fm-schema",
    area: parsed.area ?? "unknown",
    severity: Number(parsed.severity ?? 0),
    action: parsed.action ?? "unknown",
    worthFixing: Number(parsed.worthFixing ?? 0),
    direction: String(parsed.direction ?? `${parsed.area} → ${parsed.action}`),
  };
}
