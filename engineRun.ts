import { computeDerived } from "./engineDerived.ts"
import { buildEvidence, computeContradictions, computeFragility } from "./engineDiagnostics.ts"
import { buildNarrative } from "./engineNarrative.ts"
import { selectRecommendations } from "./engineRecommendations.ts"
import { computeMeta, computeRawScores } from "./engineScoring.ts"
import { applyDependencies, DEP_EDGES } from "./orgDependencies.ts"
import { BASE_LAYERS, PASS2_MAX, PASS3_MAX } from "./orgPolicy.ts"
import { selectPass2Questions, selectPass3Questions } from "./questionSelection.ts"
import { resolvePrompt } from "./questionVariants.ts"
import { PASS1_QUESTIONS } from "./questionsPass1.ts"
import { PASS2_QUESTIONS } from "./questionsPass2.ts"
import { PASS3_QUESTIONS } from "./questionsPass3.ts"
import type { Answer, LayerScores, OrgProfile, OrgQuizResult, Question } from "./orgTypes.ts"

function profileTags(profile: OrgProfile): string[] {
  const sectorMap: Record<string, string> = {
    "SaaS": "sector:TECH",
    "Creative": "sector:CREATIVE",
    "Marketing": "sector:CREATIVE",
    "Advertising": "sector:CREATIVE",
    "Media": "sector:CREATIVE",
    "Finance": "sector:FINANCE",
    "Public sector": "sector:PUBLIC",
  }
  const sizeMap: Record<string, string> = { "1-10": "sizeBand:SMALL", "11-50": "sizeBand:SMALL", "51-200": "sizeBand:MEDIUM", "201-1000": "sizeBand:LARGE", "1000+": "sizeBand:LARGE" }
  const workMap: Record<string, string> = { "Remote": "workPattern:REMOTE", "Hybrid": "workPattern:HYBRID", "Shift-based": "workPattern:SHIFT" }
  const deliveryMap: Record<string, string> = { "Client delivery": "deliveryModel:CLIENT", "Product": "deliveryModel:PRODUCT", "Mixed": "deliveryModel:PRODUCT" }
  return [
    sectorMap[profile.sector] ?? "sector:PUBLIC",
    sizeMap[profile.sizeBand] ?? "sizeBand:MEDIUM",
    workMap[profile.workPattern] ?? "workPattern:HYBRID",
    deliveryMap[profile.deliveryModel] ?? "deliveryModel:PRODUCT",
    `regulated:${profile.regulated ? "TRUE" : "FALSE"}`,
  ]
}

function withResolvedPrompts(questions: Question[], profile: OrgProfile): Question[] {
  return questions.map((q) => ({ ...q, prompt: resolvePrompt(q, profile) }))
}

export function runOrgQuiz(profile: OrgProfile, answers: Answer[], pass2Answers: Answer[], pass3Answers: Answer[]): OrgQuizResult {
  const p1 = withResolvedPrompts(PASS1_QUESTIONS, profile)
  const rawP1 = computeRawScores(p1, answers, profile)

  const selectedP2 = selectPass2Questions({
    seed: `${profile.sector}:${profile.sizeBand}`,
    priorityLayers: [...BASE_LAYERS],
    maxQuestions: PASS2_MAX,
    profileTags: profileTags(profile),
    layerScores: rawP1.rawScores,
  })
  const p2 = withResolvedPrompts(selectedP2.length > 0 ? selectedP2 : PASS2_QUESTIONS, profile)
  const rawP2 = computeRawScores(p2, pass2Answers, profile)

  const blendedRaw = Object.fromEntries(BASE_LAYERS.map((layer) => [layer, (rawP1.rawScores[layer] + rawP2.rawScores[layer]) / 2])) as LayerScores

  const selectedP3 = selectPass3Questions({
    seed: `${profile.deliveryModel}:${profile.workPattern}`,
    priorityLayers: [...BASE_LAYERS],
    maxQuestions: PASS3_MAX,
    layerScores: blendedRaw,
    confidence: 0.5,
    contradictionIndex: 0,
    fragility: 0,
  })
  const _p3 = withResolvedPrompts(selectedP3.length > 0 ? selectedP3 : PASS3_QUESTIONS, profile)

  const evidence = buildEvidence(pass3Answers)
  const effectiveScores = applyDependencies(blendedRaw, evidence)
  const derivedScores = computeDerived(effectiveScores, evidence)
  const contradictions = computeContradictions(effectiveScores)
  const fragility = computeFragility(effectiveScores, DEP_EDGES)
  const meta = computeMeta({ ...rawP1, rawScores: effectiveScores }, effectiveScores, answers, pass3Answers)
  meta.contradictionIndex = contradictions
  meta.fragility = fragility

  const context = { profile, effectiveScores, derivedScores, meta, evidence }
  const recommendations = selectRecommendations(context)
  const narrative = buildNarrative(context)

  return {
    profile,
    layerScores: effectiveScores,
    derivedScores,
    meta,
    recommendations,
    narrative,
    narrativeBlocks: narrative.split("\n"),
    evidence,
  }
}
