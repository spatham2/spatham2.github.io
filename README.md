# Portfolio content flow

The site is intentionally build-free and works directly on GitHub Pages.

## Add a project

1. Add the project beneath the desired shelf in `data/projects.yaml`.
2. Add the cover image (and optional hover movie) to the repository.
3. Add a Markdown detail file under `project-pages/`.
4. Point `Page Specifications` at that Markdown file.

```yaml
- Shelf: "Hardware"
  Projects:
    - Project: "Project name"
      Slug: "project-url-name"
      Cover: "path/to/cover.jpg"
      Description: "Short hover description."
      Movie: "path/to/movie.mp4"
      Page Specifications: "project-pages/project-url-name.md"
```

Create another `Shelf` block for each new row. Leave `Movie` empty when a
project has no video.

GitHub Pages reads the YAML and Markdown directly. Double-clicking `index.html`
also works, using the bundled content snapshot in `app.js`; use a local web
server when previewing YAML or Markdown edits before deployment.
