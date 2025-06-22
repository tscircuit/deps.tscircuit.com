import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Edge } from "reactflow"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the ids of nodes directly connected to `startId`.
 * The returned set always includes `startId` itself.
 */
export function getConnectedNodeIds(startId: string, edges: Edge[]): Set<string> {
  const connected = new Set<string>([startId])
  for (const e of edges) {
    if (e.source === startId) connected.add(e.target)
    if (e.target === startId) connected.add(e.source)
  }
  return connected
}
