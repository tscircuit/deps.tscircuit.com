import { expect, test } from "bun:test"
import type { Edge } from "reactflow"
import { getConnectedNodeIds } from "../lib/utils"

test("finds all nodes connected through edges", () => {
  const edges: Edge[] = [
    { id: "e1-2", source: "1", target: "2" },
    { id: "e2-3", source: "2", target: "3" },
  ]
  const result = Array.from(getConnectedNodeIds("1", edges))
  expect(result.sort()).toEqual(["1", "2", "3"])
})

test("returns only connected component", () => {
  const edges: Edge[] = [
    { id: "e1-2", source: "1", target: "2" },
    { id: "e3-4", source: "3", target: "4" },
  ]
  const result = Array.from(getConnectedNodeIds("1", edges))
  expect(result.sort()).toEqual(["1", "2"])
})
