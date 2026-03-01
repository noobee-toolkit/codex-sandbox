import { BASE_LAYERS, OVERALL_META_BLEND } from "./orgPolicy.ts"
import { clamp01, mapSelectionToScalar } from "./options.ts"
import type { Answer, LayerScores, MetaScores, OrgProfile, Question, RawScoreComputation } from "./orgTypes.ts"

function mean(values: number[]): number {
  if (values.length === 0) return 0.5
  return values.reduce((a, b) => a + b, 0) / values.length
}

function dispersion(values: number[]): number {
  if (values.length <= 1) return 0
  const m = mean(values)
  const v = values.reduce((acc, value) => acc + (value - m) ** 2, 0) / values.length
  return Math.sqrt(v)
}

export function computeRawScores(questions: Question[], answers: Answer[], _profile: OrgProfile): RawScoreComputation {
  const answerById = new Map(answers.map((a) => [a.questionId, a.optionId]))
  const perLayer: Record<string, number[]> = {}
  const signals: RawScoreComputation["signals"] = []

  for (const q of questions) {
    const answer = answerById.get(q.id)
    if (answer === undefined) continue
    const scalar = Array.isArray(answer)
      ? mapSelectionToScalar(q, answer.join("|"))
      : mapSelectionToScalar(q, answer)
    if (!perLayer[q.layer]) perLayer[q.layer] = []
    perLayer[q.layer].push(scalar)
    signals.push({ questionId: q.id, layer: q.layer, value: scalar })
  }

  const rawScores = Object.fromEntries(
    BASE_LAYERS.map((layer) => {
      const values = perLayer[layer] ?? []
      const m = mean(values)
      const d = dispersion(values)
      const confidenceProxy = 1 / (1 + Math.exp(-5 * ((values.length / Math.max(4, values.length)) * (1 - d) - 0.5)))
      const score = clamp01(m * 0.85 + confidenceProxy * 0.15)
      return [layer, score]
    }),
  ) as LayerScores

  return { rawScores, signals }
}

export function computeMeta(raw: RawScoreComputation, effective: LayerScores, answers: Answer[], pass3Answers: Answer[]): MetaScores {
  const pass3ConfidenceSignals = pass3Answers
    .filter((a) => a.questionId.includes("_03"))
    .map((a) => (Array.isArray(a.optionId) ? 0.5 : clamp01(mapSelectionToScalar({ id: a.questionId, pass: 3, layer: "ENV", modality: "confidenceInSystem", responseScaleKey: "CONF_SYS_5_V1", prompt: "", options: [] }, a.optionId))))
  const honestyFactor = pass3ConfidenceSignals.length > 0 ? mean(pass3ConfidenceSignals) : 0.5

  const layerVals = BASE_LAYERS.map((l) => effective[l])
  const confidence = clamp01((raw.signals.length / Math.max(1, answers.length + pass3Answers.length)) * 0.6 + (1 - dispersion(layerVals)) * 0.4)

  const contradictionPairs: Array<[number, number]> = [
    [effective.LDR, effective.COM],
    [effective.SEN, effective.EXE],
    [effective.TOO, effective.PRO],
    [effective.TAL, effective.ENG],
  ]
  const contradictionIndex = clamp01(mean(contradictionPairs.map(([a, b]) => Math.abs(a - b))))

  const fragility = clamp01(mean(layerVals.map((v) => Math.max(0, 0.55 - v) * 1.8)))
  const overall = clamp01(mean(layerVals) * (1 - OVERALL_META_BLEND) + confidence * OVERALL_META_BLEND)

  return { confidence, fragility, honestyFactor, contradictionIndex, overall }
}
