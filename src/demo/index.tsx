import React from "react";
import * as PRSS from "@prss/ui";
import { ContentRenderer } from "@prss/ui";

import DocsLayout from "@/components/DocsLayout";

const Demo = (data: any) => {
  PRSS.init(data);
  (window as any).PRSS = PRSS;

  const { content, title } = PRSS.getProp("item") as any;
  const vars = (PRSS.getProp("vars") as any) || {};

  const embedUrl = vars.embedUrl;
  const embedHeight = parseInt(vars.embedHeight, 10) || 640;

  return (
    <DocsLayout className="page-demo" title={title} showSidebar={false} showToc={false}>
      {content && <ContentRenderer content={content} className="docs-prose docs-demo-intro" />}
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
