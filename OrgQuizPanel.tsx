import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { barLayout, dependencyLayout, scatterLayout } from "./d3Layouts.ts"
import { mapDerivedIcon, mapLayerIcon, PhosphorLikeIcon, type PhosphorIconName } from "./iconLibrary.tsx"
import { runOrgQuiz } from "./engineRun.ts"
import { PASS1_QUESTIONS } from "./questionsPass1.ts"
import { PASS2_QUESTIONS } from "./questionsPass2.ts"
import { PASS3_QUESTIONS } from "./questionsPass3.ts"
import { BASE_LAYERS } from "./orgPolicy.ts"
import { BREAKPOINTS, FONT_FAMILIES, FONT_SIZES, LINE_HEIGHTS, RADII, SHADOWS, SPACING, THEMES, type OrgThemeId } from "./themeTokens.ts"
import type { Answer, OrgProfile, OrgQuizResult, Question } from "./orgTypes.ts"

type IconSource = "PHOSPHOR" | "CANVAS"
type CtaMode = "generated" | "slot"

export type OrgQuizPanelProps = {
  themeId: OrgThemeId
  advancedMode: boolean
  autoScale: boolean
  masterScale: number
  desktopScale: number
  tabletScale: number
  mobileScale: number
  panelPadding: number
  showNumericLabels: boolean
  iconSource: IconSource
  defaultPhosphorIcon: PhosphorIconName
  canvasOverviewIconKey: string
  canvasResultsIconKey: string
  useCanvasBookCall: boolean
  useCanvasDownload: boolean
  useCanvasEmail: boolean
  bookCallLabel: string
  downloadLabel: string
  emailLabel: string
  accentOverride: string
  backgroundOverride: string
  surfaceOverride: string
  borderOverride: string
  iconColour: string
  fontMode: "sans" | "mono"
  fontOverride: string
  recommendationsIcon: PhosphorIconName
  exportIcon: PhosphorIconName
  ctaIcon: PhosphorIconName
  iconStrokeWidth: number
  chartPadding: number
  chartGap: number
  bookCallSlot?: React.ReactNode
  downloadSlot?: React.ReactNode
  emailSlot?: React.ReactNode
  canvasIconOverview?: React.ReactNode
  canvasIconResults?: React.ReactNode
}

const sectorOptions = ["Creative", "Marketing", "Advertising", "Media", "SaaS", "Finance", "Public sector", "Healthcare", "Education", "Retail", "Manufacturing"]
const sizeBandOptions = ["1-10", "11-50", "51-200", "201-1000", "1000+"]
const workPatternOptions = ["Office-based", "Hybrid", "Remote", "Shift-based"]
const deliveryModelOptions = ["Client delivery", "Product", "Mixed"]

const profileDefaults: OrgProfile = { sector: "SaaS", sizeBand: "51-200", regulated: false, workPattern: "Hybrid", deliveryModel: "Product" }

function toAnswers(source: Record<string, string | string[]>): Answer[] {
  return Object.entries(source).map(([questionId, optionId]) => ({ questionId, optionId }))
}

function scaleForWidth(width: number, props: OrgQuizPanelProps): number {
  if (!props.autoScale) {
    if (width >= BREAKPOINTS[2]) return props.desktopScale
    if (width >= BREAKPOINTS[1]) return props.tabletScale
    return props.mobileScale
  }
  const min = BREAKPOINTS[0]
  const max = BREAKPOINTS[4]
  const t = Math.max(0, Math.min(1, (width - min) / Math.max(1, max - min)))
  return props.masterScale * (0.9 + t * 0.2)
}

function answerValue(answer: string | string[] | undefined, id: string): boolean {
  if (answer === undefined) return false
  return Array.isArray(answer) ? answer.includes(id) : answer === id
}

function QuestionRow(props: {
  question: Question
  answer: string | string[] | undefined
  onAnswer: (value: string | string[]) => void
  showNumericLabels: boolean
  colours: Record<string, string>
}): JSX.Element {
  const { question, answer, onAnswer, showNumericLabels, colours } = props
  if (question.modality === "barrierMulti") {
    const selected = Array.isArray(answer) ? answer : []
    const groups = question.options.reduce<Record<string, typeof question.options>>((acc, option) => {
      const key = option.category ?? "Other"
      if (!acc[key]) acc[key] = []
      acc[key].push(option)
      return acc
    }, {})
    return (
      <div style={{ display: "grid", gap: SPACING.xs }}>
        {Object.entries(groups).map(([category, options]) => (
          <div key={category}>
            <div style={{ fontSize: FONT_SIZES.xs, color: colours.textMuted, marginBottom: SPACING.xxs }}>{category}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: SPACING.xs }}>
              {options.map((opt) => {
                const active = selected.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    onClick={() => onAnswer(active ? selected.filter((id) => id !== opt.id) : [...selected, opt.id])}
                    style={{ borderRadius: RADII.pill, border: `1px solid ${active ? colours.accent : colours.border}`, background: active ? colours.surface2 : "transparent", color: colours.text, padding: `${SPACING.xxs}px ${SPACING.sm}px`, cursor: "pointer" }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: SPACING.xs }}>
      {question.options.map((opt, index) => {
        const active = answerValue(answer, opt.id)
        return (
          <button
            key={opt.id}
            onClick={() => onAnswer(opt.id)}
            style={{ borderRadius: RADII.pill, border: `1px solid ${active ? colours.accent : colours.border}`, background: active ? colours.surface2 : "transparent", color: colours.text, padding: `${SPACING.xs}px ${SPACING.xxs}px`, cursor: "pointer" }}
          >
            <div>{opt.shortLabel ?? opt.label}</div>
            {showNumericLabels ? <div style={{ fontSize: FONT_SIZES.xs, opacity: 0.7 }}>{index + 1}</div> : null}
          </button>
        )
      })}
    </div>
  )
}

function iconRender(source: IconSource, slot: React.ReactNode | undefined, name: PhosphorIconName, colour: string, strokeWidth: number): JSX.Element {
  if (source === "CANVAS" && slot) return <>{slot}</>
  return <PhosphorLikeIcon name={name} size={18} colour={colour} strokeWidth={strokeWidth} />
}

export function OrgQuizPanel(props: OrgQuizPanelProps): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = React.useState(1024)
  const scale = scaleForWidth(width, props)

  React.useEffect(() => {
    const node = containerRef.current
    if (!node || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const theme = THEMES[props.themeId]
  const colours = {
    ...theme.colours,
    background: props.backgroundOverride || theme.colours.background,
    surface: props.surfaceOverride || theme.colours.surface,
    border: props.borderOverride || theme.colours.border,
    accent: props.accentOverride || theme.colours.accent,
  }

  const [profile, setProfile] = React.useState<OrgProfile>(profileDefaults)
  const [pass1, setPass1] = React.useState<Record<string, string | string[]>>({})
  const [pass2, setPass2] = React.useState<Record<string, string | string[]>>({})
  const [pass3, setPass3] = React.useState<Record<string, string | string[]>>({})
  const result = React.useMemo<OrgQuizResult>(() => runOrgQuiz(profile, toAnswers(pass1), toAnswers(pass2), toAnswers(pass3)), [profile, pass1, pass2, pass3])

  const coverage = (questions: Question[], state: Record<string, string | string[]>) => Math.round((Object.keys(state).length / Math.max(1, questions.length)) * 100)
  const coverageByLayer = BASE_LAYERS.map((layer) => {
    const total = PASS1_QUESTIONS.filter((q) => q.layer === layer).length
    const done = PASS1_QUESTIONS.filter((q) => q.layer === layer && pass1[q.id] !== undefined).length
    return { layer, total, done }
  })

  const barRects = barLayout(BASE_LAYERS.map((layer) => ({ id: layer, label: layer, value: result.layerScores[layer] })), { width: 520, height: 240, padding: props.chartPadding })
  const scatter = scatterLayout({ id: "meta", x: result.meta.confidence, y: result.meta.overall, label: "Meta" }, { width: 520, height: 240, padding: props.chartPadding })
  const dep = dependencyLayout(BASE_LAYERS.map((layer) => ({ id: layer, label: layer })), [
    { from: "ENV", to: "SEN", weight: 1 },
    { from: "LDR", to: "COM", weight: 1 },
    { from: "TOO", to: "EXE", weight: 1 },
  ], { width: 520, height: 320, padding: props.chartPadding })

  const fontFamily = props.fontOverride || (props.fontMode === "mono" ? FONT_FAMILIES.mono : FONT_FAMILIES.body)
  const sectionStyle: React.CSSProperties = { background: colours.surface, border: `1px solid ${colours.border}`, borderRadius: RADII.lg, padding: props.panelPadding * scale, boxShadow: SHADOWS.sm, display: "grid", gap: SPACING.sm * scale }
  const graphGridCols = width > 900 ? "1fr 1fr" : "1fr"

  const renderQuestionBlock = (title: string, sub: string, items: Question[], state: Record<string, string | string[]>, setter: React.Dispatch<React.SetStateAction<Record<string, string | string[]>>>) => (
    <section style={sectionStyle}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p style={{ margin: 0, color: colours.textMuted }}>{sub}</p>
      {items.map((q) => (
        <article key={q.id} style={{ borderBottom: `1px solid ${colours.border}`, paddingBottom: SPACING.sm, marginBottom: SPACING.xs }}>
          <div style={{ marginBottom: SPACING.xs, color: colours.text }}>{q.prompt}</div>
          <QuestionRow question={q} answer={state[q.id]} onAnswer={(value) => setter((prev) => ({ ...prev, [q.id]: value }))} showNumericLabels={props.showNumericLabels} colours={colours} />
        </article>
      ))}
    </section>
  )

  const renderCta = (mode: CtaMode, slot: React.ReactNode | undefined, label: string) => {
    if (mode === "slot" && slot) return slot
    return <button style={{ display: "flex", gap: SPACING.xs, alignItems: "center", borderRadius: RADII.md, border: "none", background: colours.accent, color: "white", padding: `${SPACING.xs}px ${SPACING.md}px`, cursor: "pointer" }}><PhosphorLikeIcon name={props.ctaIcon} size={14} colour="white" strokeWidth={props.iconStrokeWidth} />{label}</button>
  }

  return (
    <div ref={containerRef} style={{ background: colours.background, color: colours.text, fontFamily, fontSize: theme.baseFontSize * scale, lineHeight: LINE_HEIGHTS.normal, padding: SPACING.md * scale, display: "grid", gap: SPACING.md * scale }}>
      <section style={sectionStyle}>
        <h2 style={{ margin: 0 }}>Noobee organisation capability quiz</h2>
        <p style={{ margin: 0, color: colours.textMuted }}>Build a clear capability baseline, explore contextual depth, then review diagnostics and recommendations in one flow.</p>
        <div style={{ display: "grid", gridTemplateColumns: width > 900 ? "repeat(5,minmax(0,1fr))" : "1fr", gap: SPACING.xs }}>
          <label>Sector<select value={profile.sector} onChange={(e) => setProfile({ ...profile, sector: e.target.value })}>{sectorOptions.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
          <label>Size band<select value={profile.sizeBand} onChange={(e) => setProfile({ ...profile, sizeBand: e.target.value })}>{sizeBandOptions.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
          <label>Work pattern<select value={profile.workPattern} onChange={(e) => setProfile({ ...profile, workPattern: e.target.value })}>{workPatternOptions.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
          <label>Delivery model<select value={profile.deliveryModel} onChange={(e) => setProfile({ ...profile, deliveryModel: e.target.value })}>{deliveryModelOptions.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
          <label style={{ display: "flex", alignItems: "center", gap: SPACING.xs }}><input type="checkbox" checked={profile.regulated} onChange={(e) => setProfile({ ...profile, regulated: e.target.checked })} />Regulated environment</label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: width > 900 ? "repeat(3,minmax(0,1fr))" : "1fr", gap: SPACING.xs }}>
          <div>Pass 1 coverage: {coverage(PASS1_QUESTIONS, pass1)}%</div>
          <div>Pass 2 coverage: {coverage(PASS2_QUESTIONS, pass2)}%</div>
          <div>Pass 3 coverage: {coverage(PASS3_QUESTIONS, pass3)}%</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: SPACING.xs }}>
          {coverageByLayer.map((item) => <div key={item.layer} style={{ background: colours.surface2, borderRadius: RADII.sm, padding: SPACING.xs }}><strong>{item.layer}</strong><div style={{ color: colours.textMuted }}>{item.done}/{item.total}</div></div>)}
        </div>
      </section>

      {renderQuestionBlock("Pass 1 baseline signals", "Complete all baseline prompts for an even view across layers.", PASS1_QUESTIONS, pass1, setPass1)}
      {renderQuestionBlock("Pass 2 contextual depth", "Dynamic prompts sharpen understanding by profile and operating context.", PASS2_QUESTIONS, pass2, setPass2)}
      {renderQuestionBlock("Pass 3 diagnostics", "Diagnostic prompts highlight barriers, confidence and consistency risk.", PASS3_QUESTIONS, pass3, setPass3)}

      <section style={sectionStyle}>
        <h3 style={{ margin: 0 }}>Results</h3>
        <div style={{ display: "grid", gridTemplateColumns: width > 900 ? "repeat(4,minmax(0,1fr))" : "1fr 1fr", gap: SPACING.xs }}>
          {[{ k: "Overall", v: result.meta.overall }, { k: "Confidence", v: result.meta.confidence }, { k: "Fragility", v: result.meta.fragility }, { k: "Contradictions", v: result.meta.contradictionIndex }].map((m) => <div key={m.k} style={{ background: colours.surface2, borderRadius: RADII.md, padding: SPACING.sm }}><div style={{ color: colours.textMuted }}>{m.k}</div><strong>{Math.round(m.v * 100)}%</strong></div>)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: width > 900 ? "1fr 1fr" : "1fr", gap: SPACING.xs }}>
          <div style={{ background: colours.surface2, borderRadius: RADII.md, padding: SPACING.sm }}>
            <div style={{ display: "flex", gap: SPACING.xs, alignItems: "center" }}>{iconRender(props.iconSource, props.canvasIconOverview, props.defaultPhosphorIcon, props.iconColour || colours.accent, props.iconStrokeWidth)}<strong>Derived tiles</strong></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SPACING.xs, marginTop: SPACING.xs }}>
              <div style={{ border: `1px solid ${colours.border}`, borderRadius: RADII.sm, padding: SPACING.xs }}>{mapDerivedIcon("CUL")} {Math.round(result.derivedScores.CUL * 100)}%</div>
              <div style={{ border: `1px solid ${colours.border}`, borderRadius: RADII.sm, padding: SPACING.xs }}>{mapDerivedIcon("MGT")} {Math.round(result.derivedScores.MGT * 100)}%</div>
            </div>
          </div>
          <div style={{ background: colours.surface2, borderRadius: RADII.md, padding: SPACING.sm }}>
            <div style={{ display: "flex", gap: SPACING.xs, alignItems: "center" }}><PhosphorLikeIcon name={props.recommendationsIcon} size={16} colour={props.iconColour || colours.accent2} strokeWidth={props.iconStrokeWidth} /><strong>Recommendations</strong></div>
            {result.recommendations.map((r) => <div key={r.id} style={{ marginTop: SPACING.xs, padding: SPACING.xs, border: `1px solid ${colours.border}`, borderRadius: RADII.sm }}><div>{r.title}</div><div style={{ color: colours.textMuted }}>{r.rationale}</div></div>)}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: graphGridCols, gap: props.chartGap * scale }}>
          <svg viewBox="0 0 520 260" style={{ width: "100%", height: 260, background: colours.surface2, borderRadius: RADII.md }}>
            <line x1="30" y1="220" x2="500" y2="220" stroke={colours.borderStrong} />
            {[0, 0.25, 0.5, 0.75, 1].map((t) => <g key={t}><line x1="30" y1={220 - t * 170} x2="500" y2={220 - t * 170} stroke={colours.border} strokeDasharray="3 3" /><text x="8" y={224 - t * 170} fontSize="10" fill={colours.textMuted}>{Math.round(t * 100)}</text></g>)}
            {barRects.map((bar) => <g key={bar.id}><rect x={bar.x} y={bar.y} width={bar.width} height={bar.height} fill={colours.accent}><title>{`${bar.label} harmony ${Math.round(bar.value * 100)} percent`}</title></rect><text x={bar.x + bar.width / 2} y="236" textAnchor="middle" fontSize="10" fill={colours.textMuted}>{bar.label}</text></g>)}
            <text x="32" y="20" fontSize="12" fill={colours.text}>Harmony bars</text>
          </svg>

          <svg viewBox="0 0 520 260" style={{ width: "100%", height: 260, background: colours.surface2, borderRadius: RADII.md }}>
            <line x1="30" y1="220" x2="500" y2="220" stroke={colours.borderStrong} />
            <line x1="30" y1="30" x2="30" y2="220" stroke={colours.borderStrong} />
            <line x1="265" y1="30" x2="265" y2="220" stroke={colours.border} strokeDasharray="4 4" />
            <line x1="30" y1="125" x2="500" y2="125" stroke={colours.border} strokeDasharray="4 4" />
            <circle cx={scatter.cx} cy={scatter.cy} r="7" fill={colours.accent2}><title>Confidence on x axis and overall score on y axis</title></circle>
            <text x="32" y="20" fontSize="12" fill={colours.text}>Confidence versus overall</text>
            <text x="455" y="245" fontSize="10" fill={colours.textMuted}>Confidence</text>
            <text x="6" y="40" fontSize="10" fill={colours.textMuted}>Overall</text>
          </svg>

          <svg viewBox="0 0 520 320" style={{ width: "100%", height: 320, background: colours.surface2, borderRadius: RADII.md, gridColumn: graphGridCols === "1fr" ? "auto" : "1 / span 2" }}>
            {dep.edges.map((e, index) => <line key={`${e.from}-${e.to}-${index}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={index % 3 === 0 ? colours.accent : index % 3 === 1 ? colours.accent2 : colours.borderStrong} strokeDasharray={index % 3 === 0 ? "1 0" : index % 3 === 1 ? "5 3" : "2 3"}><title>{`Dependency edge ${e.from} to ${e.to}`}</title></line>)}
            {dep.nodes.map((node) => <g key={node.id}><rect x={node.x - 18} y={node.y - 11} width="36" height="22" rx="11" fill={colours.surface} stroke={colours.borderStrong} /><text x={node.x} y={node.y + 4} textAnchor="middle" fontSize="10" fill={colours.text}>{node.label}</text></g>)}
            <rect x="356" y="16" width="148" height="62" rx="8" fill={colours.surface} stroke={colours.border} />
            <text x="368" y="34" fontSize="10" fill={colours.textMuted}>Legend</text>
            <text x="368" y="48" fontSize="10" fill={colours.textMuted}>Solid CAP</text>
            <text x="368" y="61" fontSize="10" fill={colours.textMuted}>Dashed AMP and dotted MIX</text>
          </svg>
        </div>

        <div style={{ background: colours.surface2, borderRadius: RADII.md, padding: SPACING.sm }}>
          <h4 style={{ marginTop: 0 }}>Narrative</h4>
          {result.narrative.split("\n").map((line) => <p key={line} style={{ margin: `${SPACING.xxs}px 0`, color: colours.textMuted }}>{line}</p>)}
        </div>
      </section>

      <section style={sectionStyle}>
        <h3 style={{ margin: 0 }}>Services and exports</h3>
        <div style={{ display: "flex", gap: SPACING.sm, flexWrap: "wrap" }}>
          {renderCta(props.useCanvasBookCall ? "slot" : "generated", props.bookCallSlot, props.bookCallLabel)}
          {renderCta(props.useCanvasDownload ? "slot" : "generated", props.downloadSlot, props.downloadLabel)}
          {renderCta(props.useCanvasEmail ? "slot" : "generated", props.emailSlot, props.emailLabel)}
          <button style={{ border: `1px solid ${colours.border}`, borderRadius: RADII.md, background: "transparent", color: colours.text, padding: `${SPACING.xs}px ${SPACING.md}px`, display: "flex", alignItems: "center", gap: SPACING.xs }}><PhosphorLikeIcon name={props.exportIcon} size={14} colour={props.iconColour || colours.text} strokeWidth={props.iconStrokeWidth} />Export summary</button>
        </div>
      </section>
    </div>
  )
}

OrgQuizPanel.defaultProps = {
  themeId: "default",
  advancedMode: false,
  autoScale: true,
  masterScale: 1,
  desktopScale: 1,
  tabletScale: 0.95,
  mobileScale: 0.9,
  panelPadding: 16,
  showNumericLabels: false,
  iconSource: "PHOSPHOR",
  defaultPhosphorIcon: "ChartBar",
  canvasOverviewIconKey: "overview",
  canvasResultsIconKey: "results",
  useCanvasBookCall: false,
  useCanvasDownload: false,
  useCanvasEmail: false,
  bookCallLabel: "Book a call",
  downloadLabel: "Download report",
  emailLabel: "Email results",
  accentOverride: "",
  backgroundOverride: "",
  surfaceOverride: "",
  borderOverride: "",
  iconColour: "",
  fontMode: "sans",
  fontOverride: "",
  recommendationsIcon: "Target",
  exportIcon: "ClipboardText",
  ctaIcon: "Handshake",
  iconStrokeWidth: 1.75,
  chartPadding: 26,
  chartGap: 12,
}

addPropertyControls(OrgQuizPanel, {
  themeId: { type: ControlType.Enum, title: "Theme.Theme", options: ["default", "highContrast", "calmWarm"] },
  backgroundOverride: { type: ControlType.Color, title: "Theme.Background", hidden: (p) => !p.advancedMode },
  surfaceOverride: { type: ControlType.Color, title: "Theme.Surface", hidden: (p) => !p.advancedMode },
  borderOverride: { type: ControlType.Color, title: "Theme.Border", hidden: (p) => !p.advancedMode },
  accentOverride: { type: ControlType.Color, title: "Theme.Accent", hidden: (p) => !p.advancedMode },

  fontMode: { type: ControlType.Enum, title: "Typography.Font", options: ["sans", "mono"] },
  fontOverride: { type: ControlType.String, title: "Typography.Override", hidden: (p) => !p.advancedMode },
  showNumericLabels: { type: ControlType.Boolean, title: "Typography.Numeric" },

  panelPadding: { type: ControlType.Number, title: "Spacing.Panel", min: 8, max: 32, step: 1 },
  chartPadding: { type: ControlType.Number, title: "Charts.Padding", min: 12, max: 40, step: 1, hidden: (p) => !p.advancedMode },
  chartGap: { type: ControlType.Number, title: "Charts.Gap", min: 4, max: 24, step: 1, hidden: (p) => !p.advancedMode },

  iconSource: { type: ControlType.Enum, title: "Icons.Source", options: ["PHOSPHOR", "CANVAS"] },
  defaultPhosphorIcon: { type: ControlType.Enum, title: "Icons.Overview", options: ["ChartBar", "Gauge", "Compass", "Crown", "Globe", "UsersThree", "Toolbox", "ShieldCheck"] as PhosphorIconName[], hidden: (p) => p.iconSource !== "PHOSPHOR" },
  recommendationsIcon: { type: ControlType.Enum, title: "Icons.Recommend", options: ["Target", "ChartLine", "Sparkle", "Compass", "Path"] as PhosphorIconName[] },
  exportIcon: { type: ControlType.Enum, title: "Icons.Export", options: ["ClipboardText", "ChartPie", "Database", "IdentificationCard"] as PhosphorIconName[] },
  ctaIcon: { type: ControlType.Enum, title: "Icons.CTA", options: ["Handshake", "HandCoins", "Rocket", "Link"] as PhosphorIconName[] },
  iconColour: { type: ControlType.Color, title: "Icons.Colour", hidden: (p) => p.iconSource !== "PHOSPHOR" },
  iconStrokeWidth: { type: ControlType.Number, title: "Icons.Stroke", min: 1, max: 3, step: 0.1, hidden: (p) => !p.advancedMode || p.iconSource !== "PHOSPHOR" },
  canvasOverviewIconKey: { type: ControlType.Enum, title: "Icons.CanvasOver", options: ["overview", "results", "recommend", "export"], hidden: (p) => p.iconSource !== "CANVAS" },
  canvasResultsIconKey: { type: ControlType.Enum, title: "Icons.CanvasRes", options: ["overview", "results", "recommend", "export"], hidden: (p) => p.iconSource !== "CANVAS" },

  useCanvasBookCall: { type: ControlType.Boolean, title: "CTAs.BookSlot" },
  useCanvasDownload: { type: ControlType.Boolean, title: "CTAs.DownloadSlot" },
  useCanvasEmail: { type: ControlType.Boolean, title: "CTAs.EmailSlot" },
  bookCallLabel: { type: ControlType.String, title: "CTAs.BookLabel", hidden: (p) => p.useCanvasBookCall },
  downloadLabel: { type: ControlType.String, title: "CTAs.DownloadLabel", hidden: (p) => p.useCanvasDownload },
  emailLabel: { type: ControlType.String, title: "CTAs.EmailLabel", hidden: (p) => p.useCanvasEmail },

  advancedMode: { type: ControlType.Boolean, title: "Advanced.Mode" },
  autoScale: { type: ControlType.Boolean, title: "Advanced.AutoScale" },
  masterScale: { type: ControlType.Number, title: "Advanced.Master", min: 0.7, max: 1.5, step: 0.01 },
  desktopScale: { type: ControlType.Number, title: "Advanced.Desktop", min: 0.7, max: 1.5, step: 0.01, hidden: (p) => p.autoScale && !p.advancedMode },
  tabletScale: { type: ControlType.Number, title: "Advanced.Tablet", min: 0.7, max: 1.5, step: 0.01, hidden: (p) => p.autoScale && !p.advancedMode },
  mobileScale: { type: ControlType.Number, title: "Advanced.Mobile", min: 0.7, max: 1.5, step: 0.01, hidden: (p) => p.autoScale && !p.advancedMode },
})

export default OrgQuizPanel
