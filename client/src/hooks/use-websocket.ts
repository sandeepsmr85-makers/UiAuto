import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

interface WebSocketMessage {
  type: string;
  executionId?: string;
  workflowId?: string;
  log?: any;
  currentStep?: number;
  totalSteps?: number;
  stepDescription?: string;
  results?: any;
  duration?: number;
  error?: string;
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Connect to WebSocket server
    const socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WebSocket] Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
    });

    // Handle execution started
    socket.on("execution:started", (data: WebSocketMessage) => {
      console.log("[WebSocket] Execution started:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/executions/${data.executionId}`] });
    });

    // Handle execution logs
    socket.on("execution:log", (data: WebSocketMessage) => {
      console.log("[WebSocket] Log:", data.log);
      // Invalidate execution to get updated logs
      queryClient.invalidateQueries({ queryKey: [`/api/executions/${data.executionId}`] });
    });

    // Handle execution progress
    socket.on("execution:progress", (data: WebSocketMessage) => {
      const progress = data.totalSteps ? Math.round((data.currentStep! / data.totalSteps) * 100) : 0;
      console.log(`[WebSocket] Progress: ${progress}% (${data.currentStep}/${data.totalSteps}) - ${data.stepDescription}`);
      queryClient.invalidateQueries({ queryKey: [`/api/executions/${data.executionId}`] });
    });

    // Handle execution completed
    socket.on("execution:completed", (data: WebSocketMessage) => {
      console.log("[WebSocket] Execution completed:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/executions/${data.executionId}`] });
    });

    // Handle execution failed
    socket.on("execution:failed", (data: WebSocketMessage) => {
      console.error("[WebSocket] Execution failed:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/executions/${data.executionId}`] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  return socketRef.current;
}
