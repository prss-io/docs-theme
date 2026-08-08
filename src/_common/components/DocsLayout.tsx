import "@/styles/theme.css";

import React, { ReactNode } from "react";
import * as PRSS from "@prss/ui";
import { Menu } from "@prss/ui";

const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

interface DocsLayoutProps {
  className?: string;
  title?: string;
  showToc?: boolean;
  showSidebar?: boolean;
  /** Drop the right rail entirely, ads included, for pages that need the width. */
  showAside?: boolean;
  /** Pin the colour theme, for pages whose content only reads one way. */
  lockTheme?: "dark" | "light";
  children: ReactNode;
}

const isNodeActive = (node: any, currentId: string): boolean => {
  if (!node) return false;
  if (node.isActive) return true;
  if (node.key && node.key === currentId) return true;
  return Array.isArray(node.children) && node.children.some((c: any) => isNodeActive(c, currentId));
};

const DocsLayout = ({
  className,
  title,
  showToc = true,
  showSidebar = true,
  showAside = true,
  lockTheme,
  children
}: DocsLayoutProps) => {
  const vars = (PRSS.getProp("vars") as any) || {};
  const site = (PRSS.getProp("site") as any) || {};
  const item = (PRSS.getProp("item") as any) || {};
  const currentId = item.uuid;
  const rootPath = (PRSS.getProp("rootPath") as string) || "";

  const { logoImageUrl, sidebarMenu, headerMenu, githubUrl, footerLeft, footerRight, warningHtml, contentFooterHtml, footerCta } = vars;
  // Ad / sponsor slot (compatible with slate/press/landing var names).
  const asideAd = showAside ? (vars.asideHtml || vars.sidebarAsideHtml) : null;
  // The right rail carries the TOC (docs pages) and/or the ad. Pages with neither
  // collapse it via client.js (.rail-empty) so nothing looks barren.
  const showRail = showToc || !!asideAd;

  // Auto sidebar: derive navigation from the site structure so authors never
  // hand-build a menu. `sidebarMenu` (a named menu) stays as an explicit override.
  const structure: any[] = Array.isArray(site.structure) ? site.structure : [];
  const structureRoot = structure[0]; // the home node

  const nodeContains = (node: any, id: string): boolean =>
    !!node && (node.key === id || (node.children || []).some((c: any) => nodeContains(c, id)));

  const isLandingSection = (node: any) => {
    const t = ((PRSS.getItem(node.key) as any) || {}).template;
    return t === "blog" || t === "showcase";
  };

  // Reusable blocks/assets (components, cards, block items) live in the structure
  // but are not navigable pages — keep them out of the sidebar.
  const NON_NAV_TEMPLATES = ["component", "card", "hero", "gallery", "code-block", "accordion", "timeline", "link-list"];
  const isNavigable = (node: any) => !NON_NAV_TEMPLATES.includes(((PRSS.getItem(node.key) as any) || {}).template);
  const pruneNav = (nodes: any[]): any[] =>
    (nodes || []).filter(isNavigable).map((n: any) => ({ ...n, children: pruneNav(n.children || []) }));

  // The top-level structure section containing the current page (a real
  // multi-page docs product). Drives both the sidebar
  // sub-nav and a section header so readers always know which docs they're in.
  const sidebarSection =
    structureRoot && Array.isArray(structureRoot.children)
      ? structureRoot.children.find((c: any) => nodeContains(c, currentId))
      : null;

  const autoSidebarNodes: any[] = (() => {
    if (!structureRoot || !Array.isArray(structureRoot.children)) return [];
    const topLevel = structureRoot.children.filter((c: any) => isNavigable(c) && !isLandingSection(c));
    // Inside a real multi-page section → show that section's own sub-nav.
    if (sidebarSection && (sidebarSection.children || []).length) return pruneNav(sidebarSection.children);
    // Flat docs set (no top-level sections) → list the pages. A standalone
    // top-level page in a sectioned site gets NO sidebar.
    const isFlatDocs = topLevel.every((n: any) => !(n.children || []).length);
    return isFlatDocs ? pruneNav(topLevel) : [];
  })();

  const useNamedMenu = !!sidebarMenu;
  const hasSidebar = showSidebar && (useNamedMenu || autoSidebarNodes.length > 0);
  const sidebarSectionPost = sidebarSection ? ((PRSS.getItem(sidebarSection.key) as any) || {}) : null;
  const sidebarSectionTitle = sidebarSection ? sidebarSection.title || sidebarSectionPost?.title || "" : "";

  // Flattened leaf pages (sidebar order) for auto previous/next.
  const flatLeaves: any[] = [];
  const collectLeaves = (nodes: any[]) =>
    (nodes || []).forEach((n) => {
      const kids = n.children || [];
      if (kids.length) collectLeaves(kids);
      else flatLeaves.push(n);
    });
  collectLeaves(autoSidebarNodes);
  const curLeafIdx = flatLeaves.findIndex((n) => n.key === currentId);
  const prevLeaf = curLeafIdx > 0 ? flatLeaves[curLeafIdx - 1] : null;
  const nextLeaf =
    curLeafIdx >= 0 && curLeafIdx < flatLeaves.length - 1 ? flatLeaves[curLeafIdx + 1] : null;

  const renderNavNode = (node: any, recurse: any) => {
    const post = (PRSS.getItem(node.key) as any) || {};
    const title = node.title || post.title || "";
    const url = post.url;
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const active = node.key === currentId;

    // Nodes with children are sidebar sections (group heading + links). When the
    // section is itself a real page, the heading is a link so it's reachable.
    if (hasChildren) {
      return (
        <li key={node.key} className={cx("docs-nav-group", isNodeActive(node, currentId) && "is-open")}>
          {url ? (
            <a href={url} className={cx("docs-nav-group-label", active && "is-active")}>{title}</a>
          ) : (
            <span className="docs-nav-group-label">{title}</span>
          )}
          <ul className="docs-nav-sublist">{node.children.map(recurse)}</ul>
        </li>
      );
    }

    return (
      <li key={node.key} className={cx("docs-nav-item", active && "is-active")}>
        <a href={url}>{title}</a>
      </li>
    );
  };

  const renderAuto = (node: any) => renderNavNode(node, renderAuto);

  const renderAutoPrevNext = (node: any, rel: "prev" | "next") => {
    const post = (PRSS.getItem(node.key) as any) || {};
    return (
      <a
        href={post.url}
        className={cx("docs-pagination-link", rel === "next" ? "is-next" : "is-prev")}
      >
        <span className="docs-pagination-dir">{rel === "next" ? "Next" : "Previous"}</span>
        <span className="docs-pagination-title">{post.title}</span>
      </a>
    );
  };

  const renderPrevNext = (node: any) => (
    <a
      key={node.id}
      href={node.url}
      className={cx("docs-pagination-link", node.rel === "next" ? "is-next" : "is-prev")}
    >
      <span className="docs-pagination-dir">{node.rel === "next" ? "Next" : "Previous"}</span>
      <span className="docs-pagination-title">{node.title}</span>
    </a>
  );

  return (
    <div
      className={cx("docs-theme", className)}
      data-theme={lockTheme || "dark"}
      {...(lockTheme ? { "data-theme-locked": "" } : {})}
    >
      {/* Runs while the parser is still inside this element, so a reader whose
          preference is light never sees the dark default painted first. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{var r=document.currentScript.parentElement,s=localStorage.getItem('docs-theme');" +
            "if(!r.hasAttribute('data-theme-locked')&&(s==='light'||s==='dark'))r.setAttribute('data-theme',s)}catch(e){}",
        }}
      />
      <header className="docs-header">
        <div className="docs-header-inner">
          <div className="docs-header-left">
            {hasSidebar && (
              <button
                type="button"
                className="docs-icon-btn docs-sidebar-toggle"
                data-sidebar-toggle
                aria-label="Toggle navigation"
              >
                <span className="docs-hamburger" />
              </button>
            )}
            <a className="docs-brand" href={rootPath || "/"}>
              {logoImageUrl ? (
                <img className="docs-logo" src={logoImageUrl} alt={site.title} />
              ) : (
                <span className="docs-brand-name">{site.title}</span>
              )}
            </a>
          </div>

          <nav className="docs-header-nav">
            {headerMenu && <Menu name={headerMenu} ulClassName="docs-header-menu" />}
          </nav>

          <div className="docs-header-right">
            <button
              type="button"
              className="docs-search-trigger"
              data-search-open
              aria-label="Search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <span className="docs-search-trigger-label">Search</span>
              <kbd className="docs-search-kbd">/</kbd>
            </button>
            {githubUrl && (
              <a
                className="docs-icon-btn"
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                title="GitHub"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </a>
            )}
            <button
              type="button"
              className="docs-icon-btn docs-theme-toggle"
              data-theme-toggle
              aria-label="Toggle color theme"
              title="Toggle theme"
              hidden={!!lockTheme}
            >
              <svg className="docs-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <svg className="docs-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Populated by client.js on open; kept out of the SSR payload so every
          page does not ship an empty result list. */}
      <div className="docs-search" data-search-dialog hidden>
        <div className="docs-search-backdrop" data-search-close />
        <div className="docs-search-panel" role="dialog" aria-modal="true" aria-label="Search">
          <div className="docs-search-field">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              className="docs-search-input"
              data-search-input
              placeholder={`Search ${site.title || "docs"}`}
              autoComplete="off"
              spellCheck={false}
              aria-label="Search"
            />
            <button type="button" className="docs-search-esc" data-search-close aria-label="Close">
              Esc
            </button>
          </div>
          <div className="docs-search-results" data-search-results />
        </div>
      </div>

      <div className={cx("docs-shell", !hasSidebar && "no-sidebar", !showRail && "no-toc")}>
        {hasSidebar && (
          <>
            <div className="docs-sidebar-backdrop" data-sidebar-backdrop />
            <aside className="docs-sidebar" data-sidebar>
              <div className="docs-sidebar-inner">
                {sidebarSectionTitle && (
                  sidebarSectionPost?.url ? (
                    <a className="docs-nav-section" href={sidebarSectionPost.url}>{sidebarSectionTitle}</a>
                  ) : (
                    <span className="docs-nav-section">{sidebarSectionTitle}</span>
                  )
                )}
                {useNamedMenu ? (
                  <Menu name={sidebarMenu} ulClassName="docs-nav" renderItem={renderNavNode} />
                ) : (
                  <ul className="page-menu docs-nav">{autoSidebarNodes.map(renderAuto)}</ul>
                )}
              </div>
            </aside>
          </>
        )}

        <main className="docs-main">
          <article className="docs-article" data-docs-content>
            {title && <h1 className="docs-page-title">{title}</h1>}
            {warningHtml && (
              <div className="docs-warning" dangerouslySetInnerHTML={{ __html: warningHtml }} />
            )}
            {children}
            {contentFooterHtml && (
              <div
                className="docs-content-footer"
                dangerouslySetInnerHTML={{ __html: contentFooterHtml }}
              />
            )}
          </article>

          {/* Narrow viewports have no rail; client.js relocates the ad node here
              (end of content, above the footer) instead of stranding it below. */}
          {asideAd && <div className="docs-aside-inline" data-aside-inline />}

          {hasSidebar && (useNamedMenu ? (
            <nav className="docs-pagination" aria-label="Docs pages">
              <Menu name={sidebarMenu} mode="prev-next" renderItem={renderPrevNext} />
            </nav>
          ) : (prevLeaf || nextLeaf) ? (
            <nav className="docs-pagination" aria-label="Docs pages">
              {prevLeaf ? renderAutoPrevNext(prevLeaf, "prev") : <span />}
              {nextLeaf && renderAutoPrevNext(nextLeaf, "next")}
            </nav>
          ) : null)}

          {footerCta && (
            <div className="docs-footer-cta" dangerouslySetInnerHTML={{ __html: footerCta }} />
          )}
          <footer className="docs-footer">
            <div className="docs-footer-left">
              {footerLeft ? (
                <div dangerouslySetInnerHTML={{ __html: footerLeft }} />
              ) : (
                <span>© {site.title}</span>
              )}
            </div>
            <div className="docs-footer-right">
              {footerRight ? (
                <div dangerouslySetInnerHTML={{ __html: footerRight }} />
              ) : (
                <a href="https://prss.io" target="_blank" rel="noopener noreferrer">
                  Built with PRSS
                </a>
              )}
            </div>
          </footer>
        </main>

        {showRail && (
          <aside className="docs-toc-rail">
            {showToc && (
              <div className="docs-toc" data-toc>
                <div className="docs-toc-title">On this page</div>
                <nav className="docs-toc-nav" data-toc-nav />
              </div>
            )}
            {asideAd && (
              <div className="docs-aside" dangerouslySetInnerHTML={{ __html: asideAd }} />
            )}
          </aside>
        )}
      </div>
    </div>
  );
};

export default DocsLayout;
