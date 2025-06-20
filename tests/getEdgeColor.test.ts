import { expect, test } from "bun:test";
import { getEdgeColor } from "../lib/getEdgeColor";

test("returns blue when versions match", () => {
  expect(getEdgeColor("1.0.0", "1.0.0")).toBe("#3b82f6");
});

test("returns gray when within 2 patch versions", () => {
  expect(getEdgeColor("1.0.0", "1.0.2")).toBe("#9ca3af");
});

test("returns orange when between 2 and 20 patch versions", () => {
  expect(getEdgeColor("1.0.0", "1.0.10")).toBe("#eab308");
});

test("returns red when minor version differs", () => {
  expect(getEdgeColor("1.0.0", "1.1.0")).toBe("#ef4444");
});

test("returns red when patch diff over 20", () => {
  expect(getEdgeColor("1.0.0", "1.0.30")).toBe("#ef4444");
});
