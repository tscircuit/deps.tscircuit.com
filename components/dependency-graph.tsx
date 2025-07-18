"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  Panel,
} from "reactflow"
import "reactflow/dist/style.css"
import dagre from "dagre"

import { fetchDependencyGraphData, type GraphData, type DisplayNodeData } from "@/app/actions"
import { CustomGraphNode } from "./custom-graph-node"
import { Button } from "@/components/ui/button"
import { RefreshCw, LayoutDashboard } from "lucide-react"
import { LoadingSpinner } from "./loading-spinner"
import { getConnectedNodeIds } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ALL_CATEGORIES } from "@/lib/categories"

const REPO_URLS = [
  "https://github.com/tscircuit/tscircuit",
  "https://github.com/tscircuit/core",
  "https://github.com/tscircuit/schematic-viewer",
  "https://github.com/tscircuit/circuit-to-svg",
  "https://github.com/tscircuit/pcb-viewer",
  "https://github.com/tscircuit/circuit-json",
  "https://github.com/tscircuit/props",
  "https://github.com/tscircuit/tscircuit-autorouter",
  "https://github.com/tscircuit/tscircuit.com",
  "https://github.com/tscircuit/svg.tscircuit.com",
  "https://github.com/tscircuit/runframe",
  "https://github.com/tscircuit/eval",
  "https://github.com/tscircuit/easyeda-converter",
  "https://github.com/tscircuit/3d-viewer",
  "https://github.com/tscircuit/schematic-symbols",
  "https://github.com/tscircuit/jscad-fiber",
  "https://github.com/tscircuit/footprinter",
  "https://github.com/tscircuit/jscad-electronics",
  "https://github.com/tscircuit/parts-engine",
  "https://github.com/tscircuit/cli",
]

const nodeTypes = {
  custom: CustomGraphNode,
}

const POLLING_INTERVAL_MS = 60 * 1000 // 1 minute
const NODE_WIDTH = 256 // From CustomGraphNode's w-64 (16rem)
const NODE_HEIGHT = 190 // Approximate height of CustomGraphNode

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const getLayoutedElements = (
  nodes: Node<DisplayNodeData>[],
  edges: Edge[],
  direction = "TB", // Top-to-Bottom layout
) => {
  dagreGraph.setGraph({
    rankdir: "TB", // Revert to "TB" (Top-to-Bottom)
    nodesep: 100, // Increased separation
    ranksep: 120, // Increased separation
  })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      // Position is at the center of the node, adjust to top-left for React Flow
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

export function DependencyGraph() {
  const [nodes, setNodes] = useState<Node<DisplayNodeData>[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLayouting, setIsLayouting] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userHasMovedNodes, setUserHasMovedNodes] = useState(false)
  const lastLayoutNodeIds = useRef<Set<string>>(new Set())
  const [dependencyMode, setDependencyMode] = useState<"peer" | "all">("all")
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
  const [visibleCategories, setVisibleCategories] = useState<string[]>(
    ALL_CATEGORIES.filter(
      (c) => c !== "Downstream" && c !== "UI Packages",
    ),
  )

  const fetchData = useCallback(
    async (isInitialLoad = false) => {
      if (isInitialLoad) setIsLoading(true)
      setIsLayouting(true)
      setError(null)
      try {
        const data: GraphData = await fetchDependencyGraphData(
          REPO_URLS,
          dependencyMode === "peer",
        )
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          data.nodes,
          data.edges,
        )
        const currentIds = new Set(layoutedNodes.map((n) => n.id))
        const newRepoAdded = Array.from(currentIds).some(
          (id) => !lastLayoutNodeIds.current.has(id),
        )
        if (newRepoAdded || !userHasMovedNodes) {
          setNodes(layoutedNodes)
          lastLayoutNodeIds.current = currentIds
          setUserHasMovedNodes(false)
        } else {
          setNodes((prev) =>
            layoutedNodes.map((node) => {
              const existing = prev.find((n) => n.id === node.id)
              return existing ? { ...node, position: existing.position } : node
            }),
          )
        }
        setEdges(layoutedEdges)
        setLastUpdated(new Date())
      } catch (err: any) {
        console.error("Failed to fetch graph data:", err)
        setError(err.message || "An unknown error occurred while fetching data.")
      } finally {
        if (isInitialLoad) setIsLoading(false)
        setIsLayouting(false)
      }
    },
    [userHasMovedNodes, dependencyMode],
  )

  useEffect(() => {
    fetchData(true) // Initial fetch

    const intervalId = setInterval(() => {
      fetchData()
    }, POLLING_INTERVAL_MS)

    return () => clearInterval(intervalId) // Cleanup on unmount
  }, [fetchData])

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    if (changes.some((c) => c.type === "position")) {
      setUserHasMovedNodes(true)
    }
    setNodes((nds) => applyNodeChanges(changes, nds))
  }, [])

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  )

  const onNodeClick = useCallback((_: any, node: Node) => {
    setFocusedNodeId(node.id)
  }, [])

  const handleResetLayout = useCallback(() => {
    setIsLayouting(true)
    setNodes((prev) => {
      const { nodes: layouted } = getLayoutedElements(prev, edges)
      lastLayoutNodeIds.current = new Set(layouted.map((n) => n.id))
      return layouted
    })
    setUserHasMovedNodes(false)
    setIsLayouting(false)
  }, [edges])

  if (isLoading && nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <LoadingSpinner size={48} />
        <p className="mt-4 text-lg text-muted-foreground">Loading dependency graph...</p>
      </div>
    )
  }

  const visibleNodes = nodes.filter((n) =>
    visibleCategories.includes(n.data.category),
  )
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id))
  const visibleEdges = edges.filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target),
  )

  const connectedIds =
    focusedNodeId && visibleEdges.length > 0
      ? getConnectedNodeIds(focusedNodeId, visibleEdges)
      : focusedNodeId
        ? new Set([focusedNodeId])
        : null

  const styledNodes = visibleNodes.map((n) => ({
    ...n,
    style: {
      ...n.style,
      opacity:
        focusedNodeId && connectedIds && !connectedIds.has(n.id) ? 0.5 : 1,
    },
  }))

  const styledEdges = visibleEdges.map((e) => ({
    ...e,
    style: {
      ...(e.style || {}),
      opacity:
        focusedNodeId && e.source !== focusedNodeId && e.target !== focusedNodeId
          ? 0.1
          : (e.style as any)?.opacity ?? 1,
    },
    labelStyle: {
      ...(e.labelStyle || {}),
      opacity:
        focusedNodeId && e.source !== focusedNodeId && e.target !== focusedNodeId
          ? 0.1
          : (e.labelStyle as any)?.opacity ?? 1,
    },
  }))

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="p-4 border-b flex justify-between items-center bg-background">
        <div>
          <h1 className="text-xl font-semibold">tscircuit Dependency Graph</h1>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
              {(isLoading || isLayouting) && <LoadingSpinner className="inline ml-2 h-3 w-3" size={12} />}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={dependencyMode}
            onValueChange={(v) => setDependencyMode(v as "peer" | "all")}
          >
            <SelectTrigger className="w-40 bg-background text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="peer">Peer Dependencies</SelectItem>
              <SelectItem value="all">Any Dependency</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-background text-foreground hover:bg-accent">
                Categories
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {ALL_CATEGORIES.map((cat) => (
                <DropdownMenuCheckboxItem
                  key={cat}
                  checked={visibleCategories.includes(cat)}
                  onCheckedChange={(checked) =>
                    setVisibleCategories((prev) =>
                      checked
                        ? [...prev, cat]
                        : prev.filter((c) => c !== cat),
                    )
                  }
                >
                  {cat}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <a
            href="https://github.com/tscircuit/deps.tscircuit.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://img.shields.io/badge/GitHub-repo-blue?logo=github"
              alt="GitHub repo"
              className="h-6"
            />
          </a>
          <Button
            onClick={() => fetchData(true)}
            variant="outline"
            size="sm"
            disabled={isLoading || isLayouting}
            className="bg-background text-foreground hover:bg-accent"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading || isLayouting ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={handleResetLayout}
            variant="outline"
            size="sm"
            disabled={isLayouting}
            className="bg-background text-foreground hover:bg-accent"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Reset Layout
          </Button>
          {focusedNodeId && (
            <Button
              onClick={() => setFocusedNodeId(null)}
              variant="outline"
              size="sm"
              className="bg-background text-foreground hover:bg-accent"
            >
              Unfocus
            </Button>
          )}
        </div>
      </div>
      {error && (
        <div className="p-4 bg-red-100 text-red-700 border-b border-red-300">
          <p>
            <strong>Error:</strong> {error}
          </p>
          <p>Displaying potentially stale data. Please try refreshing.</p>
        </div>
      )}
      <div className="flex-grow">
        <ReactFlow
          nodes={styledNodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }} // Add some padding around the fitted view
          attributionPosition="bottom-left"
        >
          <Controls />
          <Background />
          {(isLoading || isLayouting) && (
            <Panel position="top-center">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md shadow-md text-sm flex items-center">
                <LoadingSpinner size={16} className="mr-2" />
                {isLoading ? "Fetching data..." : "Applying layout..."}
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  )
}
