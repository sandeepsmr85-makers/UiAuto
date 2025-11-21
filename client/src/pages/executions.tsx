import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Clock, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";
import type { Execution, Workflow } from "@shared/schema";

export default function Executions() {
  const { data: executions = [], isLoading } = useQuery<Execution[]>({
    queryKey: ['/api/executions'],
  });

  const { data: workflows = [] } = useQuery<Workflow[]>({
    queryKey: ['/api/workflows'],
  });

  const getWorkflowName = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    return workflow?.name || 'Unknown Workflow';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Execution History</h1>
        <p className="text-muted-foreground">View all automation runs and their results</p>
      </div>

      {executions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Play className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No executions yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Run a workflow to see execution history</p>
          <Link href="/workflows">
            <Button data-testid="button-go-to-workflows">
              Go to Workflows
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {executions.map((execution) => (
            <Card key={execution.id} className="hover-elevate" data-testid={`card-execution-${execution.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-1">
                      {getStatusIcon(execution.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-1">{getWorkflowName(execution.workflowId)}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        <span>
                          {execution.startedAt
                            ? new Date(execution.startedAt).toLocaleString()
                            : 'Not started'}
                        </span>
                        <span>•</span>
                        <span>Duration: {formatDuration(execution.duration)}</span>
                        {execution.tokenUsage && (
                          <>
                            <span>•</span>
                            <span>{execution.tokenUsage.totalTokens.toLocaleString()} tokens</span>
                            <span>•</span>
                            <span>${execution.tokenUsage.estimatedCost.toFixed(4)}</span>
                          </>
                        )}
                      </div>
                      {execution.error && (
                        <p className="text-sm text-destructive mt-2 line-clamp-2">
                          {execution.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        execution.status === 'completed' ? 'default' :
                        execution.status === 'running' ? 'secondary' :
                        execution.status === 'failed' ? 'destructive' :
                        'outline'
                      }
                      data-testid={`badge-status-${execution.id}`}
                    >
                      {execution.status}
                    </Badge>
                    <Link href={`/executions/${execution.id}`}>
                      <Button variant="ghost" size="sm" className="gap-2" data-testid={`button-view-${execution.id}`}>
                        View Details
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
