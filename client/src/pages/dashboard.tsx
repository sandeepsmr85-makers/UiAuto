import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Play, FileCode, Clock, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import type { Execution, Workflow } from "@shared/schema";

export default function Dashboard() {
  const { data: executions = [], isLoading: executionsLoading } = useQuery<Execution[]>({
    queryKey: ['/api/executions'],
  });

  const { data: workflows = [], isLoading: workflowsLoading } = useQuery<Workflow[]>({
    queryKey: ['/api/workflows'],
  });

  const recentExecutions = executions.slice(0, 5);
  const runningExecutions = executions.filter(e => e.status === 'running');
  const completedExecutions = executions.filter(e => e.status === 'completed');
  const failedExecutions = executions.filter(e => e.status === 'failed');

  const totalTokens = executions.reduce((sum, e) => sum + (e.tokenUsage?.totalTokens || 0), 0);
  const totalCost = executions.reduce((sum, e) => sum + (e.tokenUsage?.estimatedCost || 0), 0);

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Automation Dashboard</h1>
        <p className="text-muted-foreground">Monitor and manage your browser automation workflows</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-workflows">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-workflow-count">{workflows.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active automation scripts</p>
          </CardContent>
        </Card>

        <Card data-testid="card-executions">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Executions</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-execution-count">{executions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {runningExecutions.length} running
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-success-rate">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-success-rate">
              {executions.length > 0
                ? Math.round((completedExecutions.length / executions.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {failedExecutions.length} failed
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-token-usage">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-cost">
              ${totalCost.toFixed(4)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTokens.toLocaleString()} tokens used
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Create your first automation workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/new">
              <Button className="w-full justify-start gap-2" size="lg" data-testid="button-new-workflow">
                <Sparkles className="h-4 w-4" />
                Create New Workflow
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/templates">
              <Button variant="outline" className="w-full justify-start gap-2" size="lg" data-testid="button-browse-templates">
                <FileCode className="h-4 w-4" />
                Browse Templates
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Executions</CardTitle>
              <Link href="/executions">
                <Button variant="ghost" size="sm" data-testid="link-view-all-executions">
                  View All
                </Button>
              </Link>
            </div>
            <CardDescription>Latest automation runs</CardDescription>
          </CardHeader>
          <CardContent>
            {executionsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : recentExecutions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No executions yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create a workflow to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentExecutions.map((execution) => {
                  const workflow = workflows.find(w => w.id === execution.workflowId);
                  return (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                      data-testid={`execution-${execution.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {workflow?.name || 'Unknown Workflow'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {execution.startedAt ? new Date(execution.startedAt).toLocaleString() : 'Not started'}
                        </p>
                      </div>
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
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
