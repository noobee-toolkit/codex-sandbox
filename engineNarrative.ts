import { BASE_LAYERS } from "./orgPolicy.ts"
import type { RecommendationContext } from "./orgTypes.ts"

export function buildNarrative(ctx: RecommendationContext): string {
  const ordered = [...BASE_LAYERS].sort((a, b) => ctx.effectiveScores[b] - ctx.effectiveScores[a])
  const strengths = ordered.slice(0, 3)
  const risks = ordered.slice(-3)
  const nextSteps = ctx.evidence.slice(0, 3).map((e) => e.signal)

  return [
    `Overall readiness is ${Math.round(ctx.meta.overall * 100)} percent with confidence at ${Math.round(ctx.meta.confidence * 100)} percent.`,
    `Strengths: ${strengths.join(", ")}.`,
    `Risks to monitor: ${risks.join(", ")}.`,
    `Next steps: ${nextSteps.length > 0 ? nextSteps.join("; ") : "confirm top recommendations and assign owners."}`,
  ].join("\n")
}
