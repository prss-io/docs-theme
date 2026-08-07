import React from "react";
import * as PRSS from "@prss/ui";
import { ContentRenderer } from "@prss/ui";

import DocsLayout from "@/components/DocsLayout";

const excerptOf = (item: any): string => {
  const v = item.vars || {};
  if (v.excerpt) return v.excerpt;
  return PRSS.truncateString(PRSS.stripTags(item.content || ""), 120);
};

// A section landing that renders its child pages as an automatic card grid —
// no hand-authored card HTML. Set a page's template to "showcase".
const Showcase = (data: any) => {
  PRSS.init(data);
  (window as any).PRSS = PRSS;

  const item = PRSS.getProp("item") as any;
  const { content, title, uuid } = item;
  const children = ((PRSS.getItemChildren(uuid) as any[]) || []).filter(Boolean);

  return (
    <DocsLayout className="page-showcase" title={title} showSidebar={false} showToc={false}>
      {content && <ContentRenderer content={content} className="docs-prose" />}
      <div className="docs-showcase-grid">
        {children.map((it) => {
          const v = it.vars || {};
          const img = v.featuredImageUrl || v.heroImageUrl;
          const badge = v.badge || v.tag;
          return (
            <a key={it.uuid} href={it.url} className="docs-showcase-card">
              {img && (
                <div className="docs-showcase-media">
                  <img src={img} alt={it.title} loading="lazy" />
                </div>
              )}
              <div className="docs-showcase-body">
                <div className="docs-showcase-head">
                  <h3 className="docs-showcase-title">{it.title}</h3>
                  {badge && <span className="docs-showcase-badge">{badge}</span>}
                </div>
                <p className="docs-showcase-excerpt">{excerptOf(it)}</p>
              </div>
            </a>
          );
        })}
      </div>
    </DocsLayout>
  );
};

export default Showcase;
