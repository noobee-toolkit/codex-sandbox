export type BarDatum = { id: string; value: number; label: string }
export type BarLayoutRect = { id: string; x: number; y: number; width: number; height: number; label: string; value: number }
export type ScatterPoint = { id: string; x: number; y: number; label: string }
export type ScatterLayoutPoint = { id: string; cx: number; cy: number; label: string }

export type DependencyNode = { id: string; label: string }
export type DependencyEdgeInput = { from: string; to: string; weight: number }
export type DependencyLayout = {
  nodes: Array<{ id: string; x: number; y: number; label: string }>
  edges: Array<{ from: string; to: string; x1: number; y1: number; x2: number; y2: number; weight: number }>
}

export function barLayout(data: BarDatum[], dims: { width: number; height: number; padding?: number }): BarLayoutRect[] {
  const padding = dims.padding ?? 24
  const innerWidth = Math.max(1, dims.width - padding * 2)
  const innerHeight = Math.max(1, dims.height - padding * 2)
  const step = innerWidth / Math.max(data.length, 1)
  return data.map((d, i) => {
    const h = innerHeight * Math.max(0, Math.min(1, d.value))
    return { id: d.id, x: padding + i * step + step * 0.1, y: padding + (innerHeight - h), width: step * 0.8, height: h, label: d.label, value: d.value }
  })
}

export function scatterLayout(point: ScatterPoint, dims: { width: number; height: number; padding?: number }): ScatterLayoutPoint {
  const padding = dims.padding ?? 24
  const innerWidth = Math.max(1, dims.width - padding * 2)
  const innerHeight = Math.max(1, dims.height - padding * 2)
  return { id: point.id, cx: padding + point.x * innerWidth, cy: padding + (1 - point.y) * innerHeight, label: point.label }
}

export function dependencyLayout(nodes: DependencyNode[], edges: DependencyEdgeInput[], dims: { width: number; height: number; padding?: number }): DependencyLayout {
  const padding = dims.padding ?? 24
  const radius = Math.min(dims.width, dims.height) / 2 - padding
  const cx = dims.width / 2
  const cy = dims.height / 2
  const nodeMap = new Map<string, { id: string; x: number; y: number; label: string }>()
  nodes.forEach((node, i) => {
    const angle = (Math.PI * 2 * i) / Math.max(nodes.length, 1)
    nodeMap.set(node.id, { id: node.id, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius, label: node.label })
  })
  const edgeLayouts = edges.flatMap((edge) => {
    const from = nodeMap.get(edge.from)
    const to = nodeMap.get(edge.to)
    if (!from || !to) {
      return []
    }
    return [{ from: edge.from, to: edge.to, x1: from.x, y1: from.y, x2: to.x, y2: to.y, weight: edge.weight }]
  })
  return { nodes: Array.from(nodeMap.values()), edges: edgeLayouts }
}
