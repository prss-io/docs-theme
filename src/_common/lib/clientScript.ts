/* Client-side behavior for the PRSS Docs theme. Plain DOM, no framework. */

const ready = (fn: () => void) => {
  if (document.readyState !== "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

/* ---- Color theme toggle (persisted) ---- */
const initThemeToggle = () => {
  const root = document.querySelector<HTMLElement>(".docs-theme");
  if (!root) return;

  const stored = (() => {
    try {
      return localStorage.getItem("docs-theme");
    } catch {
      return null;
    }
  })();
  if (stored === "light" || stored === "dark") root.setAttribute("data-theme", stored);

  document.querySelectorAll<HTMLElement>("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("docs-theme", next);
      } catch {
        /* ignore */
      }
    });
  });
};

/* ---- Mobile sidebar ---- */
const initSidebar = () => {
  const root = document.querySelector<HTMLElement>(".docs-theme");
  if (!root) return;
  const open = () => root.classList.add("sidebar-open");
  const close = () => root.classList.remove("sidebar-open");

  document.querySelectorAll("[data-sidebar-toggle]").forEach((btn) => {
    btn.addEventListener("click", () =>
      root.classList.contains("sidebar-open") ? close() : open()
    );
  });
  document.querySelectorAll("[data-sidebar-backdrop]").forEach((el) => {
    el.addEventListener("click", close);
  });
  const sidebar = document.querySelector("[data-sidebar]");
  if (sidebar) {
    sidebar.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("a")) close();
    });
  }
};

/* ---- Copy buttons on code blocks ---- */
const initCodeCopy = () => {
  const blocks = document.querySelectorAll<HTMLElement>(".docs-prose pre");
  blocks.forEach((pre) => {
    if (pre.querySelector(".docs-copy-btn")) return;
    // PRSS code-block Blocks ship their own copy button — don't double up.
    if (pre.parentElement && pre.parentElement.querySelector(".code-block__copy-button")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "docs-copy-btn";
    btn.textContent = "Copy";
    btn.addEventListener("click", () => {
      const code = pre.querySelector("code");
      const text = (code ? code.innerText : pre.innerText) || "";
      const done = () => {
        btn.textContent = "Copied";
        btn.classList.add("is-copied");
        setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("is-copied");
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(done);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
        } catch {
          /* ignore */
        }
        document.body.removeChild(ta);
        done();
      }
    });
    pre.appendChild(btn);
  });
};

/* ---- Copy button for PRSS code-block Blocks (@prss/ui CodeBlock) ---- */
const initBlockCopy = () => {
  document.querySelectorAll<HTMLElement>(".code-block__copy-button").forEach((btn) => {
    if (btn.dataset.docsWired) return;
    btn.dataset.docsWired = "1";
    btn.addEventListener("click", () => {
      let scope: HTMLElement | null = btn.parentElement;
      while (scope && !scope.querySelector("code")) scope = scope.parentElement;
      const code = scope ? scope.querySelector<HTMLElement>("code") : null;
      const text = (code ? code.innerText : "") || "";
      const done = () => {
        btn.setAttribute("data-copy-state", "copied");
        setTimeout(() => btn.setAttribute("data-copy-state", "idle"), 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(done);
      } else {
        done();
      }
    });
  });
};

/* ---- On-this-page TOC (built from headings) + scroll spy ---- */
const initToc = () => {
  const tocEl = document.querySelector<HTMLElement>("[data-toc]");
  const nav = document.querySelector<HTMLElement>("[data-toc-nav]");
  const article = document.querySelector<HTMLElement>("[data-docs-content]");
  if (!tocEl || !nav || !article) return;

  const headings = Array.from(
    article.querySelectorAll<HTMLElement>(".docs-prose h2, .docs-prose h3")
  );

  if (!headings.length) {
    tocEl.style.display = "none";
    // Collapse the right rail if there's also no ad, so we don't leave a
    // barren empty column on sparse pages.
    const shell = document.querySelector(".docs-shell");
    const rail = document.querySelector(".docs-toc-rail");
    const hasAd = rail && rail.querySelector(".docs-aside");
    if (shell && !hasAd) shell.classList.add("rail-empty");
    return;
  }

  const used: Record<string, number> = {};
  const links: HTMLAnchorElement[] = [];

  headings.forEach((h) => {
    if (!h.id) {
      let base = slugify(h.textContent || "section") || "section";
      if (used[base] != null) {
        used[base] += 1;
        base = `${base}-${used[base]}`;
      } else {
        used[base] = 0;
      }
      h.id = base;
    }
    const a = document.createElement("a");
    a.href = `#${h.id}`;
    a.textContent = h.textContent || "";
    a.className = h.tagName.toLowerCase() === "h3" ? "lvl-3" : "lvl-2";
    a.addEventListener("click", () => {
      links.forEach((l) => l.classList.remove("is-active"));
      a.classList.add("is-active");
    });
    nav.appendChild(a);
    links.push(a);
  });

  if ("IntersectionObserver" in window) {
    const byId: Record<string, HTMLAnchorElement> = {};
    links.forEach((l) => (byId[l.getAttribute("href")!.slice(1)] = l));
    let visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        });
        const first = headings.find((h) => visible.has(h.id));
        if (first) {
          links.forEach((l) => l.classList.remove("is-active"));
          byId[first.id]?.classList.add("is-active");
        }
      },
      { rootMargin: "-70px 0px -70% 0px", threshold: 0 }
    );
    headings.forEach((h) => observer.observe(h));
  }
};

/* ---- Carbon ad: inject the real carbon.js so the ad renders in the light DOM
   (fully stylable) instead of an opaque iframe. The placeholder carries the
   serve/placement ids as data attributes; carbon.js inserts #carbonads right
   after its own script tag (found via id="_carbonads_js"), i.e. inside the box. */
const initCarbonAd = () => {
  document.querySelectorAll<HTMLElement>(".docs-carbon").forEach((el) => {
    if (el.dataset.carbonLoaded) return;
    const serve = el.dataset.carbonServe;
    if (!serve) return;
    el.dataset.carbonLoaded = "1";
    const placement = el.dataset.carbonPlacement || "";
    const s = document.createElement("script");
    s.async = true;
    s.type = "text/javascript";
    s.id = "_carbonads_js";
    s.src =
      "//cdn.carbonads.com/carbon.js?serve=" +
      encodeURIComponent(serve) +
      (placement ? "&placement=" + encodeURIComponent(placement) : "");
    el.appendChild(s);
  });
};

// Below the rail breakpoint the sticky column is gone, and leaving the ad as the
// last grid item strands it under the footer where nobody sees it. Move the SAME
// node (never a copy — a second Carbon script would re-request the ad) into the
// end-of-content slot instead, and put it back when the rail returns.
const RAIL_BREAKPOINT = 1100;
const initAsidePlacement = () => {
  const aside = document.querySelector<HTMLElement>(".docs-aside");
  const inline = document.querySelector<HTMLElement>("[data-aside-inline]");
  const rail = document.querySelector<HTMLElement>(".docs-toc-rail");
  if (!aside || !inline || !rail) return;

  const mq = window.matchMedia(`(max-width: ${RAIL_BREAKPOINT}px)`);

  const apply = () => {
    const target = mq.matches ? inline : rail;
    if (aside.parentElement !== target) target.appendChild(aside);
  };

  apply();

  // matchMedia fires exactly on breakpoint crossings; the resize listener is a
  // belt-and-braces fallback for older engines.
  if (mq.addEventListener) mq.addEventListener("change", apply);
  else if ((mq as any).addListener) (mq as any).addListener(apply);

  let t = 0;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = window.setTimeout(apply, 100);
  });
};

// Subtle hero parallax: the image drifts against the scroll inside its fixed
// square frame. Range is bounded by the CSS overscale so no edge is exposed.
const initHeroParallax = () => {
  const media = document.querySelector<HTMLElement>(".docs-hero-media");
  const img = media?.querySelector("img");
  if (!media || !img) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const MAX_SHIFT = 24;
  let ticking = false;

  const update = () => {
    ticking = false;
    const rect = media.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    if (rect.bottom < 0 || rect.top > vh) return;
    // -1 when the frame sits below the fold, +1 once it has scrolled past the top.
    const progress =
      (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
    const clamped = Math.max(-1, Math.min(1, progress));
    img.style.setProperty("--hero-parallax", (-clamped * MAX_SHIFT).toFixed(1) + "px");
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
};

/* ---- Search (command palette over PRSS.search) ---- */
const initSearch = () => {
  const dialog = document.querySelector<HTMLElement>("[data-search-dialog]");
  const input = document.querySelector<HTMLInputElement>("[data-search-input]");
  const list = document.querySelector<HTMLElement>("[data-search-results]");
  if (!dialog || !input || !list) return;

  const prss = (window as any).PRSS;
  // An older @prss/ui has no search; leaving the trigger would promise something
  // the page cannot deliver.
  if (!prss || typeof prss.search !== "function") {
    document.querySelectorAll("[data-search-open]").forEach((el) => el.remove());
    return;
  }

  let activeIndex = 0;
  let queryToken = 0;

  const options = () => Array.from(list.querySelectorAll<HTMLElement>(".docs-search-result"));

  const highlight = () => {
    options().forEach((el, i) => {
      const on = i === activeIndex;
      el.classList.toggle("is-active", on);
      if (on) el.scrollIntoView({ block: "nearest" });
    });
  };

  const open = () => {
    dialog.hidden = false;
    document.body.classList.add("docs-search-open");
    input.focus();
    input.select();
  };

  const close = () => {
    dialog.hidden = true;
    document.body.classList.remove("docs-search-open");
  };

  const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
    );

  const render = (results: any[], query: string) => {
    if (!query.trim()) {
      list.innerHTML = "";
      return;
    }
    if (!results.length) {
      list.innerHTML = `<p class="docs-search-empty">No results for “${escapeHtml(query)}”</p>`;
      return;
    }

    list.innerHTML = results
      .map(
        (r) => `<a class="docs-search-result" href="${escapeHtml(r.url)}">
          <span class="docs-search-result-title">${escapeHtml(r.title)}</span>
          ${r.heading ? `<span class="docs-search-result-section">${escapeHtml(r.heading)}</span>` : ""}
          <span class="docs-search-result-excerpt">${escapeHtml(r.excerpt || "")}</span>
        </a>`
      )
      .join("");

    activeIndex = 0;
    highlight();
  };

  let debounce: any;
  input.addEventListener("input", () => {
    clearTimeout(debounce);
    const query = input.value;
    // Results can arrive out of order; only the newest query may paint.
    const token = ++queryToken;
    debounce = setTimeout(async () => {
      const results = await prss.search(query, 8);
      if (token === queryToken) render(results, query);
    }, 120);
  });

  document.querySelectorAll("[data-search-open]").forEach((el) =>
    el.addEventListener("click", open)
  );
  document.querySelectorAll("[data-search-close]").forEach((el) =>
    el.addEventListener("click", close)
  );

  document.addEventListener("keydown", (e) => {
    const typingElsewhere = /^(input|textarea|select)$/i.test(
      (e.target as HTMLElement)?.tagName || ""
    ) || (e.target as HTMLElement)?.isContentEditable;

    if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typingElsewhere)) {
      e.preventDefault();
      open();
      return;
    }

    if (dialog.hidden) return;

    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const items = options();
      if (!items.length) return;
      e.preventDefault();
      activeIndex = (activeIndex + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      highlight();
    } else if (e.key === "Enter") {
      const target = options()[activeIndex];
      if (target) {
        e.preventDefault();
        window.location.href = target.getAttribute("href") || "";
      }
    }
  });
};

ready(() => {
  initThemeToggle();
  initSidebar();
  initCodeCopy();
  initBlockCopy();
  initToc();
  initSearch();
  // Settle the ad's slot before Carbon's script is injected — moving the
  // container mid-load detaches the script and the ad never renders.
  initAsidePlacement();
  initCarbonAd();
  initHeroParallax();
});

(window as any).PRSSDocsTheme = { initCodeCopy, initBlockCopy, initToc, initCarbonAd, initAsidePlacement, initHeroParallax, initSearch };
