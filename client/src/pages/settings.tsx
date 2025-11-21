import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Settings as SettingsIcon, Palette, Zap } from "lucide-react";

export default function Settings() {
  return (
    <div className="flex flex-col gap-6 p-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure your automation studio preferences</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Customize how the automation studio looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <CardTitle>Automation Defaults</CardTitle>
          </div>
          <CardDescription>Default settings for new workflows</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="default-headless">Headless Mode</Label>
              <p className="text-sm text-muted-foreground">Run browsers without GUI by default</p>
            </div>
            <Switch id="default-headless" defaultChecked data-testid="switch-default-headless" />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-save">Auto-save Workflows</Label>
              <p className="text-sm text-muted-foreground">Automatically save workflow changes</p>
            </div>
            <Switch id="auto-save" defaultChecked data-testid="switch-auto-save" />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="verbose-logs">Verbose Logging</Label>
              <p className="text-sm text-muted-foreground">Show detailed execution logs</p>
            </div>
            <Switch id="verbose-logs" data-testid="switch-verbose-logs" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            <CardTitle>About</CardTitle>
          </div>
          <CardDescription>Information about this automation platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Platform</span>
            <span className="text-sm font-medium">Stagehand Automation Studio</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm font-medium">3.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Powered By</span>
            <span className="text-sm font-medium">Stagehand v3 + Custom LLM</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
