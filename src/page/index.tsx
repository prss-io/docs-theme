import React from "react";
import * as PRSS from "@prss/ui";
import { ContentRenderer } from "@prss/ui";

import DocsLayout from "@/components/DocsLayout";

const Page = (data: any) => {
  PRSS.init(data);
  (window as any).PRSS = PRSS;

  const { content, title } = PRSS.getProp("item") as any;

  return (
    <DocsLayout className="page-single" title={title} showSidebar={false} showToc={false}>
      <ContentRenderer content={content} className="docs-prose" />
    </DocsLayout>
  );
};

export default Page;
