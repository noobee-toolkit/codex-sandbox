import { clamp01 } from "./options.ts"
import type { Answer, EvidenceItem, LayerScores } from "./orgTypes.ts"
import type { DependencyEdge } from "./orgDependencies.ts"

export function computeContradictions(effectiveScores: LayerScores): number {
  const pairs: Array<[number, number]> = [
    [effectiveScores.LDR, effectiveScores.COM],
    [effectiveScores.SEN, effectiveScores.EXE],
    [effectiveScores.PRO, effectiveScores.TOO],
    [effectiveScores.TAL, effectiveScores.ENG],
    [effectiveScores.ENV, effectiveScores.LDR],
  ]
  const delta = pairs.reduce((sum, [a, b]) => sum + Math.abs(a - b), 0) / pairs.length
  return clamp01(delta)
}

export function computeFragility(effectiveScores: LayerScores, edges: DependencyEdge[]): number {
  if (edges.length === 0) return 0
  const strain = edges.map((edge) => {
    const from = effectiveScores[edge.from]
    const to = effectiveScores[edge.to]
    const delta = Math.abs(from - to)
    return delta * edge.weight
  })
  return clamp01(strain.reduce((a, b) => a + b, 0) / strain.length)
}

export function buildEvidence(pass3Answers: Answer[]): EvidenceItem[] {
  return pass3Answers.map((answer) => {
    const layerToken = answer.questionId.split("_")[1] ?? "ENV"
    const layer = ["ENV", "SEN", "EXE", "PRO", "COM", "COL", "ENG", "TOO", "LDR", "TAL"].includes(layerToken) ? (layerToken as EvidenceItem["layer"]) : "ENV"
    const value = Array.isArray(answer.optionId) ? answer.optionId.length / 5 : 1
    return {
      id: `evidence-${answer.questionId}`,
      layer,
      signal: `Diagnostic response recorded for ${answer.questionId}`,
      weight: clamp01(value),
    }
  })
}
