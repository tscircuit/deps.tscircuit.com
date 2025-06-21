export const PACKAGE_CATEGORY_MAP: Record<string, string> = {
  "circuit-json": "Specifications",
  "@tscircuit/props": "Specifications",
  "schematic-symbols": "Specifications",
  "@tscircuit/footprinter": "Specifications",
  "jscad-fiber": "Specifications",
  "circuit-to-svg": "Core Utility",
  "jscad-electronics": "UI Packages",
  "@tscircuit/core": "Core",
  "@tscircuit/schematic-viewer": "UI Packages",
  "@tscircuit/pcb-viewer": "UI Packages",
  "@tscircuit/3d-viewer": "UI Packages",
  "@tscircuit/eval": "Packaged Bundles",
  "@tscircuit/runframe": "Packaged Bundles",
  tscircuit: "Packaged Bundles",
}

export const ALL_CATEGORIES = [
  "Specifications",
  "Core Utility",
  "Core",
  "UI Packages",
  "Packaged Bundles",
  "Downstream",
] as const

export function getCategoryForPackage(pkg: string, repo: string): string {
  return (
    PACKAGE_CATEGORY_MAP[pkg] ||
    PACKAGE_CATEGORY_MAP[repo] ||
    "Downstream"
  )
}

export const CATEGORY_COLORS: Record<string, string> = {
  Specifications: "bg-chart-1 text-white",
  "Core Utility": "bg-chart-2 text-white",
  Core: "bg-chart-3 text-white",
  "UI Packages": "bg-chart-4 text-white",
  "Packaged Bundles": "bg-chart-5 text-white",
  Downstream:
    "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
}
