"use client"

import { Handle, Position, type NodeProps } from "reactflow"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ExternalLink, XCircle } from "lucide-react"
import { LoadingSpinner } from "./loading-spinner"
import type { DisplayNodeData } from "@/app/actions" // Ensure this path is correct

export function CustomGraphNode({ data }: NodeProps<DisplayNodeData>) {
  let statusIcon
  let statusColorClass = ""

  switch (data.status) {
    case "UP_TO_DATE":
      statusIcon = <CheckCircle2 className="h-5 w-5 text-green-500" />
      statusColorClass = "border-green-500"
      break
    case "STALE_DEPENDENCY":
      statusIcon = <LoadingSpinner className="h-5 w-5 text-yellow-500" />
      statusColorClass = "border-yellow-500"
      break
    case "ERROR":
      statusIcon = <XCircle className="h-5 w-5 text-red-500" />
      statusColorClass = "border-red-500"
      break
    case "LOADING":
      statusIcon = <LoadingSpinner className="h-5 w-5 text-gray-500" />
      statusColorClass = "border-gray-500"
      break
    default:
      statusIcon = null
  }

  return (
    <Card className={`w-64 shadow-lg ${statusColorClass}`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-500" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg truncate" title={data.label}>
            {data.label}
          </CardTitle>
          {statusIcon}
        </div>
        <CardDescription>Version: {data.version}</CardDescription>
      </CardHeader>
      <CardContent className="text-xs">
        {data.status === "ERROR" && data.error && (
          <Badge variant="destructive" className="whitespace-normal break-all mb-2">
            Error: {data.error}
          </Badge>
        )}
        <p className="truncate" title={data.repoName}>
          Repo: {data.repoName}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        {data.rawPackageJsonUrl && (
          <Button variant="outline" size="sm" asChild className="bg-background text-foreground hover:bg-accent">
            <a href={data.rawPackageJsonUrl} target="_blank" rel="noopener noreferrer">
              package.json <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        )}
        <Button variant="outline" size="sm" asChild className="bg-background text-foreground hover:bg-accent">
          <a href={data.url} target="_blank" rel="noopener noreferrer">
            GitHub <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
      </CardFooter>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500" />
    </Card>
  )
}
