"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  Modal,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "react-aria-components";
import { pullFromBridge } from "../bridge";
import { captureLiveSnapshot, highlightRef, installLogProbe, SAMPLE_SNAPSHOT, SAMPLE_TREE } from "../live";
import { parseReactTree, parseSnapshot } from "../parse";
import type { DevErrorEntry, DevKitPayload, DevKitTab, DevLogEntry, DevTreeNode, NextDevKitProps } from "../types";
import { NavigationTreeView } from "./NavigationTree";

const DEFAULT_SHORTCUT = { alt: true, shift: true, key: "d" };

function isDevEnabled(explicit?: boolean) {
  if (explicit != null) return explicit;
  return process.env.NODE_ENV === "development";
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString();
}

export function NextDevKit(props: NextDevKitProps) {
  if (!isDevEnabled(props.enabled)) return null;
  return <NextDevKitClient {...props} />;
}

function NextDevKitClient({
  defaultTab = "snapshot",
  shortcut = DEFAULT_SHORTCUT,
  bridgeUrl,
  initialPayload,
  onSelectRef,
  placement = "right",
  className,
}: NextDevKitProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<DevKitTab>(defaultTab);
  const [snapshot, setSnapshot] = useState<DevTreeNode[]>(initialPayload?.snapshot ?? parseSnapshot(SAMPLE_SNAPSHOT));
  const [tree, setTree] = useState<DevTreeNode[]>(initialPayload?.tree ?? parseReactTree(SAMPLE_TREE));
  const [errors, setErrors] = useState<DevErrorEntry[]>(initialPayload?.errors ?? []);
  const [logs, setLogs] = useState<DevLogEntry[]>(initialPayload?.logs ?? []);
  const [paste, setPaste] = useState("");
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    return installLogProbe(
      (entry) => setLogs((prev) => [entry, ...prev].slice(0, 200)),
      (entry) => setErrors((prev) => [entry, ...prev].slice(0, 100)),
    );
  }, []);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key !== shortcut.key.toLowerCase()) return;
      if (Boolean(shortcut.alt) !== event.altKey) return;
      if (Boolean(shortcut.shift) !== event.shiftKey) return;
      if (Boolean(shortcut.meta) !== event.metaKey) return;
      event.preventDefault();
      setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);

  const captureLive = useCallback(() => {
    const nodes = captureLiveSnapshot();
    setSnapshot(nodes);
    setStatus(`Live snapshot \u00b7 ${nodes.length} top-level nodes`);
    setTab("snapshot");
  }, []);

  const pullBridge = useCallback(async () => {
    if (!bridgeUrl) {
      setStatus("No bridgeUrl. Add /api/next-devkit or paste CLI output.");
      return;
    }
    setStatus("Pulling next-browser\u2026");
    try {
      const payload = await pullFromBridge(bridgeUrl);
      if (payload.snapshot) setSnapshot(payload.snapshot);
      if (payload.tree) setTree(payload.tree);
      if (payload.errors) setErrors((prev) => [...(payload.errors ?? []), ...prev]);
      if (payload.logs) setLogs((prev) => [...(payload.logs ?? []), ...prev]);
      setStatus("Bridge updated snapshot / tree / errors / logs");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Bridge failed");
    }
  }, [bridgeUrl]);

  const applyPaste = useCallback(() => {
    const text = paste.trim();
    if (!text) return;
    if (/\[ref=/.test(text) || /^\s*- /.test(text)) {
      setSnapshot(parseSnapshot(text));
      setTab("snapshot");
      setStatus("Parsed next-browser snapshot");
      return;
    }
    if (/^\d+\s+\d+/.test(text)) {
      setTree(parseReactTree(text));
      setTab("tree");
      setStatus("Parsed next-browser tree");
      return;
    }
    setStatus("Could not detect snapshot vs tree format");
  }, [paste]);

  const onNode = useCallback(
    (node: DevTreeNode) => {
      if (node.ref) {
        highlightRef(node.ref);
        onSelectRef?.(node.ref, node);
      }
    },
    [onSelectRef],
  );

  const payload = useMemo<DevKitPayload>(
    () => ({ snapshot, tree, errors, logs }),
    [snapshot, tree, errors, logs],
  );

  return (
    <div className={["nadk-root", className].filter(Boolean).join(" ")} data-nadk-root>
      <Button className="nadk-fab" aria-label="Open Next Aria DevKit" onPress={() => setOpen(true)}>
        \u2318
        {errors.length ? <span className="nadk-badge">{errors.length}</span> : null}
      </Button>

      <ModalOverlay className="nadk-overlay" isOpen={open} onOpenChange={setOpen} isDismissable>
        <Modal>
          <Dialog className="nadk-panel" data-side={placement} aria-label="Next Aria DevKit">
            <div className="nadk-header">
              <div>
                <div className="nadk-title">Next Aria DevKit</div>
                <div className="nadk-sub">{status} \u00b7 Alt+Shift+D</div>
              </div>
              <div className="nadk-grow" />
              <Button className="nadk-icon-btn" onPress={captureLive}>Live</Button>
              <Button className="nadk-icon-btn" onPress={pullBridge}>Bridge</Button>
              <Button className="nadk-icon-btn" onPress={() => setOpen(false)}>Close</Button>
            </div>

            <Tabs className="nadk-tabs" selectedKey={tab} onSelectionChange={(key) => setTab(key as DevKitTab)}>
              <TabList className="nadk-tablist" aria-label="Inspector sections">
                <Tab id="snapshot" className="nadk-tab">
                  Snapshot <span className="nadk-count">{payload.snapshot.length}</span>
                </Tab>
                <Tab id="tree" className="nadk-tab">
                  Tree <span className="nadk-count">{payload.tree.length}</span>
                </Tab>
                <Tab id="errors" className="nadk-tab">
                  Errors <span className="nadk-count">{payload.errors.length}</span>
                </Tab>
                <Tab id="logs" className="nadk-tab">
                  Logs <span className="nadk-count">{payload.logs.length}</span>
                </Tab>
              </TabList>

              <TabPanel id="snapshot" className="nadk-panel-body">
                <div className="nadk-toolbar">
                  <textarea
                    className="nadk-textarea"
                    placeholder="Paste `next-browser snapshot` output\u2026"
                    value={paste}
                    onChange={(e) => setPaste(e.target.value)}
                  />
                  <Button className="nadk-icon-btn" onPress={applyPaste}>Parse paste</Button>
                </div>
                <NavigationTreeView items={snapshot} ariaLabel="Accessibility snapshot" onAction={onNode} />
              </TabPanel>

              <TabPanel id="tree" className="nadk-panel-body">
                <NavigationTreeView items={tree} ariaLabel="React component tree" />
              </TabPanel>

              <TabPanel id="errors" className="nadk-panel-body">
                {!errors.length ? <div className="nadk-empty">No runtime errors captured yet.</div> : null}
                {errors.map((err) => (
                  <article key={err.id} className="nadk-err nadk-log" data-level="error">
                    <div className="nadk-log-top">
                      <strong>{err.title}</strong>
                      <span>{formatTime(err.timestamp)}</span>
                      {err.source ? <span>{err.source}</span> : null}
                    </div>
                    {err.stack ? <pre>{err.stack}</pre> : <pre>{err.message}</pre>}
                  </article>
                ))}
              </TabPanel>

              <TabPanel id="logs" className="nadk-panel-body">
                {!logs.length ? <div className="nadk-empty">Interact with the page to capture console output.</div> : null}
                {logs.map((log) => (
                  <article key={log.id} className="nadk-log" data-level={log.level}>
                    <div className="nadk-log-top">
                      <strong>{log.level}</strong>
                      <span>{formatTime(log.timestamp)}</span>
                    </div>
                    <pre>{log.message}</pre>
                  </article>
                ))}
              </TabPanel>
            </Tabs>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </div>
  );
}
