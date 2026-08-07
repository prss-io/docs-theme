import React from "react";
import * as PRSS from "@prss/ui";
import { ContentRenderer } from "@prss/ui";

import DocsLayout from "@/components/DocsLayout";

const Post = (data: any) => {
  PRSS.init(data);
  (window as any).PRSS = PRSS;

  const item = PRSS.getProp("item") as any;
  const { content, title, createdAt } = item;
  const featuredImageUrl = (item.vars || {}).featuredImageUrl;

  return (
    <DocsLayout className="page-post" title={title} showSidebar={false} showToc={false}>
      {createdAt && (
        <div className="docs-post-date">Published on {PRSS.formattedDate(createdAt)}</div>
      )}
      {featuredImageUrl && (
        <div className="docs-post-hero">
          <img src={featuredImageUrl} alt={title} />
        </div>
      )}
      <ContentRenderer content={content} className="docs-prose" />
    </DocsLayout>
  );
};

export default Post;
