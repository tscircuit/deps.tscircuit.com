import { expect, test } from "bun:test";
import { formatEdgeLabel } from "../lib/formatEdgeLabel";

test("adds dependency name when not latest", () => {
  const label = formatEdgeLabel("@tscircuit/core", "1.2.0", "1.3.0", false);
  expect(label).toBe("@tscircuit/core\n1.2.0 / 1.3.0");
});

test("returns range when up to date", () => {
  const label = formatEdgeLabel("@tscircuit/core", "1.3.0", "1.3.0", true);
  expect(label).toBe("1.3.0");
});
