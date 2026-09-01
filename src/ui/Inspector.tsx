"use client";

import type { ComponentInspect } from "../types";

export function InspectorPane({
  inspect,
  pending,
  error,
}: {
  inspect: ComponentInspect | null;
  pending?: boolean;
  error?: string | null;
}) {
  if (pending) return <div className="nadk-empty">Inspecting component…</div>;
  if (error) return <div className="nadk-empty">{error}</div>;
  if (!inspect) {
    return (
      <div className="nadk-empty">
        Select a tree node to run <code>next-browser tree &lt;id&gt;</code> and inspect props / hooks / source.
      </div>
    );
  }
  const propEntries = Object.entries(inspect.props);
  return (
    <div className="nadk-inspect">
      <div className="nadk-inspect-head">
        <strong>{inspect.name}</strong>
        {inspect.id ? <span className="nadk-meta">#{inspect.id}</span> : null}
      </div>
      {inspect.path ? <div className="nadk-inspect-path">{inspect.path}</div> : null}
      {inspect.source ? <div className="nadk-inspect-source">{inspect.source}</div> : null}
      <h4>Props</h4>
      {propEntries.length ? (
        <dl className="nadk-kv">
          {propEntries.map(([key, value]) => (
            <div key={key} className="nadk-kv-row">
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="nadk-empty">No props parsed.</div>
      )}
      <h4>Hooks</h4>
      {inspect.hooks.length ? (
        <dl className="nadk-kv">
          {inspect.hooks.map((hook) => (
            <div key={hook.name} className="nadk-kv-row">
              <dt>{hook.name}</dt>
              <dd>{hook.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="nadk-empty">No hooks parsed.</div>
      )}
      <details className="nadk-raw">
        <summary>Raw tree &lt;id&gt;</summary>
        <pre>{inspect.raw}</pre>
      </details>
    </div>
  );
}
