import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Copy, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Execution, Workflow } from "@shared/schema";

export default function ExecutionDetail() {
  const [, params] = useRoute<{ id: string }>("/executions/:id");
  const { toast } = useToast();

  const { data: execution, isLoading } = useQuery<Execution>({
    queryKey: [`/api/executions/${params?.id}`],
    enabled: !!params?.id,
  });

  const { data: workflow } = useQuery<Workflow>({
    queryKey: [`/api/workflows/${execution?.workflowId}`],
    enabled: !!execution?.workflowId,
  });

  const handleCopyLogs = () => {
    if (!execution) return;
    const logsText = execution.logs.map(log =>
      `[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');
    navigator.clipboard.writeText(logsText);
    toast({ title: "Logs copied", description: "Execution logs copied to clipboard" });
  };

  const handleDownloadResults = () => {
    if (!execution?.results) return;
    const blob = new Blob([JSON.stringify(execution.results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-${execution.id}-results.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Results downloaded successfully" });
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-destructive';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

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

  if (!execution) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">Execution not found</h2>
        <Link href="/executions">
          <Button>Back to Executions</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center gap-4">
        <Link href="/executions">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-1">{workflow?.name || 'Execution Details'}</h1>
          <p className="text-sm text-muted-foreground">
            Execution ID: {execution.id}
          </p>
        </div>
        <Badge
          variant={
            execution.status === 'completed' ? 'default' :
            execution.status === 'running' ? 'secondary' :
            execution.status === 'failed' ? 'destructive' :
            'outline'
          }
          className="text-base px-3 py-1"
          data-testid="badge-execution-status"
        >
          {execution.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Execution Logs</CardTitle>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleCopyLogs} data-testid="button-copy-logs">
                  <Copy className="h-3 w-3" />
                  Copy Logs
                </Button>
              </div>
              <CardDescription>{execution.logs.length} log entries</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full rounded-md border bg-muted/30 p-4">
                <div className="space-y-2 font-mono text-xs">
                  {execution.logs.map((log, index) => (
                    <div key={index} className="flex items-start gap-3" data-testid={`log-${index}`}>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <div className="flex-shrink-0 mt-0.5">
                        {getLogIcon(log.level)}
                      </div>
                      <span className={`flex-1 ${getLogColor(log.level)}`}>
                        [{log.category}] {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {execution.results && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Extracted Results</CardTitle>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadResults} data-testid="button-download-results">
                    <Download className="h-3 w-3" />
                    Download JSON
                  </Button>
                </div>
                <CardDescription>Data extracted from the workflow execution</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 w-full rounded-md border bg-muted/30 p-4">
                  <pre className="font-mono text-xs whitespace-pre-wrap">
                    {JSON.stringify(execution.results, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Started</p>
                <p className="font-medium">
                  {execution.startedAt
                    ? new Date(execution.startedAt).toLocaleString()
                    : 'Not started'}
                </p>
              </div>
              {execution.completedAt && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completed</p>
                  <p className="font-medium">
                    {new Date(execution.completedAt).toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Duration</p>
                <p className="font-medium">
                  {execution.duration
                    ? `${(execution.duration / 1000).toFixed(2)}s`
                    : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          {execution.tokenUsage && (
            <Card>
              <CardHeader>
                <CardTitle>Token Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prompt Tokens</p>
                  <p className="font-medium">{execution.tokenUsage.promptTokens.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completion Tokens</p>
                  <p className="font-medium">{execution.tokenUsage.completionTokens.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Tokens</p>
                  <p className="text-xl font-bold">{execution.tokenUsage.totalTokens.toLocaleString()}</p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Estimated Cost</p>
                  <p className="text-2xl font-bold text-primary">
                    ${execution.tokenUsage.estimatedCost.toFixed(4)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {execution.error && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Error Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{execution.error}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
