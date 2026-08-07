import React from "react";
import * as PRSS from "@prss/ui";
import { ContentRenderer } from "@prss/ui";

import DocsLayout from "@/components/DocsLayout";

const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(" ");

const excerptOf = (post: any): string => {
  const v = post.vars || {};
  if (v.excerpt) return v.excerpt;
  return PRSS.truncateString(PRSS.stripTags(post.content || ""), 140);
};

const Blog = (data: any) => {
  PRSS.init(data);
  (window as any).PRSS = PRSS;

  const { content, title } = PRSS.getProp("item") as any;
  const vars = (PRSS.getProp("vars") as any) || {};
  const rootPath = (PRSS.getProp("rootPath") as string) || "../";

  // PRSS paginates blog listings (10/page) and injects the current page's slice
  // plus page info. Fall back to all posts when there's only one page.
  // The paginated slice holds RAW items (no computed `url`), so map each back to
  // its getItems() counterpart which carries the structure-resolved url.
  const enriched = (PRSS.getItems("post", true) as any[]) || [];
  const enrichedByUuid = new Map(enriched.map((p) => [p.uuid, p]));
  const pagePosts = Array.isArray(vars.blogPosts) ? vars.blogPosts : null;
  const items = (pagePosts || enriched).map((p: any) => enrichedByUuid.get(p.uuid) || p);
  const currentPage = Number(vars.currentPage) || 1;
  const totalPages = Number(vars.totalPages) || 1;
  // Links are authored at the base listing depth (rootPath). PRSS rewrites
  // relative refs by one level when it emits the deeper /blog/N/ pages.
  const pageUrl = (n: number) => `${rootPath}blog/${n > 1 ? `${n}/` : ""}`;

  return (
    <DocsLayout className="page-blog" title={title} showSidebar={false} showToc={false}>
      {content && <ContentRenderer content={content} className="docs-prose" />}
      <div className="docs-post-grid">
        {items.map((post) => {
          const img = (post.vars || {}).featuredImageUrl;
          return (
            <a key={post.uuid} href={post.url} className="docs-post-card">
              {img && (
                <div className="docs-post-media">
                  <img src={img} alt={post.title} loading="lazy" />
                </div>
              )}
              <div className="docs-post-card-body">
                <h3 className="docs-post-card-title">{post.title}</h3>
                <p className="docs-post-card-excerpt">{excerptOf(post)}</p>
                {post.createdAt && (
                  <span className="docs-post-card-date">{PRSS.formattedDate(post.createdAt)}</span>
                )}
              </div>
            </a>
          );
        })}
      </div>

      {totalPages > 1 && (
        <nav className="docs-blog-pagination" aria-label="Blog pages">
          <a
            className={cx("docs-blog-page", "docs-blog-page-nav", currentPage <= 1 && "is-disabled")}
            href={currentPage > 1 ? pageUrl(currentPage - 1) : undefined}
            rel="prev"
            aria-disabled={currentPage <= 1 ? "true" : undefined}
          >
            ← Prev
          </a>
          <div className="docs-blog-page-nums">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <a
                key={n}
                href={pageUrl(n)}
                className={cx("docs-blog-page", n === currentPage && "is-current")}
                aria-current={n === currentPage ? "page" : undefined}
              >
                {n}
              </a>
            ))}
          </div>
          <a
            className={cx("docs-blog-page", "docs-blog-page-nav", currentPage >= totalPages && "is-disabled")}
            href={currentPage < totalPages ? pageUrl(currentPage + 1) : undefined}
            rel="next"
            aria-disabled={currentPage >= totalPages ? "true" : undefined}
          >
            Next →
          </a>
        </nav>
      )}
    </DocsLayout>
  );
};

export default Blog;
