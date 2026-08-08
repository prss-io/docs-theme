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
 * A page that puts a live thing on show.
 *
 * The demo itself is the page's own content — a running widget, a playground,
 * whatever the project wants people to touch — so this template never replaces
 * it. It gives it a stage instead: the sidebar and contents step aside, the demo
 * sits on a framed surface, and the switchers around it read as a toolbar and a
 * browsable set rather than a wall of links.
 *
 * `vars.embedUrl` stays supported for demos that live on another site.
 */
const Demo = (data: any) => {
  PRSS.init(data);
  (window as any).PRSS = PRSS;

  const item = PRSS.getProp("item") as any;
  const { content, title, uuid } = item;
  const vars = (PRSS.getProp("vars") as any) || {};

  const parentKey = parentOf(uuid);
  const parent = parentKey ? ((PRSS.getItem(parentKey) as any) || null) : null;

  const embedUrl = vars.embedUrl;
  const embedHeight = parseInt(vars.embedHeight, 10) || 640;

  return (
    <DocsLayout className="page-demo" showSidebar={false} showToc={false}>
      <header className="docs-demo-head">
        <a className="docs-demo-back" href={parent?.url || PRSS.getPathUrl("")}>
          <span aria-hidden="true">←</span> {parent?.title || "Documentation"}
        </a>
        {/* Demos often relabel this heading as you switch between them. */}
        <div className="post-title-container">
          <h1 className="docs-demo-title">{title}</h1>
        </div>
      </header>

      {content && <ContentRenderer content={content} className="docs-prose docs-demo-body" />}
      {embedUrl && (
        <div className="docs-demo-frame" style={{ height: embedHeight + "px" }}>
          <iframe
            src={embedUrl}
            title={vars.embedTitle || title}
            loading="lazy"
            allow="clipboard-write; fullscreen"
          />
        </div>
      )}
    </DocsLayout>
  );
};

export default Demo;
