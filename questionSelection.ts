import { BASE_LAYERS, CONFIDENCE_FLOOR_THRESHOLD, CONTRADICTION_TRIGGER_THRESHOLD, FRAGILITY_TRIGGER_THRESHOLD, PASS2_MAX, PASS3_MAX, PER_LAYER_PASS2_CAP, PER_LAYER_PASS3_CAP } from "./orgPolicy.ts"
import type { LayerId, Question } from "./orgTypes.ts"
import { PASS2_QUESTIONS } from "./questionsPass2.ts"
import { PASS3_QUESTIONS } from "./questionsPass3.ts"

export type SelectionContext = {
  seed: string
  priorityLayers: string[]
  maxQuestions: number
  profileTags?: string[]
  layerScores?: Partial<Record<LayerId, number>>
  contradictionIndex?: number
  fragility?: number
  confidence?: number
}

export function stableHash(s: string): number {
  let hash = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    hash ^= s.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function sortStable<T extends { id: string }>(items: T[], seed: string): T[] {
  return [...items].sort((a, b) => stableHash(`${seed}:${a.id}`) - stableHash(`${seed}:${b.id}`))
}

export function selectPass2Questions(ctx: SelectionContext): Question[] {
  const capTotal = Math.min(ctx.maxQuestions || PASS2_MAX, PASS2_MAX)
  const byLayer = new Map<LayerId, Question[]>()
  for (const layer of BASE_LAYERS) {
    byLayer.set(layer, [])
  }
  const profileTags = new Set(ctx.profileTags ?? [])
  const scored = PASS2_QUESTIONS.map((q) => {
    const tagScore = (q.tags ?? []).reduce((acc, tag) => acc + (profileTags.has(tag) ? 1 : 0), 0)
    const priorityScore = ctx.priorityLayers.includes(q.layer) ? 2 : 0
    const layerScore = ctx.layerScores?.[q.layer]
    const lowLayerBoost = layerScore !== undefined ? Math.max(0, 1 - layerScore) * 4 : 0
    return { q, rank: tagScore + priorityScore + lowLayerBoost }
  }).sort((a, b) => b.rank - a.rank || stableHash(`${ctx.seed}:${a.q.id}`) - stableHash(`${ctx.seed}:${b.q.id}`))

  const chosen: Question[] = []
  const layerCount: Record<string, number> = {}
  for (const item of scored) {
    if (chosen.length >= capTotal) break
    const count = layerCount[item.q.layer] ?? 0
    if (count >= PER_LAYER_PASS2_CAP) continue
    chosen.push(item.q)
    layerCount[item.q.layer] = count + 1
    byLayer.get(item.q.layer)?.push(item.q)
  }

  for (const layer of BASE_LAYERS) {
    if (chosen.length >= capTotal) break
    if ((layerCount[layer] ?? 0) > 0) continue
    const candidate = sortStable(PASS2_QUESTIONS.filter((q) => q.layer === layer), ctx.seed)[0]
    if (candidate) {
      chosen.push(candidate)
      layerCount[layer] = 1
    }
  }
  return chosen
}

export function selectPass3Questions(ctx: SelectionContext): Question[] {
  const capTotal = Math.min(ctx.maxQuestions || PASS3_MAX, PASS3_MAX)
  const shouldDeepDive = (ctx.fragility ?? 0) >= FRAGILITY_TRIGGER_THRESHOLD || (ctx.contradictionIndex ?? 0) >= CONTRADICTION_TRIGGER_THRESHOLD || (ctx.confidence ?? 1) <= CONFIDENCE_FLOOR_THRESHOLD
  if (!shouldDeepDive) {
    return sortStable(PASS3_QUESTIONS.filter((q) => ctx.priorityLayers.includes(q.layer)).slice(0, Math.min(6, capTotal)), ctx.seed)
  }
  const layerOrder = [...BASE_LAYERS].sort((a, b) => (ctx.layerScores?.[a] ?? 1) - (ctx.layerScores?.[b] ?? 1) || stableHash(`${ctx.seed}:${a}`) - stableHash(`${ctx.seed}:${b}`))
  const chosen: Question[] = []
  const layerCount: Record<string, number> = {}
  for (const layer of layerOrder) {
    const candidates = sortStable(PASS3_QUESTIONS.filter((q) => q.layer === layer), `${ctx.seed}:${layer}`)
    for (const candidate of candidates) {
      if (chosen.length >= capTotal) break
      const count = layerCount[layer] ?? 0
      if (count >= PER_LAYER_PASS3_CAP) break
      chosen.push(candidate)
      layerCount[layer] = count + 1
    }
  }
  return chosen
}
