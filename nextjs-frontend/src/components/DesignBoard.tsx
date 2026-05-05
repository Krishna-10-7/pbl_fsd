"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Excalidraw, type InitialDataState } from "@excalidraw/excalidraw";
type ExcalidrawImperativeAPI = Parameters<NonNullable<React.ComponentProps<typeof Excalidraw>["excalidrawAPI"]>>[0];
import { useWorkspaceWebSocket, type WorkspaceSocketMessage } from "../lib/workspaceWebSocket";

type DesignBoardProps = {
  workspaceId: string;
};

type SavedDesignBoard = {
  elements: InitialDataState["elements"];
  appState: InitialDataState["appState"];
  files: InitialDataState["files"];
};

const DEFAULT_APP_STATE: InitialDataState["appState"] = {
  viewBackgroundColor: "#ffffff",
};

export default function DesignBoard({ workspaceId }: DesignBoardProps) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState("");
  const pendingChangesRef = useRef(false);

  const storageKey = useMemo(() => `collabspace_excalidraw_${workspaceId}`, [workspaceId]);

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("collabspace_token") || "");
  }, []);

  const applyRemoteBoardState = useCallback(
    (payload: WorkspaceSocketMessage["payload"] | undefined) => {
      if (!payload) return;

      const elements = (payload.elements as InitialDataState["elements"]) || [];
      const appState = (payload.appState as InitialDataState["appState"]) || {};
      const files = (payload.files as InitialDataState["files"]) || {};

      if (apiRef.current) {
        apiRef.current.updateScene({ elements, appState, files });
      }

      localStorage.setItem(storageKey, JSON.stringify({ elements, appState, files }));
    },
    [storageKey],
  );

  const { send } = useWorkspaceWebSocket({
    workspaceId,
    token,
    enabled: mounted && Boolean(token),
    onMessage: useCallback(
      (message: WorkspaceSocketMessage) => {
        if (message.type === "workspace_snapshot") {
          applyRemoteBoardState(message.payload?.board as WorkspaceSocketMessage["payload"] | undefined);
          return;
        }

        if (message.type === "board_updated") {
          applyRemoteBoardState(message.payload);
        }
      },
      [applyRemoteBoardState],
    ),
  });

  const initialData = useMemo<InitialDataState>(() => {
    if (!mounted) {
      return { appState: DEFAULT_APP_STATE };
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return { appState: DEFAULT_APP_STATE };
      }

      const saved = JSON.parse(raw) as SavedDesignBoard;
      return {
        elements: saved.elements || [],
        appState: {
          ...DEFAULT_APP_STATE,
          ...(saved.appState || {}),
        },
        files: saved.files || {},
      };
    } catch {
      return { appState: DEFAULT_APP_STATE };
    }
  }, [mounted, storageKey]);

  const persistScene = useCallback(() => {
    if (!apiRef.current) return;

    const scene = apiRef.current.getSceneElements();
    const appState = apiRef.current.getAppState();
    const files = apiRef.current.getFiles();

    const payload: SavedDesignBoard = {
      elements: scene,
      appState,
      files,
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));

    if (!pendingChangesRef.current) {
      pendingChangesRef.current = true;
      send({
        type: "board_change",
        payload: {
          elements: scene,
          appState,
          files,
        },
      });
      setTimeout(() => {
        pendingChangesRef.current = false;
      }, 350);
    }
  }, [send, storageKey]);

  useEffect(() => {
    const handleBeforeUnload = () => persistScene();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [persistScene]);

  useEffect(() => {
    if (!apiRef.current) return;
    apiRef.current.updateScene(initialData);
  }, [initialData]);

  if (!mounted) {
    return <div style={{ minHeight: "520px", background: "#ffffff", borderRadius: "14px", border: "1px solid #eaedf3" }} />;
  }

  return (
    <div style={{ height: "calc(100vh - 240px)", minHeight: "520px" }}>
      <Excalidraw
        excalidrawAPI={(api) => {
          apiRef.current = api;
        }}
        initialData={initialData}
        onChange={() => {
          persistScene();
        }}
      />
    </div>
  );
}
