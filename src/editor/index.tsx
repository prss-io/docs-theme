import React from "react";
import * as PRSS from "@prss/ui";
import { ContentRenderer } from "@prss/ui";

import DocsLayout from "@/components/DocsLayout";

/** The node holding this one, so leaving does not depend on browser history. */
const parentOf = (uuid: string): string | null => {
  const site = (PRSS.getProp("site") as any) || {};
  const nodes: any[] = Array.isArray(site.structure) ? site.structure : [];
  let found: string | null = null;

  const walk = (node: any) => {
    if (!node || found) return;
    (node.children || []).forEach((child: any) => {
      if (child.key === uuid) found = node.key;
      else walk(child);
    });
  };

  nodes.forEach(walk);
  return found;
};

/**
 * A page that hands the viewport to an embedded tool.
 *
 * Sandboxes (CodeSandbox, StackBlitz, and friends) are dark and want room, so
 * this drops the sidebar and table of contents, pins the theme dark so a light
 * shell does not frame a dark editor, and lets the embed fill the screen. It
 * also offers a way back, which a normal page gets from the sidebar.
 */
const Editor = (data: any) => {
  PRSS.init(data);
  (window as any).PRSS = PRSS;

  const item = PRSS.getProp("item") as any;
  const { content, title, uuid } = item;

  const parentKey = parentOf(uuid);
  const fallback = parentKey ? (PRSS.getItem(parentKey) as any)?.url : null;

  return (
    <DocsLayout
      className="page-editor"
      showSidebar={false}
      showToc={false}
      lockTheme="dark"
    >
      <div className="docs-editor">
        <div className="docs-editor-bar">
          <a
            className="docs-editor-back"
            href={fallback || PRSS.getPathUrl("")}
            data-docs-back
          >
            <span aria-hidden="true">←</span> Go back
          </a>
          <h1 className="docs-editor-title">{title}</h1>
          {/* Filled by client.js once it can see which sandbox was embedded. */}
          <div className="docs-editor-actions" data-editor-actions />
        </div>
        <ContentRenderer content={content} className="docs-editor-stage" />
      </div>
    </DocsLayout>
  );
};

export default Editor;
