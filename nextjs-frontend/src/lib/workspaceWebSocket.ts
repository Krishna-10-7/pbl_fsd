"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type WorkspaceSocketMessage = {
  type: string;
  workspaceId?: string;
  payload?: Record<string, unknown>;
};

type UseWorkspaceWebSocketOptions = {
  workspaceId: string;
  token: string;
  enabled?: boolean;
  onMessage?: (message: WorkspaceSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
};

function resolveWebSocketBaseUrl(): string {
  const explicitWsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (explicitWsUrl) {
    return explicitWsUrl.replace(/\/$/, "");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return apiUrl.replace(/^http/i, "ws").replace(/\/api\/?$/, "");
}

export function useWorkspaceWebSocket({ workspaceId, token, enabled = true, onMessage, onOpen, onClose, onError }: UseWorkspaceWebSocketOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualCloseRef = useRef(false);
  const [connected, setConnected] = useState(false);
  const [reconnectTick, setReconnectTick] = useState(0);

  const send = useCallback((message: WorkspaceSocketMessage) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    socket.send(JSON.stringify(message));
    return true;
  }, []);

  useEffect(() => {
    manualCloseRef.current = false;

    if (!enabled || !workspaceId || !token) {
      setConnected(false);
      return;
    }

    const baseUrl = resolveWebSocketBaseUrl();
    const socket = new WebSocket(`${baseUrl}/ws/${workspaceId}?token=${encodeURIComponent(token)}`);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      onOpen?.();
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as WorkspaceSocketMessage;
        onMessage?.(message);
      } catch {
        // Ignore malformed payloads.
      }
    };

    socket.onerror = (error) => {
      onError?.(error);
    };

    socket.onclose = () => {
      setConnected(false);
      onClose?.();
      socketRef.current = null;

      if (!manualCloseRef.current && enabled) {
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          setReconnectTick((value) => value + 1);
        }, 1200);
      }
    };

    return () => {
      manualCloseRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      socket.close();
    };
  }, [enabled, workspaceId, token, reconnectTick, onMessage, onOpen, onClose, onError]);

  return { connected, send };
}
