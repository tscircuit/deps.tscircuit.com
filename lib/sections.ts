export const PACKAGE_SECTION_MAP: Record<string, string> = {
  "circuit-json": "Specifications",
  "@tscircuit/props": "Specifications",
  "schematic-symbols": "Specifications",
  "@tscircuit/footprinter": "Specifications",
  "jscad-fiber": "Specifications",
  "circuit-to-svg": "Core Utility",
  "jscad-electronics": "Core Utility",
  "@tscircuit/core": "Core",
  "@tscircuit/schematic-viewer": "UI Packages",
  "@tscircuit/pcb-viewer": "UI Packages",
  "@tscircuit/3d-viewer": "UI Packages",
  "@tscircuit/eval": "Packaged Bundles",
  "@tscircuit/runframe": "Packaged Bundles",
}

export function getSectionForPackage(pkg: string, repo: string): string {
  return (
    PACKAGE_SECTION_MAP[pkg] ||
    PACKAGE_SECTION_MAP[repo] ||
    "Downstream"
  )
}
