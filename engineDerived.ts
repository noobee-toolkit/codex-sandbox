import { clamp01 } from "./options.ts"
import type { DerivedScores, EvidenceItem, LayerScores } from "./orgTypes.ts"

export function computeDerived(effectiveScores: LayerScores, evidence: EvidenceItem[]): DerivedScores {
  const culInputs = [effectiveScores.COM, effectiveScores.COL, effectiveScores.ENG, effectiveScores.LDR]
  const mgtInputs = [effectiveScores.ENV, effectiveScores.SEN, effectiveScores.EXE, effectiveScores.PRO, effectiveScores.TOO, effectiveScores.TAL]
  if (culInputs.some((v) => Number.isNaN(v)) || mgtInputs.some((v) => Number.isNaN(v))) {
    evidence.push({ id: "derived-missing", layer: "LDR", signal: "Some derived inputs were missing and defaulted.", weight: 0.1 })
  }
  const CUL = clamp01(culInputs.reduce((a, b) => a + (b || 0.5), 0) / culInputs.length)
  const MGT = clamp01(mgtInputs.reduce((a, b) => a + (b || 0.5), 0) / mgtInputs.length)
  return { CUL, MGT }
}
