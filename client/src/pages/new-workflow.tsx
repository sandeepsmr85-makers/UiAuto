import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Play, Save, Code, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertWorkflow, WorkflowStep } from "@shared/schema";

export default function NewWorkflow() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("");
  const [executionMode, setExecutionMode] = useState<'sequential' | 'parallel'>('sequential');
  const [browserConfig, setBrowserConfig] = useState({
    headless: true,
    viewport: { width: 1920, height: 1080 },
    userAgent: "",
  });

  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  const createWorkflowMutation = useMutation({
    mutationFn: async (workflow: InsertWorkflow) => {
      return apiRequest('POST', '/api/workflows', workflow);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      toast({
        title: "Workflow created",
        description: "Your automation workflow has been created successfully.",
      });
      setLocation(`/workflows/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create workflow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const parseNaturalLanguageMutation = useMutation({
    mutationFn: async (description: string) => {
      return apiRequest('POST', '/api/workflows/parse', { description });
    },
    onSuccess: (data) => {
      if (data.steps) {
        setSteps(data.steps);
        toast({
          title: "Workflow parsed",
          description: `Generated ${data.steps.length} automation steps.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to parse workflow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateWorkflow = () => {
    if (!workflowName.trim()) {
      toast({
        title: "Workflow name required",
        description: "Please provide a name for your workflow.",
        variant: "destructive",
      });
      return;
    }

    if (steps.length === 0) {
      toast({
        title: "No steps defined",
        description: "Please add at least one automation step.",
        variant: "destructive",
      });
      return;
    }

    createWorkflowMutation.mutate({
      name: workflowName,
      description: workflowDescription,
      steps,
      executionMode,
      browserConfig,
    });
  };

  const handleParseNaturalLanguage = () => {
    if (!naturalLanguageInput.trim()) {
      toast({
        title: "Description required",
        description: "Please describe what you want to automate.",
        variant: "destructive",
      });
      return;
    }

    parseNaturalLanguageMutation.mutate(naturalLanguageInput);
  };

  return (
    <div className="flex flex-col gap-6 p-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Create New Workflow</h1>
        <p className="text-muted-foreground">Build a browser automation workflow with natural language or visual builder</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Details</CardTitle>
              <CardDescription>Basic information about your automation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflow-name">Workflow Name *</Label>
                <Input
                  id="workflow-name"
                  placeholder="e.g., Product Price Scraper"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  data-testid="input-workflow-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea
                  id="workflow-description"
                  placeholder="Describe what this workflow does..."
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  className="min-h-20"
                  data-testid="input-workflow-description"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Natural Language Builder
              </CardTitle>
              <CardDescription>Describe your automation in plain English</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Example: Go to amazon.com, search for 'wireless headphones', extract the title and price of the first 10 products, and save to JSON"
                value={naturalLanguageInput}
                onChange={(e) => setNaturalLanguageInput(e.target.value)}
                className="min-h-32 font-mono text-sm"
                data-testid="input-natural-language"
              />
              <Button
                onClick={handleParseNaturalLanguage}
                disabled={parseNaturalLanguageMutation.isPending}
                className="w-full gap-2"
                data-testid="button-generate-steps"
              >
                <Sparkles className="h-4 w-4" />
                {parseNaturalLanguageMutation.isPending ? "Generating..." : "Generate Workflow Steps"}
              </Button>
            </CardContent>
          </Card>

          {steps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Steps</CardTitle>
                <CardDescription>{steps.length} automation steps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-3 p-3 rounded-md border bg-card hover-elevate"
                      data-testid={`step-${index}`}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {step.type}
                          </Badge>
                        </div>
                        <p className="text-sm">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Execution Mode</Label>
                <Select value={executionMode} onValueChange={(v: any) => setExecutionMode(v)}>
                  <SelectTrigger data-testid="select-execution-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sequential">Sequential</SelectItem>
                    <SelectItem value="parallel">Parallel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="headless">Headless Mode</Label>
                <Switch
                  id="headless"
                  checked={browserConfig.headless}
                  onCheckedChange={(checked) =>
                    setBrowserConfig({ ...browserConfig, headless: checked })
                  }
                  data-testid="switch-headless"
                />
              </div>

              <div className="space-y-2">
                <Label>Viewport Size</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Width"
                    value={browserConfig.viewport.width}
                    onChange={(e) =>
                      setBrowserConfig({
                        ...browserConfig,
                        viewport: { ...browserConfig.viewport, width: parseInt(e.target.value) || 1920 },
                      })
                    }
                    data-testid="input-viewport-width"
                  />
                  <Input
                    type="number"
                    placeholder="Height"
                    value={browserConfig.viewport.height}
                    onChange={(e) =>
                      setBrowserConfig({
                        ...browserConfig,
                        viewport: { ...browserConfig.viewport, height: parseInt(e.target.value) || 1080 },
                      })
                    }
                    data-testid="input-viewport-height"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-agent">User Agent (Optional)</Label>
                <Input
                  id="user-agent"
                  placeholder="Custom user agent..."
                  value={browserConfig.userAgent}
                  onChange={(e) =>
                    setBrowserConfig({ ...browserConfig, userAgent: e.target.value })
                  }
                  data-testid="input-user-agent"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              onClick={handleCreateWorkflow}
              disabled={createWorkflowMutation.isPending || !workflowName || steps.length === 0}
              className="w-full gap-2"
              data-testid="button-create-workflow"
            >
              <Save className="h-4 w-4" />
              {createWorkflowMutation.isPending ? "Creating..." : "Create Workflow"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
