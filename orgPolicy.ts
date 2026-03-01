import type { DerivedId, LayerId } from "./orgTypes.ts"

export const BASE_LAYERS: LayerId[] = ["ENV", "SEN", "EXE", "PRO", "COM", "COL", "ENG", "TOO", "LDR", "TAL"]

export const DERIVED_LAYERS: DerivedId[] = ["CUL", "MGT"]

export const PASS1_TARGET_PER_LAYER = 4
export const TARGET_TOTAL_PER_LAYER = 8

export const PASS2_MAX = 24
export const PASS3_MAX = 12
export const PER_LAYER_PASS2_CAP = 3
export const PER_LAYER_PASS3_CAP = 2

export const CONFIDENCE_FLOOR_THRESHOLD = 0.45
export const FRAGILITY_TRIGGER_THRESHOLD = 0.6
export const CONTRADICTION_TRIGGER_THRESHOLD = 0.55

export const PASS1_WEIGHT = 0.5
export const PASS2_WEIGHT = 0.3
export const PASS3_WEIGHT = 0.2

export const DEPENDENCY_CAP_FACTOR = 0.1
export const DEPENDENCY_AMP_FACTOR = 0.08
export const DEPENDENCY_MIX_FACTOR = 0.06

export const OVERALL_META_BLEND = 0.35
