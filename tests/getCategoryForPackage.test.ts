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

test("maps tscircuit to Packaged Bundles", () => {
  expect(getCategoryForPackage("tscircuit", "tscircuit")).toBe("Packaged Bundles")
})

test("falls back to repo name", () => {
  expect(getCategoryForPackage("unknown", "@tscircuit/core")).toBe("Core")
})

test("defaults to Downstream", () => {
  expect(getCategoryForPackage("unknown", "unknown")).toBe("Downstream")
})
