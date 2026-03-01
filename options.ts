import type { Option, Question } from "./orgTypes.ts"

export const AGREEMENT_5_V1: Option[] = [
  { id: "sd", label: "Strongly disagree", shortLabel: "Strongly disagree", value: 0 },
  { id: "d", label: "Disagree", shortLabel: "Disagree", value: 0.25 },
  { id: "n", label: "Neither", shortLabel: "Neither", value: 0.5 },
  { id: "a", label: "Agree", shortLabel: "Agree", value: 0.75 },
  { id: "sa", label: "Strongly agree", shortLabel: "Strongly agree", value: 1 },
]

export const FREQUENCY_5_V1: Option[] = [
  { id: "never", label: "Never", value: 0 },
  { id: "rare", label: "Rarely", value: 0.25 },
  { id: "some", label: "Sometimes", value: 0.5 },
  { id: "often", label: "Often", value: 0.75 },
  { id: "always", label: "Always", value: 1 },
]

export const INTENSITY_5_V1: Option[] = [
  { id: "veryLow", label: "Very low", value: 0 },
  { id: "low", label: "Low", value: 0.25 },
  { id: "moderate", label: "Moderate", value: 0.5 },
  { id: "high", label: "High", value: 0.75 },
  { id: "veryHigh", label: "Very high", value: 1 },
]

export const COMPARE_5_V1: Option[] = [
  { id: "farBelow", label: "Far below peers", value: 0 },
  { id: "below", label: "Below peers", value: 0.25 },
  { id: "at", label: "About the same", value: 0.5 },
  { id: "above", label: "Above peers", value: 0.75 },
  { id: "farAbove", label: "Far above peers", value: 1 },
]

export const CONF_SYS_5_V1: Option[] = [
  { id: "none", label: "No trust", value: 0 },
  { id: "low", label: "Low trust", value: 0.25 },
  { id: "some", label: "Moderate trust", value: 0.5 },
  { id: "good", label: "Good trust", value: 0.75 },
  { id: "high", label: "High trust", value: 1 },
]

export const BARRIER_MULTI_V1: Option[] = [
  { id: "capacity", label: "Capacity limits", category: "People" },
  { id: "skills", label: "Skills gap", category: "People" },
  { id: "budget", label: "Budget pressure", category: "Finance" },
  { id: "tools", label: "Tool mismatch", category: "Technology" },
  { id: "process", label: "Process friction", category: "Process" },
]

export const SCALAR_BY_OPTION: Record<string, number> = {
  ...Object.fromEntries(AGREEMENT_5_V1.map((o) => [o.id, o.value ?? 0])),
  ...Object.fromEntries(FREQUENCY_5_V1.map((o) => [o.id, o.value ?? 0])),
  ...Object.fromEntries(INTENSITY_5_V1.map((o) => [o.id, o.value ?? 0])),
  ...Object.fromEntries(COMPARE_5_V1.map((o) => [o.id, o.value ?? 0])),
  ...Object.fromEntries(CONF_SYS_5_V1.map((o) => [o.id, o.value ?? 0])),
}

const BARRIER_SEVERITY: Record<string, number> = {
  capacity: 0.95,
  skills: 0.85,
  budget: 0.7,
  tools: 0.65,
  process: 0.6,
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1)
}

export function mapSelectionToScalar(question: Question, optionId: string): number {
  const maybeIds = optionId.split("|").filter(Boolean)
  const isBarrier = question.modality === "barrierMulti"
  let scalar = 0.5
  if (isBarrier) {
    const ids = maybeIds.length > 0 ? maybeIds : [optionId]
    const severities = ids.map((id) => BARRIER_SEVERITY[id] ?? 0.4)
    const intensity = severities.reduce((a, b) => a + b, 0) / Math.max(1, BARRIER_MULTI_V1.length)
    scalar = clamp01(1 - intensity)
  } else {
    scalar = SCALAR_BY_OPTION[optionId] ?? 0.5
  }
  const reverseCoded = Boolean((question as Question & { reverseCoded?: boolean }).reverseCoded)
  return clamp01(reverseCoded ? 1 - scalar : scalar)
}
