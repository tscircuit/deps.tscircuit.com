import semver from "semver";

export function getEdgeColor(
  requiredRange: string,
  latestVersion: string,
): string {
  if (!semver.validRange(requiredRange) || !semver.valid(latestVersion)) {
    return "#eab308"; // default yellow/orange
  }
  const latest = semver.parse(latestVersion)!;
  const required = semver.minVersion(requiredRange)!;

  if (semver.eq(required, latest)) {
    return "#3b82f6"; // blue for latest
  }

  if (latest.major !== required.major || latest.minor !== required.minor) {
    return "#ef4444"; // red if minor/major mismatch
  }

  const patchDiff = latest.patch - required.patch;
  if (patchDiff > 20) {
    return "#ef4444"; // red if >20 patch versions
  }
  if (patchDiff > 2) {
    return "#eab308"; // orange/yellow
  }
  return "#9ca3af"; // gray when within 2 patches
}
