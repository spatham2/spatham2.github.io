const projectDetail = document.querySelector("#project-detail");
const VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i;

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(text) {
  const codeSlots = [];
  let out = escapeHtml(text).replace(/`([^`]+)`/g, (_, code) => {
    codeSlots.push(`<code>${code}</code>`);
    return `\u0000CODE${codeSlots.length - 1}\u0000`;
  });

  out = out
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => `<img src="${src.trim()}" alt="${alt}">`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      const url = href.trim();
      const external = /^https?:\/\//i.test(url) ? ' target="_blank" rel="noopener"' : "";
      return `<a href="${url}"${external}>${label}</a>`;
    })
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");

  return out.replace(/\u0000CODE(\d+)\u0000/g, (_, i) => codeSlots[Number(i)]);
}

function parseFrontmatter(markdown) {
  const normalized = markdown.replace(/\r\n?/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: [], body: normalized };

  const meta = [];
  let current = null;

  match[1].split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && current) {
      current.values.push(unquote(listItem[1]));
      return;
    }

    const kv = line.match(/^([^:]+):\s*(.*)$/);
    if (!kv) return;

    const key = kv[1].trim();
    const rawValue = kv[2].trim();
    current = {
      key,
      values: rawValue ? [unquote(rawValue)] : [],
    };
    meta.push(current);
  });

  return { meta, body: match[2] };
}

function renderSpecStrip(meta) {
  if (!meta.length) return "";

  const items = meta
    .filter(({ values }) => values.length)
    .map(({ key, values }) => {
      const lower = key.toLowerCase();
      if (lower === "stack" || lower === "tags" || lower === "tools") {
        const tags = values
          .flatMap((v) => v.split(","))
          .map((t) => t.trim())
          .filter(Boolean)
          .map((t) => `<span class="project-specs__tag">${escapeHtml(t)}</span>`)
          .join("");
        return `
          <div class="project-specs__item project-specs__item--wide">
            <dt>${escapeHtml(key)}</dt>
            <dd class="project-specs__tags">${tags}</dd>
          </div>`;
      }

      const rendered = values.map((v) => renderInline(v)).join(" · ");
      return `
        <div class="project-specs__item">
          <dt>${escapeHtml(key)}</dt>
          <dd>${rendered}</dd>
        </div>`;
    })
    .join("");

  return items ? `<dl class="project-specs">${items}</dl>` : "";
}

function renderFigure(alt, rawSrc) {
  const src = escapeHtml(rawSrc.trim());
  const caption = alt.trim();
  const media = VIDEO_EXT.test(rawSrc.trim())
    ? `<video src="${src}" controls playsinline muted loop preload="metadata"></video>`
    : `<img src="${src}" alt="${escapeHtml(caption)}" loading="lazy">`;
  return `<figure class="project-figure">${media}${caption ? `<figcaption>${renderInline(caption)}</figcaption>` : ""}</figure>`;
}

function renderTable(rows) {
  const splitRow = (line) =>
    line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((cell) => cell.trim());

  const headers = splitRow(rows[0]);
  const bodyRows = rows.slice(2).map(splitRow);
  const thead = `<thead><tr>${headers.map((h) => `<th>${renderInline(h)}</th>`).join("")}</tr></thead>`;
  const tbody = bodyRows.length
    ? `<tbody>${bodyRows.map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`).join("")}</tbody>`
    : "";
  return `<div class="project-table-wrap"><table>${thead}${tbody}</table></div>`;
}

function renderLayoutBlock(directive, content) {
  const parts = directive.trim().split(/\s+/);
  const type = parts[0].toLowerCase();
  const rest = parts.slice(1).join(" ");

  if (type === "split") {
    const reverse = parts.includes("reverse") ? " md-split--reverse" : "";
    const sections = content.split(/^\s*---\s*$/m);
    if (sections.length >= 2) {
      const cols = sections
        .slice(0, 2)
        .map((col) => `<div class="md-split__col">${renderMarkdown(col)}</div>`)
        .join("");
      return `<div class="md-split${reverse}">${cols}</div>`;
    }
    return `<div class="md-split${reverse}">${renderMarkdown(content)}</div>`;
  }

  if (type === "gallery") {
    const cols = parts[1] === "3" ? " md-gallery--3" : "";
    return `<div class="md-gallery${cols}">${renderMarkdown(content)}</div>`;
  }

  if (type === "wide") {
    return `<div class="md-wide">${renderMarkdown(content)}</div>`;
  }

  if (type === "callout") {
    const title = rest ? `<p class="md-callout__title">${renderInline(rest)}</p>` : "";
    return `<aside class="md-callout">${title}${renderMarkdown(content)}</aside>`;
  }

  return `<div class="md-block">${renderMarkdown(content)}</div>`;
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let listTag = null;
  let quoteLines = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };

  const closeList = () => {
    if (listTag) {
      html.push(`</${listTag}>`);
      listTag = null;
    }
  };

  const flushQuote = () => {
    if (quoteLines.length) {
      html.push(`<blockquote>${renderMarkdown(quoteLines.join("\n"))}</blockquote>`);
      quoteLines = [];
    }
  };

  const flushAll = () => {
    flushParagraph();
    closeList();
    flushQuote();
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    const blockStart = trimmed.match(/^:::\s*([a-zA-Z0-9_-]+(?:\s+.*)?)$/);
    if (blockStart && trimmed !== ":::") {
      flushAll();
      const inner = [];
      let depth = 1;
      while (i + 1 < lines.length) {
        i += 1;
        const nextTrimmed = lines[i].trim();
        if (/^:::\s*[a-zA-Z0-9_-]+/.test(nextTrimmed)) {
          depth += 1;
        } else if (nextTrimmed === ":::") {
          depth -= 1;
          if (depth === 0) break;
        }
        inner.push(lines[i]);
      }
      html.push(renderLayoutBlock(blockStart[1], inner.join("\n")));
      continue;
    }

    const fenceStart = trimmed.match(/^```(.*)$/);
    if (fenceStart) {
      flushAll();
      const lang = fenceStart[1].trim();
      const codeLines = [];
      while (i + 1 < lines.length) {
        i += 1;
        if (lines[i].trim() === "```") break;
        codeLines.push(lines[i]);
      }
      const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      html.push(`<pre><code${langAttr}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    if (
      trimmed.startsWith("|") &&
      i + 1 < lines.length &&
      /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1])
    ) {
      flushAll();
      const tableRows = [line, lines[i + 1]];
      i += 1;
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) {
        i += 1;
        tableRows.push(lines[i]);
      }
      html.push(renderTable(tableRows));
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      closeList();
      quoteLines.push(quoteMatch[1]);
      continue;
    }
    flushQuote();

    if (/^---+$/.test(trimmed)) {
      flushAll();
      html.push("<hr>");
      continue;
    }

    const figureMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (figureMatch) {
      flushAll();
      html.push(renderFigure(figureMatch[1], figureMatch[2]));
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushAll();
      const level = Math.min(heading[1].length + 1, 4);
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (listTag !== "ul") {
        closeList();
        html.push("<ul>");
        listTag = "ul";
      }
      html.push(`<li>${renderInline(ulMatch[1])}</li>`);
      continue;
    }

    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (listTag !== "ol") {
        closeList();
        html.push("<ol>");
        listTag = "ol";
      }
      html.push(`<li>${renderInline(olMatch[1])}</li>`);
      continue;
    }

    if (!trimmed) {
      flushAll();
      continue;
    }

    closeList();
    paragraph.push(trimmed);
  }

  flushAll();
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

    const { meta, body } = parseFrontmatter(copy);
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
      ${renderSpecStrip(meta)}
      <div class="project-copy">${renderMarkdown(body)}</div>`;
  } catch (error) {
    projectDetail.innerHTML = `
      <h1>Project not found</h1>
      <p class="error-message">This project page is unavailable.</p>`;
    console.error(error);
  }
}

initializeProject();
