import React from "react";
import * as PRSS from "@prss/ui";
import { ContentRenderer } from "@prss/ui";

import DocsLayout from "@/components/DocsLayout";

const Home = (data: any) => {
  PRSS.init(data);
  (window as any).PRSS = PRSS;

  const { content, title } = PRSS.getProp("item") as any;
  const site = (PRSS.getProp("site") as any) || {};
  const vars = (PRSS.getProp("vars") as any) || {};

  const heroTitle = vars.heroTitle || title || site.title;
  const heroMessage = vars.heroMessage || vars.tagline;
  const hasPrimary = vars.heroPrimaryText && vars.heroPrimaryUrl;
  const hasSecondary = vars.heroSecondaryText && vars.heroSecondaryUrl;
  const hasActions = hasPrimary || hasSecondary;

  return (
    <DocsLayout className="page-home" showSidebar={false} showToc={false}>
      <section className={"docs-hero" + (vars.heroImageUrl ? " has-image" : "")}>
        <div className="docs-hero-body">
          <h1 className="docs-hero-title">{heroTitle}</h1>
          {heroMessage && <p className="docs-hero-tagline">{heroMessage}</p>}
          {hasActions && (
            <div className="docs-hero-actions">
              {hasPrimary && (
                <a className="docs-hero-btn is-primary" href={vars.heroPrimaryUrl}>
                  {vars.heroPrimaryText}
                </a>
              )}
              {hasSecondary && (
                <a className="docs-hero-btn is-secondary" href={vars.heroSecondaryUrl}>
                  {vars.heroSecondaryText}
                </a>
              )}
            </div>
          )}
        </div>
        {vars.heroImageUrl && (
          <div className="docs-hero-media">
            <img src={vars.heroImageUrl} alt="" />
          </div>
        )}
      </section>
      <ContentRenderer content={content} className="docs-prose" />
    </DocsLayout>
  );
};

export default Home;
