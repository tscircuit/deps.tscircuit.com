"use client"

import { useCallback, useEffect, useState, useRef, useMemo } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface GraphNodeData extends DisplayNodeData {
  onFocus?: (id: string) => void
}

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
  "https://github.com/tscircuit/jscad-electronics",
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
  nodes: Node<GraphNodeData>[],
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
  const [nodes, setNodes] = useState<Node<GraphNodeData>[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLayouting, setIsLayouting] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userHasMovedNodes, setUserHasMovedNodes] = useState(false)
  const lastLayoutNodeIds = useRef<Set<string>>(new Set())
  const [dependencyMode, setDependencyMode] = useState<"peer" | "all">("peer")
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)

  const handleFocus = useCallback((id: string) => {
    setFocusedNodeId(id)
  }, [])

  const clearFocus = useCallback(() => setFocusedNodeId(null), [])

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
          data.nodes as Node<GraphNodeData>[],
          data.edges,
        )
        const layoutedNodesWithFocus = layoutedNodes.map((node) => ({
          ...node,
          data: { ...node.data, onFocus: handleFocus },
        }))
        const currentIds = new Set(layoutedNodes.map((n) => n.id))
        const newRepoAdded = Array.from(currentIds).some(
          (id) => !lastLayoutNodeIds.current.has(id),
        )
        if (newRepoAdded || !userHasMovedNodes) {
          setNodes(layoutedNodesWithFocus)
          lastLayoutNodeIds.current = currentIds
          setUserHasMovedNodes(false)
        } else {
          setNodes((prev) =>
            layoutedNodesWithFocus.map((node) => {
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
    [userHasMovedNodes, dependencyMode, handleFocus],
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

  const handleResetLayout = useCallback(() => {
    setIsLayouting(true)
    setNodes((prev) => {
      const { nodes: layouted } = getLayoutedElements(prev, edges)
      lastLayoutNodeIds.current = new Set(layouted.map((n) => n.id))
      return layouted.map((node) => ({
        ...node,
        data: { ...node.data, onFocus: handleFocus },
      }))
    })
    setUserHasMovedNodes(false)
    setIsLayouting(false)
  }, [edges, handleFocus])

  const displayEdges = focusedNodeId
    ? edges.filter((e) => e.source === focusedNodeId || e.target === focusedNodeId)
    : edges

  const displayNodes = useMemo(() => {
    if (!focusedNodeId) return nodes
    const connected = new Set<string>([focusedNodeId])
    edges.forEach((e) => {
      if (e.source === focusedNodeId) connected.add(e.target)
      if (e.target === focusedNodeId) connected.add(e.source)
    })
    return nodes.map((node) => ({
      ...node,
      style: { ...(node.style || {}), opacity: connected.has(node.id) ? 1 : 0.5 },
    }))
  }, [nodes, edges, focusedNodeId])

  if (isLoading && nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <LoadingSpinner size={48} />
        <p className="mt-4 text-lg text-muted-foreground">Loading dependency graph...</p>
      </div>
    )
  }

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
              onClick={clearFocus}
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
          nodes={displayNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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
