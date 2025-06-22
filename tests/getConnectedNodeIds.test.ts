import { expect, test } from "bun:test"
import type { Edge } from "reactflow"
import { getConnectedNodeIds } from "../lib/utils"

test("includes direct neighbors only", () => {
  const edges: Edge[] = [
    { id: "e1-2", source: "1", target: "2" },
    { id: "e2-3", source: "2", target: "3" },
  ]
  const result = Array.from(getConnectedNodeIds("1", edges))
  expect(result.sort()).toEqual(["1", "2"])
})

test("includes neighbors from incoming edges", () => {
  const edges: Edge[] = [
    { id: "e3-1", source: "3", target: "1" },
    { id: "e2-4", source: "2", target: "4" },
  ]
  const result = Array.from(getConnectedNodeIds("1", edges))
  expect(result.sort()).toEqual(["1", "3"])
})
