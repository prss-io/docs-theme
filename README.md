<p>
  <h2>Docs</h2>
  <blockquote>Documentation theme for PRSS — grouped sidebar, on-this-page navigation, copyable code blocks and a light/dark toggle.</blockquote>
</p>

<div align="right">
  <p><a href="https://prss.io"><img src="./public/prss.png" width="130" /></a></p>
</div>

## Templates

| Template | Purpose |
| --- | --- |
| `home` | Landing page — hero with CTAs and a square, parallaxed image |
| `docs` | Documentation page with an auto-generated sidebar and TOC |
| `page` | Standalone content page |
| `post` | Article / blog post |
| `blog` | Paginated post listing |
| `showcase` | Card grid of featured items |
| `demo` | Full-width embed page |

## Features

- **Automatic navigation** — the sidebar and previous/next links are derived from
  the site structure, so there is no menu to hand-maintain. A section header names
  the docs product you are currently reading.
- **On this page** — headings are collected into a sticky table of contents.
- **Light + dark** — a theme toggle with tokens tuned for both modes.
- **Responsive** — the sidebar collapses to a drawer and the sponsor slot moves
  inline rather than disappearing.
- **Blocks** — renders `@prss/ui` blocks (cards, embeds, galleries, code, …).

## Development

```bash
npm install
npm run build
```

The build emits one bundle per template plus `theme.css` into `build/`.

## License

MIT
