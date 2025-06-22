import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Edge } from "reactflow"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getConnectedNodeIds(startId: string, edges: Edge[]): Set<string> {
  const visited = new Set<string>([startId])
  const queue = [startId]
  while (queue.length) {
    const id = queue.shift()!
    edges.forEach((e) => {
      if (e.source === id && !visited.has(e.target)) {
        visited.add(e.target)
        queue.push(e.target)
      }
      if (e.target === id && !visited.has(e.source)) {
        visited.add(e.source)
        queue.push(e.source)
      }
    })
  }
  return visited
}
