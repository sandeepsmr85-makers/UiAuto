import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History as HistoryIcon, Clock } from "lucide-react";
import type { Session } from "@shared/schema";

export default function History() {
  const { data: session, isLoading } = useQuery<Session>({
    queryKey: ['/api/session'],
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Session History</h1>
        <p className="text-muted-foreground">Your automation activity in this session</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
          <CardDescription>
            Started: {session?.createdAt ? new Date(session.createdAt).toLocaleString() : 'Unknown'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <HistoryIcon className="h-4 w-4" />
              Workflows Created
            </h3>
            <div className="text-2xl font-bold">{session?.workflows.length || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">Total workflows in this session</p>
          </div>

          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Executions Run
            </h3>
            <div className="text-2xl font-bold">{session?.executions.length || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">Total automation runs</p>
          </div>

          <div>
            <h3 className="font-medium mb-3">Last Accessed</h3>
            <div className="text-lg">
              {session?.lastAccessedAt ? new Date(session.lastAccessedAt).toLocaleString() : 'Unknown'}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
          <CardDescription>Technical details about your current session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Session ID</span>
            <Badge variant="outline" className="font-mono text-xs">
              {session?.id || 'N/A'}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Storage Type</span>
            <Badge variant="secondary">In-Memory</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
