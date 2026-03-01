import type { OrgProfile, Question } from "./orgTypes.ts"

export type QuestionVariant = {
  questionId: string
  when: Partial<OrgProfile>
  prompt: string
}

export const QUESTION_VARIANTS: QuestionVariant[] = [
  { questionId: "P1_ENV_01", when: { sector: "Public sector" }, prompt: "Planning cycles account for policy, funding and public demand shifts." },
  { questionId: "P1_ENV_01", when: { sector: "Finance" }, prompt: "Planning cycles account for market, policy and compliance shifts." },
  { questionId: "P1_SEN_02", when: { workPattern: "Remote" }, prompt: "Customer and stakeholder feedback is reviewed in remote first routines." },
  { questionId: "P1_EXE_02", when: { deliveryModel: "Client delivery" }, prompt: "Client commitments are completed when planned without avoidable rework." },
  { questionId: "P1_EXE_02", when: { deliveryModel: "Product" }, prompt: "Product commitments are completed when planned without avoidable rework." },
  { questionId: "P1_PRO_01", when: { sizeBand: "1-10" }, prompt: "Key processes are clear enough for each person to follow consistently." },
  { questionId: "P1_PRO_01", when: { sizeBand: "1000+" }, prompt: "Key processes are clear enough for distributed teams to follow consistently." },
  { questionId: "P1_COM_02", when: { workPattern: "Shift-based" }, prompt: "Handover updates arrive in time for safe and effective planning decisions." },
  { questionId: "P1_COL_02", when: { workPattern: "Hybrid" }, prompt: "Shared dependencies are discussed across on site and remote teams before blockers form." },
  { questionId: "P1_ENG_02", when: { sector: "Healthcare" }, prompt: "Managers check in on workload and wellbeing in a way that supports safe care." },
  { questionId: "P1_TOO_01", when: { sector: "Education" }, prompt: "Core tools support learning and operations with minimal avoidable friction." },
  { questionId: "P1_TAL_01", when: { regulated: true }, prompt: "Hiring and development plans match capability needs and compliance obligations." },
  { questionId: "P2_ENV_01", when: { sector: "Manufacturing" }, prompt: "Current routines support stable external context awareness across sites and suppliers." },
  { questionId: "P2_COM_03", when: { sector: "Creative" }, prompt: "Which barriers currently reduce communication clarity between creative and production teams?" },
]

export function resolvePrompt(question: Question, profile: OrgProfile): string {
  const candidates = QUESTION_VARIANTS.filter((variant) => variant.questionId === question.id)
  if (candidates.length === 0) {
    return question.prompt
  }
  let best = question.prompt
  let bestScore = -1
  for (const variant of candidates) {
    const keys = Object.keys(variant.when) as Array<keyof OrgProfile>
    const matched = keys.every((key) => profile[key] === variant.when[key])
    if (!matched) {
      continue
    }
    if (keys.length > bestScore) {
      bestScore = keys.length
      best = variant.prompt
    }
  }
  return best
}
