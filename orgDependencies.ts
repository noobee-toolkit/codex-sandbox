import { DEPENDENCY_AMP_FACTOR, DEPENDENCY_MIX_FACTOR } from "./orgPolicy.ts"
import { clamp01 } from "./options.ts"
import type { EvidenceItem, LayerId, LayerScores } from "./orgTypes.ts"

export type DependencyEdge = {
  from: LayerId
  to: LayerId
  kind: "CAP" | "AMP" | "MIX"
  weight: number
}

export const DEP_EDGES: DependencyEdge[] = [
  { from: "ENV", to: "SEN", kind: "CAP", weight: 1 },
  { from: "SEN", to: "EXE", kind: "CAP", weight: 1 },
  { from: "SEN", to: "PRO", kind: "CAP", weight: 1 },
  { from: "SEN", to: "ENG", kind: "CAP", weight: 1 },
  { from: "LDR", to: "COM", kind: "AMP", weight: 1 },
  { from: "LDR", to: "COL", kind: "AMP", weight: 1 },
  { from: "LDR", to: "TAL", kind: "AMP", weight: 1 },
  { from: "COM", to: "COL", kind: "AMP", weight: 1 },
  { from: "TOO", to: "EXE", kind: "MIX", weight: 1 },
  { from: "TOO", to: "PRO", kind: "MIX", weight: 1 },
  { from: "TOO", to: "ENG", kind: "MIX", weight: 1 },
  { from: "TAL", to: "ENG", kind: "MIX", weight: 1 },
]

export function applyDependencies(scores: LayerScores, evidence: EvidenceItem[]): LayerScores {
  const out: LayerScores = { ...scores }
  for (const edge of DEP_EDGES) {
    const from = out[edge.from]
    const to = out[edge.to]
    if (from === undefined || to === undefined) {
      evidence.push({ id: `dep-skip-${edge.from}-${edge.to}`, layer: edge.to, signal: `Skipped dependency ${edge.from} to ${edge.to}`, weight: 0 })
      continue
    }
    if (edge.kind === "CAP") {
      out[edge.to] = Math.min(to, from)
    } else if (edge.kind === "AMP") {
      out[edge.to] = clamp01(to + (from - 0.5) * DEPENDENCY_AMP_FACTOR * edge.weight)
    } else {
      out[edge.to] = clamp01(to * (1 - DEPENDENCY_MIX_FACTOR * edge.weight) + from * (DEPENDENCY_MIX_FACTOR * edge.weight))
    }
  }
  return out
}
