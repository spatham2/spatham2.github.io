# Portfolio Content Guide

This site is build-free static HTML/CSS/JS and runs directly on GitHub Pages. No build tools or external dependencies are required.

To preview changes locally (required so the browser can `fetch()` YAML and Markdown instead of falling back to the hardcoded `file://` snapshot in `app.js`):

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Push to GitHub to publish.

---

## Adding projects to the shelf

1. Add your cover image (and optional hover movie) to the repository.
2. Add a project entry under a shelf in `data/projects.yaml`:

```yaml
- Shelf: "Current"
  Projects:
    - Project: "Project Name"
      Slug: "project-url-name"
      Cover: "path/to/cover.jpg"
      Description: "Short description shown on hover and in the project page hero."
      Movie: "path/to/hover-clip.mp4"
      Page Specifications: "project-pages/project-url-name.md"
```

- **New shelves**: Copy a full `- Shelf:` block to create another row.
- **Spacing**: Cards on a shelf auto-space to stay visible regardless of how many projects you add.
- **Optional movie**: Leave `Movie: ""` empty when a project has no video.
- **Slug**: Used in the URL (`project.html?project=<Slug>`) and must be unique.

---

## Adding `.md` for individual projects

Create a Markdown file in `project-pages/` (matching `Page Specifications` in `data/projects.yaml`). Each file supports optional YAML frontmatter, standard Markdown, and fenced layout blocks styled to match the site.

### 1. Frontmatter (optional spec bar under the hero)

Place a `---` block at the very top of the `.md` file to render a hairline-bordered metadata strip below the hero:

```markdown
---
role: Lead Hardware Engineer
date: Fall 2024
status: Complete
stack: ESP32, KiCad, Python, Fusion 360
links: [GitHub](https://github.com/you/repo), [Schematic](files/schematic.pdf)
---
```

- `stack` (or `tags` / `tools`) renders as pill tags.
- Any other key (`role`, `date`, `status`, `cost`, `links`, etc.) renders as a labeled column in the strip.

### 2. Standard Markdown

- Headings: `#`, `##`, `###`
- Emphasis & code: `**bold**`, `*italic*`, `` `inline code` ``, and fenced ```` ```code blocks``` ````
- Links: `[label](https://example.com)`
- Lists: `- bullet` and `1. numbered`
- Blockquotes (`> note`), horizontal rules (`---`), and Markdown tables (`| Col | Col |`)
- Figures (images, GIFs, and videos): put `![Caption](path)` on its own line. `.mp4`, `.webm`, and `.mov` render as `<video>` elements; images and `.gif` render as `<img>` with an optional caption:

```markdown
![EMG trigger latency captured on oscilloscope.](assets/scope-capture.png)

![Wrist tilt controlling the desktop cursor.](assets/cursor-demo.gif)

![Board bring-up demo.](assets/bringup.mp4)
```

### 3. Layout blocks

Wrap content in `::: <block>` ... `:::` to structure a project page like a case study without writing HTML.

**Two-column split (`::: split` / `::: split reverse`)** — use `---` inside the block to separate left and right columns:

```markdown
::: split
![KiCad 2-layer pre-amp PCB.](assets/preamp-pcb.png)

---

## Pre-amp Design

The JLI-2555 capsule feeds a low-noise JFET stage before USB-C audio conversion.
:::
```

**Image / GIF gallery (`::: gallery` for 2 columns, `::: gallery 3` for 3 columns):**

```markdown
::: gallery
![CAD assembly in Fusion 360.](assets/cad.png)

![Final 3D-printed enclosure.](assets/enclosure.jpg)
:::
```

**Full-width breakout (`::: wide`)** — expands a schematic, CAD render, or GIF beyond the text column to the full page width:

```markdown
::: wide
![Full system schematic.](assets/schematic.png)
:::
```

**Callout box (`::: callout Optional Title`)** — highlights a key tradeoff, measurement, or debugging note:

```markdown
::: callout Debugging Note
Initial BLE packets dropped above 100 Hz; batching IMU + EMG samples into one characteristic cut jitter below 8 ms.
:::
```
