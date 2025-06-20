"use server"

import type { Node, Edge } from "reactflow"
import semver from "semver"

const GITHUB_RAW_BASE_URL = "https://raw.githubusercontent.com"

export interface DisplayNodeData {
  label: string // package name for display
  version: string // its own current version
  status: "UP_TO_DATE" | "STALE_DEPENDENCY" | "ERROR" | "LOADING"
  url: string // GitHub URL to the repo
  rawPackageJsonUrl?: string // URL to the raw package.json
  error?: string // Error message if status is ERROR
  repoName: string // Extracted repository name
  packageJsonLastUpdated?: string // ISO timestamp of last package.json commit
}

export interface GraphData {
  nodes: Node<DisplayNodeData>[]
  edges: Edge[]
}

interface FetchedRepoInfo {
  packageName?: string
  packageVersion?: string
  dependencies?: { [key: string]: string }
  devDependencies?: { [key: string]: string }
  githubUrl: string
  owner: string
  repoName: string
  rawPackageJsonUrl?: string
  packageJsonLastUpdated?: string
  error?: string
}

async function fetchPackageJsonWithFallback(
  owner: string,
  repo: string,
): Promise<{ data: any; branch: string } | { error: string }> {
  const branches = ["main", "master"]
  for (const branch of branches) {
    try {
      const url = `${GITHUB_RAW_BASE_URL}/${owner}/${repo}/${branch}/package.json`
      const response = await fetch(url, { next: { revalidate: 0 } }) // No caching for fresh data
      if (response.ok) {
        const data = await response.json()
        return { data, branch }
      }
      if (response.status === 404) continue // Try next branch
      return { error: `Failed to fetch package.json from ${branch} (status: ${response.status})` }
    } catch (e: any) {
      // Network error or JSON parse error, try next branch if applicable
      if (branch === branches[branches.length - 1]) {
        // Last branch attempt
        return { error: e.message || "Unknown error during fetch" }
      }
    }
  }
  return { error: "package.json not found in main or master branches" }
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.hostname === "github.com") {
      const pathParts = parsedUrl.pathname.split("/").filter(Boolean)
      if (pathParts.length >= 2) {
        return { owner: pathParts[0], repo: pathParts[1] }
      }
    }
  } catch (e) {
    console.error("Invalid GitHub URL:", url, e)
  }
  return null
}

async function fetchLastPackageJsonUpdate(
  owner: string,
  repo: string,
): Promise<string | null> {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?path=package.json&page=1&per_page=1`
  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      return data[0].commit.committer.date
    }
  } catch (e) {
    console.error("Failed to fetch last package.json update", e)
  }
  return null
}

export async function fetchDependencyGraphData(repoUrls: string[]): Promise<GraphData> {
  const fetchedRepos: FetchedRepoInfo[] = await Promise.all(
    repoUrls.map(async (url) => {
      const parsed = parseGitHubUrl(url)
      if (!parsed) {
        return { githubUrl: url, owner: "", repoName: url, error: "Invalid GitHub URL" }
      }
      const { owner, repo: repoName } = parsed

      const result = await fetchPackageJsonWithFallback(owner, repoName)

      if ("error" in result) {
        return { githubUrl: url, owner, repoName, error: result.error }
      }

      const packageJson = result.data
      const branch = result.branch
      const rawPackageJsonUrl = `${GITHUB_RAW_BASE_URL}/${owner}/${repoName}/${branch}/package.json`
      const packageJsonLastUpdated = await fetchLastPackageJsonUpdate(owner, repoName)

      if (!packageJson.name || !packageJson.version) {
        return {
          githubUrl: url,
          owner,
          repoName,
          rawPackageJsonUrl,
          error: "package.json missing 'name' or 'version' field",
        }
      }

      return {
        packageName: packageJson.name,
        packageVersion: packageJson.version,
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {}, // Consider devDependencies too if needed
        githubUrl: url,
        owner,
        repoName,
        rawPackageJsonUrl,
        packageJsonLastUpdated: packageJsonLastUpdated || undefined,
      }
    }),
  )

  const latestVersionsMap = new Map<string, string>()
  fetchedRepos.forEach((repo) => {
    if (repo.packageName && repo.packageVersion && !repo.error) {
      latestVersionsMap.set(repo.packageName, repo.packageVersion)
    }
  })

  const nodes: Node<DisplayNodeData>[] = []
  const edges: Edge[] = []

  fetchedRepos.forEach((repo, index) => {
    const nodeId = repo.packageName || `${repo.owner}/${repo.repoName}` // Fallback ID
    let status: DisplayNodeData["status"] = "LOADING"
    let nodeError = repo.error

    if (repo.error) {
      status = "ERROR"
    } else if (repo.packageName && repo.packageVersion) {
      status = "UP_TO_DATE" // Assume up-to-date initially
      const allDependencies = { ...repo.dependencies, ...repo.devDependencies } // Combine dependencies

      for (const depName in allDependencies) {
        if (latestVersionsMap.has(depName)) {
          // It's an internal dependency
          const requiredVersionRange = allDependencies[depName]
          const latestAvailableVersion = latestVersionsMap.get(depName)!

          try {
            if (!semver.satisfies(latestAvailableVersion, requiredVersionRange)) {
              status = "STALE_DEPENDENCY"
              break
            }
          } catch (e: any) {
            // Invalid version range in package.json, treat as error for this node or stale
            console.error(
              `Error in semver.satisfies for ${repo.packageName} -> ${depName}@${requiredVersionRange} (latest: ${latestAvailableVersion}): ${e.message}`,
            )
            status = "STALE_DEPENDENCY" // Or ERROR, depending on desired behavior
            nodeError = nodeError
              ? `${nodeError}; Invalid semver range for ${depName}`
              : `Invalid semver range for ${depName}`
            break
          }
        }
      }
    } else {
      status = "ERROR" // If packageName or packageVersion is missing but no explicit fetch error
      if (!nodeError) nodeError = "Missing package name or version after successful fetch."
    }

    nodes.push({
      id: nodeId,
      type: "custom", // Use our custom node type
      data: {
        label: repo.packageName || repo.repoName,
        version: repo.packageVersion || "N/A",
        status,
        url: repo.githubUrl,
        rawPackageJsonUrl: repo.rawPackageJsonUrl,
        packageJsonLastUpdated: repo.packageJsonLastUpdated,
        error: nodeError,
        repoName: repo.repoName,
      },
    })

    // Create edges
    if (repo.packageName && !repo.error) {
      const allDependencies = { ...repo.dependencies, ...repo.devDependencies }
      for (const depName in allDependencies) {
        if (latestVersionsMap.has(depName)) {
          // If the dependency is one of the tracked packages
          const sourceNodeExists = fetchedRepos.some((r) => r.packageName === depName && !r.error) // Ensure source node (the dependency) exists and is valid
          if (sourceNodeExists) {
            const requiredVersionRange = allDependencies[depName]
            const latestAvailableVersion = latestVersionsMap.get(depName)!
            const isLatest = semver.satisfies(
              latestAvailableVersion,
              requiredVersionRange,
            )
            edges.push({
              id: `e-${depName}-${nodeId}`, // Edge from dependency to current repo
              source: depName, // Source is the dependency package name
              target: nodeId, // Target is the current repo's ID (packageName or fallback)
              label: isLatest
                ? requiredVersionRange
                : `${requiredVersionRange} / ${latestAvailableVersion}`,
              animated: status === "STALE_DEPENDENCY", // Animate if the current repo (target) is stale
              style: {
                stroke: isLatest ? "#9ca3af" : "#eab308",
              },
              labelStyle: {
                fill: isLatest ? "#9ca3af" : "#eab308",
              },
            })
          }
        }
      }
    }
  })

  return { nodes, edges }
}
