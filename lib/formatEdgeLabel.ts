export function formatEdgeLabel(
  depName: string,
  requiredRange: string,
  latestVersion: string,
  isLatest: boolean,
): string {
  return isLatest
    ? requiredRange
    : `${depName}\n${requiredRange} / ${latestVersion}`
}
