"use client"

import type { NodeProps } from "reactflow"

export interface SectionNodeData {
  label: string
}

export function SectionNode({ data }: NodeProps<SectionNodeData>) {
  return (
    <div className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 shadow text-sm font-semibold text-center">
      {data.label}
    </div>
  )
}
