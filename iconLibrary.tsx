import * as React from "react"
import type { DerivedId, LayerId } from "./orgTypes.ts"

export type PhosphorIconName =
  | "BuildingOffice"
  | "ShieldCheck"
  | "Lightning"
  | "ProjectorScreen"
  | "Chats"
  | "UsersThree"
  | "Pulse"
  | "Toolbox"
  | "Crown"
  | "GraduationCap"
  | "TreeStructure"
  | "Compass"
  | "Gear"
  | "ClipboardText"
  | "ChartLine"
  | "ChartBar"
  | "ChartPie"
  | "Target"
  | "Globe"
  | "Buildings"
  | "HandCoins"
  | "Handshake"
  | "Bug"
  | "Sparkle"
  | "Flask"
  | "Rocket"
  | "Clock"
  | "Gauge"
  | "ShieldWarning"
  | "Path"
  | "Link"
  | "Graph"
  | "Database"
  | "IdentificationCard"

export function PhosphorLikeIcon(props: {
  name: PhosphorIconName
  size: number
  colour: string
  strokeWidth?: number
}): JSX.Element {
  const { name, size, colour, strokeWidth = 1.75 } = props
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label={name} role="img">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4" fill="none" stroke={colour} strokeWidth={strokeWidth} />
      <path d="M6 15L10 11L13 14L18 9" stroke={colour} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <text x="12" y="20" textAnchor="middle" fontSize="4" fill={colour}>
        {name.slice(0, 3).toUpperCase()}
      </text>
    </svg>
  )
}

export function mapLayerIcon(layer: LayerId): PhosphorIconName {
  const map: Record<LayerId, PhosphorIconName> = {
    ENV: "Globe",
    SEN: "Pulse",
    EXE: "Lightning",
    PRO: "ProjectorScreen",
    COM: "Chats",
    COL: "UsersThree",
    ENG: "Gauge",
    TOO: "Toolbox",
    LDR: "Crown",
    TAL: "GraduationCap",
  }
  return map[layer]
}

export function mapDerivedIcon(derived: DerivedId): PhosphorIconName {
  return derived === "CUL" ? "TreeStructure" : "Compass"
}
