import { expect, test } from "bun:test"
import { getSectionForPackage } from "../app/actions"

const cases: [string, string][] = [
  ["circuit-json", "Specifications"],
  ["@tscircuit/core", "Core"],
  ["@tscircuit/pcb-viewer", "UI Packages"],
  ["@tscircuit/eval", "Packaged Bundles"],
  ["unknown-package", "Downstream"],
]

for (const [pkg, section] of cases) {
  test(`section for ${pkg}`, () => {
    expect(getSectionForPackage(pkg, pkg)).toBe(section)
  })
}
