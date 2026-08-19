const projectDetail = document.querySelector("#project-detail");

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const html = [];
  let paragraph = [];
  let inList = false;

  const inline = (text) => text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  lines.forEach((line) => {
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const bullet = line.match(/^[-*]\s+(.+)$/);

    if (heading) {
      flushParagraph();
      closeList();
      const level = Math.min(heading[1].length + 1, 4);
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (bullet) {
      flushParagraph();
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(bullet[1])}</li>`);
    } else if (!line.trim()) {
      flushParagraph();
      closeList();
    } else {
      paragraph.push(line.trim());
    }
  });

  flushParagraph();
  closeList();
  return html.join("\n");
}

async function initializeProject() {
  const requestedSlug = new URLSearchParams(window.location.search).get("project");

  try {
    const shelves = await fetchYaml("data/projects.yaml");
    const projects = flattenProjects(shelves);
    const project = projects.find(({ Slug }) => Slug === requestedSlug);
    if (!project) throw new Error("Project not found");

    let copy;
    if (window.location.protocol === "file:") {
      copy = FALLBACK_PROJECT_COPY[project.Slug];
      if (!copy) throw new Error("Project page could not be loaded");
    } else {
      const pageResponse = await fetch(project["Page Specifications"]);
      if (!pageResponse.ok) throw new Error("Project page could not be loaded");
      copy = await pageResponse.text();
    }
    const media = project.Movie
      ? `<video src="${project.Movie}" poster="${project.Cover}" controls playsinline></video>`
      : `<img src="${project.Cover}" alt="${project.Project}">`;

    document.title = `${project.Project} — Sarvesh Patham`;
    projectDetail.innerHTML = `
      <header class="project-hero">
        <div class="project-hero__media">${media}</div>
        <div>
          <h1>${project.Project}</h1>
          <p>${project.Description}</p>
        </div>
      </header>
      <div class="project-copy">${renderMarkdown(copy)}</div>`;
  } catch (error) {
    projectDetail.innerHTML = `
      <h1>Project not found</h1>
      <p class="error-message">This project page is unavailable.</p>`;
    console.error(error);
  }
}

initializeProject();
