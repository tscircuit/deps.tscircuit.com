import { expect, test } from "bun:test"
import { getCategoryForPackage } from "../lib/categories"

test("returns mapped category", () => {
  expect(getCategoryForPackage("circuit-json", "circuit-json")).toBe("Specifications")
})

test("falls back to repo name", () => {
  expect(getCategoryForPackage("unknown", "@tscircuit/core")).toBe("Core")
})

test("defaults to Downstream", () => {
  expect(getCategoryForPackage("unknown", "unknown")).toBe("Downstream")
})
