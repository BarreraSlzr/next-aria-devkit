"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Dialog, Modal, ModalOverlay, Tab, TabList, TabPanel, Tabs } from "react-aria-components";
import { fetchDaemonStatus, inspectComponent, pullFromBridge } from "../bridge";
import { captureLiveSnapshot, highlightRef, installLogProbe, SAMPLE_SNAPSHOT, SAMPLE_TREE, SAMPLE_TREE_DETAIL } from "../live";
import { componentIdFromNode, parseReactTree, parseSnapshot, parseTreeDetail } from "../parse";
import type { ComponentInspect, DaemonStatus, DevErrorEntry, DevKitPayload, DevKitTab, DevLogEntry, DevTreeNode, NextDevKitProps } from "../types";
import { InspectorPane } from "./Inspector";
import { NavigationTreeView } from "./NavigationTree";
import { StatusChip } from "./StatusChip";

const DEFAULT_SHORTCUT = { alt: true, shift: true, key: "d" };

function isDevEnabled(explicit) {
  if (explicit != null) return explicit;
  return process.env.NODE_ENV === "development";
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString();
}

export function NextDevKit(props) {
  if (!isDevEnabled(props.enabled)) return null;
  return <NextDevKitClient {...props} />;
}

function NextDevKitClient({
  defaultTab = "snapshot",
  shortcut = DEFAULT_SHORTCUT,
  bridgeUrl = process.env.NEXT_PUBLIC_NADK_BRIDGE_URL || undefined,
  initialPayload,
  onSelectRef,
  placement = "right",
  className,
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(defaultTab);
  const [snapshot, setSnapshot] = useState(() => initialPayload?.snapshot ?? parseSnapshot(SAMPLE_SNAPSHOT));
  const [tree, setTree] = useState(() => initialPayload?.tree ?? parseReactTree(SAMPLE_TREE));
  const [errors, setErrors] = useState(() => initialPayload?.errors ?? []);
  const [logs, setLogs] = useState(() => initialPayload?.logs ?? []);
  const [paste, setPaste] = useState("");
  const [status, setStatus] = useState("Ready");
  const [inspect, setInspect] = useState(() => parseTreeDetail(SAMPLE_TREE_DETAIL));
  const [inspectError, setInspectError] = useState(null);
  const [inspectPending, setInspectPending] = useState(false);
  const [daemon, setDaemon] = useState({ ok: false, state: bridgeUrl ? "unknown" : "missing-bridge" });

  useEffect(() => installLogProbe(
    (entry) => setLogs((prev) => [entry, ...prev].slice(0, 200)),
    (entry) => setErrors((prev) => [entry, ...prev].slice(0, 100)),
  ), []);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (event) => {
      if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) return;
      if (Boolean(shortcut.alt) !== event.altKey) return;
      if (Boolean(shortcut.shift) !== event.shiftKey) return;
      if (Boolean(shortcut.meta) !== event.metaKey) return;
      event.preventDefault();
      setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);

  const refreshDaemon = useCallback(async () => {
    if (!bridgeUrl) {
      setDaemon({ ok: false, state: "missing-bridge", hint: "Export GET from @internetfriends/next-aria-devkit/route" });
      return;
    }
    setDaemon(await fetchDaemonStatus(bridgeUrl));
  }, [bridgeUrl]);

  useEffect(() => {
    refreshDaemon();
    const id = window.setInterval(refreshDaemon, 8000);
    return () => window.clearInterval(id);
  }, [refreshDaemon]);

  const captureLive = useCallback(() => {
    const nodes = captureLiveSnapshot();
    setSnapshot(nodes);
    setStatus(`Live snapshot · ${nodes.length} top-level nodes`);
    setTab("snapshot");
  }, []);

  const pullBridge = useCallback(async () => {
    if (!bridgeUrl) {
      setStatus("No bridgeUrl. Add /api/next-devkit or paste CLI output.");
      return;
    }
    setStatus("Pulling next-browser…");
    try {
      const payload = await pullFromBridge(bridgeUrl);
      if (payload.snapshot) setSnapshot(payload.snapshot);
      if (payload.tree) setTree(payload.tree);
      if (payload.errors) setErrors((prev) => [...(payload.errors ?? []), ...prev]);
      if (payload.logs) setLogs((prev) => [...(payload.logs ?? []), ...prev]);
      setStatus("Bridge updated snapshot / tree / errors / logs");
      refreshDaemon();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Bridge failed");
    }
  }, [bridgeUrl, refreshDaemon]);

  const applyPaste = useCallback(() => {
    const text = paste.trim();
    if (!text) return;
    if (/\[ref=/.test(text) || /^\s*- /.test(text)) {
      setSnapshot(parseSnapshot(text));
      setTab("snapshot");
      setStatus("Parsed snapshot");
      return;
    }
    if (/^path:/m.test(text) || /^hooks:/m.test(text)) {
      setInspect(parseTreeDetail(text));
      setTab("tree");
      setStatus("Parsed tree <id>");
      return;
    }
    if (/^\d+\s+\d+/.test(text)) {
      setTree(parseReactTree(text));
      setTab("tree");
      setStatus("Parsed tree");
      return;
    }
    setStatus("Could not detect format");
  }, [paste]);

  const onSnapshotNode = useCallback((node) => {
    if (node.ref) {
      highlightRef(node.ref);
      onSelectRef?.(node.ref, node);
    }
  }, [onSelectRef]);

  const onTreeNode = useCallback(async (node) => {
    const id = componentIdFromNode(node);
    if (!id) return;
    if (!bridgeUrl) {
      setInspect({ id, name: node.title, props: { note: "No bridgeUrl" }, hooks: [], raw: `${node.title} #${id}` });
      setInspectError(null);
      return;
    }
    setInspectPending(true);
    setInspectError(null);
    const result = await inspectComponent(bridgeUrl, id);
    setInspectPending(false);
    if ("error" in result && !("props" in result)) {
      setInspectError(result.error);
      return;
    }
    setInspect(result);
    setStatus(`Inspected ${id}`);
  }, [bridgeUrl]);

  const payload = useMemo(() => ({ snapshot, tree, errors, logs }), [snapshot, tree, errors, logs]);

  return (
    <div className={["nadk-root", className].filter(Boolean).join(" ")} data-nadk-root>
      <Button className="nadk-fab" aria-label="Open Next Aria DevKit" onPress={() => setOpen(true)}>
        \u2318
        <span className="nadk-fab-chip"><StatusChip status={daemon} /></span>
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
              <StatusChip status={daemon} />
              <div className="nadk-grow" />
              <Button className="nadk-icon-btn" onPress={refreshDaemon}>Ping</Button>
              <Button className="nadk-icon-btn" onPress={captureLive}>Live</Button>
              <Button className="nadk-icon-btn" onPress={pullBridge}>Bridge</Button>
              <Button className="nadk-icon-btn" onPress={() => setOpen(false)}>Close</Button>
            </div>
            <Tabs className="nadk-tabs" selectedKey={tab} onSelectionChange={(key) => setTab(key)}>
              <TabList className="nadk-tablist" aria-label="Inspector sections">
                <Tab id="snapshot" className="nadk-tab">Snapshot <span className="nadk-count">{payload.snapshot.length}</span></Tab>
                <Tab id="tree" className="nadk-tab">Tree <span className="nadk-count">{payload.tree.length}</span></Tab>
                <Tab id="errors" className="nadk-tab">Errors <span className="nadk-count">{payload.errors.length}</span></Tab>
                <Tab id="logs" className="nadk-tab">Logs <span className="nadk-count">{payload.logs.length}</span></Tab>
              </TabList>
              <TabPanel id="snapshot" className="nadk-panel-body">
                <div className="nadk-toolbar">
                  <textarea className="nadk-textarea" placeholder="Paste next-browser snapshot or tree <id>…" value={paste} onChange={(e) => setPaste(e.target.value)} />
                  <Button className="nadk-icon-btn" onPress={applyPaste}>Parse paste</Button>
                </div>
                <NavigationTreeView items={snapshot} ariaLabel="Accessibility snapshot" onAction={onSnapshotNode} />
              </TabPanel>
              <TabPanel id="tree" className="nadk-panel-body">
                <div className="nadk-split">
                  <div className="nadk-split-tree">
                    <NavigationTreeView items={tree} ariaLabel="React component tree" onAction={onTreeNode} />
                  </div>
                  <div className="nadk-split-handle" />
                  <InspectorPane inspect={inspect} pending={inspectPending} error={inspectError} />
                </div>
              </TabPanel>
              <TabPanel id="errors" className="nadk-panel-body">
                {!errors.length ? <div className="nadk-empty">No runtime errors captured yet.</div> : null}
                {errors.map((err) => (
                  <article key={err.id} className="nadk-err nadk-log" data-level="error">
                    <div className="nadk-log-top"><strong>{err.title}</strong><span>{formatTime(err.timestamp)}</span></div>
                    <pre>{err.stack || err.message}</pre>
                  </article>
                ))}
              </TabPanel>
              <TabPanel id="logs" className="nadk-panel-body">
                {!logs.length ? <div className="nadk-empty">Interact with the page to capture console output.</div> : null}
                {logs.map((log) => (
                  <article key={log.id} className="nadk-log" data-level={log.level}>
                    <div className="nadk-log-top"><strong>{log.level}</strong><span>{formatTime(log.timestamp)}</span></div>
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
