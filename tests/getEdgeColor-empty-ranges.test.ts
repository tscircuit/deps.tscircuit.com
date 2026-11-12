import { test } from "bun:test";
import assert from "node:assert/strict";
import semver from "semver";
import { getEdgeColor } from "../lib/getEdgeColor";

// These are valid range expressions with no matching version, not invalid syntax.
for (const range of [
  ">2.0.0 <1.0.0",
  ">=1.0.0 <1.0.0",
  "<0.0.0-0",
  "^1.0.0 ^2.0.0",
  ">2.0.0 <1.0.0 || <0.0.0-0",
]) {
  test(`uses the fallback color for an empty range: ${range}`, () => {
    assert.ok(semver.validRange(range));
    assert.equal(semver.minVersion(range), null);
    let color: string | undefined;
    assert.doesNotThrow(() => {
      color = getEdgeColor(range, "3.0.0");
    });
    assert.equal(color, "#eab308");
  });
}

// Literal controls preserve the existing minimum-version color policy.
const controls: [string, string, string, string][] = [
  ["exact match", "1.0.0", "1.0.0", "#3b82f6"],
  ["one patch behind", "1.0.0", "1.0.1", "#9ca3af"],
  ["two patches behind", "1.0.0", "1.0.2", "#9ca3af"],
  ["three patches behind", "1.0.0", "1.0.3", "#eab308"],
  ["ten patches behind", "1.0.0", "1.0.10", "#eab308"],
  ["twenty patches behind", "1.0.0", "1.0.20", "#eab308"],
  ["twenty-one patches behind", "1.0.0", "1.0.21", "#ef4444"],
  ["thirty patches behind", "1.0.0", "1.0.30", "#ef4444"],
  ["minor mismatch", "1.0.0", "1.1.0", "#ef4444"],
  ["major mismatch", "1.0.0", "2.0.0", "#ef4444"],
  ["non-semver URL", "https://pkg.pr.new/tscircuit/eval/@tscircuit/eval@90b7d8c", "1.0.0", "#eab308"],
  ["invalid range syntax", "not a range", "1.0.0", "#eab308"],
  ["invalid latest version", "^1.0.0", "not a version", "#eab308"],
  ["a range is not a latest version", "^1.0.0", "^1.0.0", "#eab308"],
  ["empty range string means any version", "", "0.0.0", "#3b82f6"],
  ["wildcard range", "*", "0.0.0", "#3b82f6"],
  ["exact prerelease", "1.0.0-alpha.1", "1.0.0-alpha.1", "#3b82f6"],
  ["build metadata does not change precedence", "1.0.0+one", "1.0.0+two", "#3b82f6"],
  ["satisfiable OR after an empty branch", ">2.0.0 <1.0.0 || 1.2.3", "1.2.3", "#3b82f6"],
  ["satisfiable OR before an empty branch", "1.2.3 || >2.0.0 <1.0.0", "1.2.3", "#3b82f6"],
  ["range color still compares against its minimum", ">=1.0.0 <2.0.0", "1.4.0", "#ef4444"],
];

for (const [name, range, latest, expected] of controls) {
  test(name, () => {
    assert.equal(getEdgeColor(range, latest), expected);
  });
}
