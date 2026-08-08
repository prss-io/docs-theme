import React from "react";
import * as PRSS from "@prss/ui";
import { ContentRenderer } from "@prss/ui";

import DocsLayout from "@/components/DocsLayout";
import { ancestorTitles, stripLeadingTitleEcho } from "@/lib/titleEcho";

const Page = (data: any) => {
  PRSS.init(data);
  (window as any).PRSS = PRSS;

  const { content, title, uuid } = PRSS.getProp("item") as any;

  const body = stripLeadingTitleEcho(content, [title, ...ancestorTitles(uuid)]);

  return (
    <DocsLayout className="page-single" title={title} showSidebar={false} showToc={false}>
      <ContentRenderer content={body} className="docs-prose" />
    </DocsLayout>
  );
};

export default Page;
