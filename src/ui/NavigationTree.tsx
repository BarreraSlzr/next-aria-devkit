"use client";

import {
  Button,
  Collection,
  Tree,
  TreeItem,
  TreeItemContent,
} from "react-aria-components";
import type { DevTreeNode } from "../types";

export function NavigationTreeView({
  items,
  ariaLabel,
  onAction,
}: {
  items: DevTreeNode[];
  ariaLabel: string;
  onAction?: (node: DevTreeNode) => void;
}) {
  if (!items.length) {
    return <div className="nadk-empty">Nothing to show yet. Capture live page or paste next-browser output.</div>;
  }

  const byId = new Map<string, DevTreeNode>();
  const index = (nodes: DevTreeNode[]) => {
    for (const n of nodes) {
      byId.set(n.id, n);
      if (n.children?.length) index(n.children);
    }
  };
  index(items);

  return (
    <Tree
      className="nadk-tree"
      aria-label={ariaLabel}
      items={items}
      onAction={(key) => {
        const node = byId.get(String(key));
        if (node) onAction?.(node);
      }}
    >
      {function renderItem(item: DevTreeNode) {
        return (
          <TreeItem
            id={item.id}
            textValue={item.title}
            className="nadk-row"
            href={item.href}
          >
            <TreeItemContent>
              {({ isExpanded, hasChildItems }) => (
                <div className="nadk-tree-item">
                  {hasChildItems ? (
                    <Button slot="chevron" className="nadk-chevron" data-expanded={isExpanded || undefined}>
                      ▸
                    </Button>
                  ) : (
                    <span className="nadk-chevron">·</span>
                  )}
                  <span className="nadk-kind">{item.kind ?? "node"}</span>
                  <span>{item.title}</span>
                  {item.meta ? <span className="nadk-meta">{item.meta}</span> : null}
                </div>
              )}
            </TreeItemContent>
            {item.children?.length ? (
              <Collection items={item.children}>{renderItem}</Collection>
            ) : null}
          </TreeItem>
        );
      }}
    </Tree>
  );
}
