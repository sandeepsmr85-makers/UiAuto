import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Play, Edit, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Workflow } from "@shared/schema";

export default function WorkflowDetail() {
  const [, params] = useRoute<{ id: string }>("/workflows/:id");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workflow, isLoading } = useQuery<Workflow>({
    queryKey: [`/api/workflows/${params?.id}`],
    enabled: !!params?.id,
  });

  const executeWorkflowMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/workflows/${params?.id}/execute`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/executions'] });
      toast({
        title: "Workflow started",
        description: "Your automation is now running.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start workflow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-96 bg-muted animate-pulse rounded-lg" />
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">Workflow not found</h2>
        <Link href="/workflows">
          <Button>Back to Workflows</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center gap-4">
        <Link href="/workflows">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-1">{workflow.name}</h1>
          <p className="text-sm text-muted-foreground">{workflow.description || "No description"}</p>
        </div>
        <Button
          onClick={() => executeWorkflowMutation.mutate()}
          disabled={executeWorkflowMutation.isPending}
          className="gap-2"
          data-testid="button-execute-workflow"
        >
          <Play className="h-4 w-4" />
          {executeWorkflowMutation.isPending ? "Starting..." : "Run Workflow"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Steps</CardTitle>
              <CardDescription>{workflow.steps.length} automation steps</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {workflow.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-3 p-4 rounded-lg border bg-card"
                      data-testid={`step-${index}`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                        {step.order + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{step.type}</Badge>
                        </div>
                        <p className="text-sm mb-2">{step.description}</p>
                        {Object.keys(step.config).length > 0 && (
                          <div className="mt-2 p-2 rounded bg-muted/50">
                            <pre className="text-xs font-mono overflow-x-auto">
                              {JSON.stringify(step.config, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Execution Mode</p>
                <Badge>{workflow.executionMode}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Browser Mode</p>
                <Badge variant="outline">
                  {workflow.browserConfig?.headless ? "Headless" : "Headful"}
                </Badge>
              </div>
              {workflow.browserConfig?.viewport && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Viewport</p>
                  <p className="text-sm font-mono">
                    {workflow.browserConfig.viewport.width} x {workflow.browserConfig.viewport.height}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <p className="text-sm">{new Date(workflow.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Updated</p>
                <p className="text-sm">{new Date(workflow.updatedAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full gap-2 justify-start" data-testid="button-edit">
                <Edit className="h-4 w-4" />
                Edit Workflow
              </Button>
              <Button variant="outline" className="w-full gap-2 justify-start" data-testid="button-duplicate">
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
              <Button variant="destructive" className="w-full gap-2 justify-start" data-testid="button-delete">
                <Trash2 className="h-4 w-4" />
                Delete Workflow
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
