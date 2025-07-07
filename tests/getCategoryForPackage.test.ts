import { expect, test } from "bun:test"
import { getCategoryForPackage } from "../lib/categories"

test("returns mapped category", () => {
  expect(getCategoryForPackage("circuit-json", "circuit-json")).toBe("Specifications")
})

test("maps jscad-electronics to UI Packages", () => {
  expect(getCategoryForPackage("jscad-electronics", "jscad-electronics")).toBe(
    "UI Packages",
  )
})

test("maps parts-engine to Core Utility", () => {
  expect(
    getCategoryForPackage("@tscircuit/parts-engine", "parts-engine"),
  ).toBe("Core Utility")
})

test("maps tscircuit/checks to Core Utility", () => {
  expect(
    getCategoryForPackage("tscircuit/checks", "tscircuit/checks"),
  ).toBe("Core Utility")
})

test("maps @tscircuit/cli to Downstream", () => {
  expect(getCategoryForPackage("@tscircuit/cli", "cli")).toBe("Downstream")
})

test("maps tscircuit to Packaged Bundles", () => {
  expect(getCategoryForPackage("tscircuit", "tscircuit")).toBe("Packaged Bundles")
})

test("maps tscircuit/footprinter to Specifications", () => {
  expect(
    getCategoryForPackage("tscircuit/footprinter", "tscircuit/footprinter"),
  ).toBe("Specifications")
})

test("falls back to repo name", () => {
  expect(getCategoryForPackage("unknown", "@tscircuit/core")).toBe("Core")
})

test("defaults to Downstream", () => {
  expect(getCategoryForPackage("unknown", "unknown")).toBe("Downstream")
})
