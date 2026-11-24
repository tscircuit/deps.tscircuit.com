import { expect, test } from "bun:test"
import { fetchDependencyGraphData } from "../app/actions"

const originalFetch = globalThis.fetch

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
  })
}

test("includes peer-only dependencies in peer dependency mode", async () => {
  globalThis.fetch = async (input) => {
    const url = String(input)

    if (url.endsWith("/child/main/package.json")) {
      return jsonResponse({ name: "child", version: "1.0.0" })
    }

    if (url.endsWith("/parent/main/package.json")) {
      return jsonResponse({
        name: "parent",
        version: "1.0.0",
        peerDependencies: { child: "^1.0.0" },
      })
    }

    if (url.startsWith("https://api.github.com/")) {
      return jsonResponse([])
    }

    throw new Error(`Unexpected fetch: ${url}`)
  }

  try {
    const graph = await fetchDependencyGraphData(
      [
        "https://github.com/tscircuit/child",
        "https://github.com/tscircuit/parent",
      ],
      true,
    )

    expect(graph.edges).toHaveLength(1)
    expect(graph.edges[0]?.source).toBe("child")
    expect(graph.edges[0]?.target).toBe("parent")
  } finally {
    globalThis.fetch = originalFetch
  }
})
