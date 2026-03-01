export type LayerId = "ENV" | "SEN" | "EXE" | "PRO" | "COM" | "COL" | "ENG" | "TOO" | "LDR" | "TAL"

export type DerivedId = "CUL" | "MGT"

export type Modality =
  | "agreement5"
  | "frequency5"
  | "intensity5"
  | "compare5"
  | "confSys5"
  | "LIKERT"
  | "barrierMulti"
  | "diagnosticComparative"
  | "confidenceInSystem"

export type OrgProfile = {
  sector: string
  sizeBand: string
  regulated: boolean
  workPattern: string
  deliveryModel: string
}

export type OptionId = string

export type Option = {
  id: OptionId
  label: string
  shortLabel?: string
  value?: number
  category?: string
}

export type Question = {
  id: string
  pass: 1 | 2 | 3
  layer: LayerId
  modality: Modality
  responseScaleKey: string
  prompt: string
  options: Option[]
  tags?: string[]
}

export type Answer = {
  questionId: string
  optionId: string | string[]
}

export type LayerScores = Record<LayerId, number>

export type DerivedScores = Record<DerivedId, number>

export type MetaScores = {
  confidence: number
  fragility: number
  honestyFactor: number
  contradictionIndex: number
  overall: number
}

export type EvidenceItem = {
  id: string
  layer: LayerId
  signal: string
  weight: number
}

export type RawSignal = {
  questionId: string
  layer: LayerId
  value: number
}

export type RawScoreComputation = {
  rawScores: LayerScores
  signals: RawSignal[]
}

export type RecommendationDef = {
  id: string
  title: string
  summary: string
  description?: string
  layers: LayerId[]
  derivedLayers?: DerivedId[]
  triggerRef?: string
  headlines?: string[]
  shortReason?: string
  actionSteps?: string[]
  cta?: string
  minScore?: number
  maxScore?: number
}

export type RecommendationInstance = {
  id: string
  title: string
  summary: string
  rationale: string
  priority: "high" | "medium" | "low"
}

export type RecommendationContext = {
  profile: OrgProfile
  effectiveScores: LayerScores
  derivedScores: DerivedScores
  meta: MetaScores
  evidence: EvidenceItem[]
}

export type OrgQuizResult = {
  profile: OrgProfile
  layerScores: LayerScores
  derivedScores: DerivedScores
  meta: MetaScores
  recommendations: RecommendationInstance[]
  narrative: string
  narrativeBlocks?: string[]
  evidence: EvidenceItem[]
}
