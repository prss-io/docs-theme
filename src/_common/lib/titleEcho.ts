import * as PRSS from "@prss/ui";

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Titles of every node above this one, so a section heading counts as an echo too. */
export const ancestorTitles = (uuid: string): string[] => {
  const site = (PRSS.getProp("site") as any) || {};
  const nodes: any[] = Array.isArray(site.structure) ? site.structure : [];
  const path: string[] = [];

  const walk = (node: any, trail: string[]): boolean => {
    if (!node) return false;
    if (node.key === uuid) {
      path.push(...trail);
      return true;
    }
    return (node.children || []).some((child: any) =>
      walk(child, node.key ? [...trail, node.key] : trail)
    );
  };

  nodes.forEach((node) => walk(node, []));

  return path
    .map((key) => (PRSS.getItem(key) as any)?.title)
    .filter((title): title is string => !!title);
};

/**
 * Content written for older themes opened with the page title — sometimes
 * preceded by its section, sometimes labelled ("Module: Autocorrect") — because
 * those themes did not print a title of their own. This layout does, so the copy
 * is dropped.
 *
 * Only the headings before the first real content are considered, so a genuine
 * later section that happens to share the name survives.
 */
export const stripLeadingTitleEcho = (html: string, titles: string[]): string => {
  if (!html || typeof DOMParser === "undefined") return html;

  const wanted = titles.map(normalize).filter(Boolean);
  if (!wanted.length) return html;

  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  const root = doc.getElementById("root");
  if (!root) return html;

  // The editor wraps content in a plain div; step through those to reach it.
  let scope: Element = root;
  while (scope.children.length === 1 && scope.firstElementChild?.tagName === "DIV") {
    scope = scope.firstElementChild;
  }

  const isEcho = (element: Element) => {
    const raw = (element.textContent || "").trim();
    if (!raw) return false;
    if (wanted.includes(normalize(raw))) return true;
    // A short label in front of the title still just repeats the title.
    const labelled = raw.match(/^[^:\u2013\u2014]{1,24}[:\u2013\u2014]\s*(.+)$/);
    return !!labelled && wanted.includes(normalize(labelled[1]));
  };

  let removed = false;

  for (const node of Array.from(scope.children)) {
    const tag = node.tagName;
    if (tag === "BR" || (tag === "P" && !(node.textContent || "").trim())) continue;
    if (!/^H[1-4]$/.test(tag)) break;
    if (!isEcho(node)) break;
    node.remove();
    removed = true;
  }

  return removed ? root.innerHTML : html;
};
