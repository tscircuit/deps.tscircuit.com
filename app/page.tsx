import { DependencyGraph } from "@/components/dependency-graph" // Ensure path is correct
import { ReactFlowProvider } from "reactflow"

export default function HomePage() {
  return (
    <ReactFlowProvider>
      {" "}
      {/* ReactFlowProvider is needed if using hooks like useReactFlow */}
      <main>
        <DependencyGraph />
      </main>
    </ReactFlowProvider>
  )
}
