import React from "react";
import * as PRSS from "@prss/ui";
import { ContentRenderer } from "@prss/ui";

import DocsLayout from "@/components/DocsLayout";
import { ancestorTitles, stripLeadingTitleEcho } from "@/lib/titleEcho";

const Docs = (data: any) => {
  PRSS.init(data);
  (window as any).PRSS = PRSS;

  const { content, title, uuid } = PRSS.getProp("item") as any;
  const vars = (PRSS.getProp("vars") as any) || {};

  const body = stripLeadingTitleEcho(content, [title, ...ancestorTitles(uuid)]);

  return (
    <DocsLayout className="page-docs" title={title}>
      <ContentRenderer content={body} className="docs-prose" />
      {vars.editBaseUrl && (
        <div className="docs-page-meta">
          <a
            className="docs-edit-link"
            href={`${vars.editBaseUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Edit this page
          </a>
        </div>
      )}
    </DocsLayout>
  );
};

export default Docs;
