const projectShelves = document.querySelector("#project-shelves");
const timelineList = document.querySelector("#timeline-list");
const EMAIL_ADDRESS = "sarveshpatham@gmail.com";

// Browsers block fetch() when index.html is opened directly from disk.
// This bundled snapshot keeps direct-open previews functional; GitHub Pages
// and local web servers continue to read the editable YAML files.
const FALLBACK_SHELVES = [
  {
    Shelf: "Current",
    Projects: [
      {
        Project: "Cuff-Link",
        Slug: "cuff-link",
        Cover: "CuffLinkPhotoShoot.png",
        Description: "An accessibility device allowing anyone to control a cursor on screen using an IMU and EMG data to click.",
        Movie: "",
        "Page Specifications": "project-pages/cuff-link.md",
      },
      {
        Project: "High Quality Microphone",
        Slug: "usb-c-microphone",
        Cover: "Microphone.JPG",
        Description: "A USB-C plug and play microphone with a handmade pre-amp circuit — outclassing $500 mics for a small fraction of the price.",
        Movie: "",
        "Page Specifications": "project-pages/usb-c-microphone.md",
      },
    ],
  },
];

const FALLBACK_TIMELINE = [
  {
    Company: "Arm",
    Role: "Physical Implementation Intern",
    Dates: "Summer '26",
    Highlights: "Developed backtracing CLI tool for detecting integrated clock gates in any technology mapped netlist | Created large RTL hierarchy processing flow to translate hierarchies into easily traversable directed acyclic graphs | Verified block-level physical designs and debugged bottlenecks utilizing Cadence Innovus and Synopsys Verdi",
  },
  {
    Company: "Gen Auto",
    Role: "Autonomy Engineer",
    Dates: "June 2025 — Present",
    Highlights: "Developed LiDAR/Camera/IMU stack using NVIDIA Jetson Orin | Built and implemented ROS2 nodes using Python and Linux | Installed demo prototype for investor pitches",
  },
  {
    Company: "UIUC CEME Laboratory",
    Role: "Undergraduate Research Assistant",
    Dates: "August 2025 — Present",
    Highlights: "Developed Python algorithms to map simulated magnetic fields to prototype MRI data | Designed Hall sensor mounts and pre-amp assemblies in Fusion360 | Researched transceiver designs to improve signal clarity in low-field MRI",
  },
  {
    Company: "3D Pets",
    Role: "Engineering Intern (Part-time)",
    Dates: "October 2023 — April 2024",
    Highlights: "Machined custom prosthetics, boosting production by 10% | Created 3D prosthetic models from LiDAR-scanned body molds | Established parts organization system to improve workshop workflow",
  },
];

const FALLBACK_PROJECT_COPY = {
  "cuff-link": `# What is it?

The Cuff-Link is a device I thought up when I realized that there's no one size fits all mouse for people with disabilities. It works via an IMU and EMG strapped to the wrist of the user using the band. The IMU's yaw, pitch, and roll is used to control the movement of an onscreen cursor, and the EMG reads muscle contractions and sends a click command after it exceeds a certain threshold. All of this data is fed to the computer via BLE, where a Python script running on the computer controls the mouse. We also added an optional finger controller for more precision.

# Key Technologies

- ESP32 (using Arduino IDE)
- Python
- Circuit Design
- Sensor Processing (EMG, IMU)
- Fusion360 (CAD) + 3D Printing`,
  "usb-c-microphone": `# What is it?

This is something I've wanted to build for a while because for the longest time I wanted to buy a good sounding microphone. Unfortunately, these do not come cheap, so I figured why not build it?

This project had two main steps to it: building the pre-amp + USB-C conversion circuit, and building the encapsulation for the microphone capsule itself. I decided to go with the JLI-2555, a cheap capsule running around $12, but very high quality for the price (used in microphones $500+!). Working with a friend, we developed a CAD model for the microphone itself, then built the pre-amp using a PCB designed in KiCAD, and soldered it all up with some good old fashioned elbow grease.

# Key Technologies

- KiCAD
- Fusion360
- Circuit Design
- Soldering
- 3D Printing`,
};

function unquote(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  return trimmed;
}

// Parses the intentionally small, flat YAML format used by this portfolio.
function parseListYaml(source) {
  const entries = [];
  let current = null;

  source.split(/\r?\n/).forEach((line) => {
    if (!line.trim() || line.trimStart().startsWith("#")) return;
    const match = line.match(/^\s*(-\s*)?([^:]+):\s*(.*)$/);
    if (!match) return;

    const startsEntry = Boolean(match[1]);
    const key = match[2].trim();
    const value = unquote(match[3]);

    if (startsEntry) {
      if (current) entries.push(current);
      current = {};
    }

    if (current) current[key] = value;
  });

  if (current) entries.push(current);
  return entries;
}

function parseShelvesYaml(source) {
  const shelves = [];
  let shelf = null;
  let project = null;

  const saveProject = () => {
    if (shelf && project) shelf.Projects.push(project);
    project = null;
  };

  const saveShelf = () => {
    saveProject();
    if (shelf) shelves.push(shelf);
    shelf = null;
  };

  source.split(/\r?\n/).forEach((line) => {
    if (!line.trim() || line.trimStart().startsWith("#")) return;

    const shelfMatch = line.match(/^\s*-\s+Shelf:\s*(.*)$/);
    if (shelfMatch) {
      saveShelf();
      shelf = { Shelf: unquote(shelfMatch[1]), Projects: [] };
      return;
    }

    const projectMatch = line.match(/^\s*-\s+Project:\s*(.*)$/);
    if (projectMatch) {
      if (!shelf) shelf = { Shelf: "Current", Projects: [] };
      saveProject();
      project = { Project: unquote(projectMatch[1]) };
      return;
    }

    const fieldMatch = line.match(/^\s+([^:]+):\s*(.*)$/);
    if (project && fieldMatch && fieldMatch[1].trim() !== "Projects") {
      project[fieldMatch[1].trim()] = unquote(fieldMatch[2]);
    }
  });

  saveShelf();
  return shelves;
}

function flattenProjects(shelves) {
  return shelves.flatMap((shelf) => shelf.Projects || []);
}

async function fetchYaml(path) {
  if (window.location.protocol === "file:") {
    return path.endsWith("projects.yaml") ? FALLBACK_SHELVES : FALLBACK_TIMELINE;
  }

  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  const source = await response.text();
  return path.endsWith("projects.yaml") ? parseShelvesYaml(source) : parseListYaml(source);
}

function projectCard(project, index) {
  const card = document.createElement("article");
  const slug = encodeURIComponent(project.Slug);
  const movie = project.Movie?.trim();
  const title = project.Project;

  card.className = `project-tape${movie ? " has-video" : ""}`;
  card.dataset.index = index;
  card.innerHTML = `
    <a class="project-tape__link" href="project.html?project=${slug}" aria-label="Open ${title}">
      <img class="project-tape__media" src="${project.Cover}" alt="${title}" draggable="false">
      ${movie ? `<video class="project-tape__media" src="${movie}" muted loop playsinline preload="metadata"></video>` : ""}
      <span class="project-tape__tooltip">${title}</span>
      <span class="project-tape__label">
        <span class="project-tape__title">${title}</span>
        <span class="project-tape__description">${project.Description}</span>
      </span>
    </a>`;

  const video = card.querySelector("video");
  if (video) {
    card.addEventListener("mouseenter", () => video.play().catch(() => {}));
    card.addEventListener("mouseleave", () => {
      video.pause();
      video.currentTime = 0;
    });
  }
  return card;
}

function projectShelfGroup(shelf, shelfIndex) {
  const group = document.createElement("section");
  const headingId = `project-shelf-${shelfIndex}`;
  group.className = "project-shelf-group";
  group.setAttribute("aria-labelledby", headingId);
  group.innerHTML = `
    <h3 class="project-shelf-title" id="${headingId}">${shelf.Shelf}</h3>
    <div class="project-shelf"></div>`;

  const shelfElement = group.querySelector(".project-shelf");
  shelfElement.replaceChildren(...shelf.Projects.map(projectCard));
  return group;
}

function focusProject(cards, focus) {
  cards.forEach((card, index) => {
    const delta = index - focus;
    const distance = Math.min(Math.abs(delta), 1);
    card.style.setProperty("--distance", distance.toFixed(3));
    card.style.setProperty("--side", Math.sign(delta) || 0);
    card.style.zIndex = String(1000 - Math.round(distance * 100) + cards.length - index);
    card.classList.toggle("is-active", distance < 0.42);
  });
}

function resetProjects(cards) {
  const midpoint = (cards.length - 1) / 2;
  cards.forEach((card, index) => {
    card.style.setProperty("--distance", "1");
    card.style.setProperty("--side", Math.sign(index - midpoint) || 0);
    card.style.zIndex = String(cards.length - index);
    card.classList.remove("is-active");
  });
}

function enableShelfInteraction(shelf, cards) {
  if (!cards.length) return;
  resetProjects(cards);

  const updateFromPointer = (event) => {
    const rect = shelf.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const firstCenter = cards[0].offsetLeft + cards[0].offsetWidth / 2;
    const lastCard = cards[cards.length - 1];
    const lastCenter = lastCard.offsetLeft + lastCard.offsetWidth / 2;
    const span = Math.max(lastCenter - firstCenter, 1);
    const focus = Math.max(0, Math.min(cards.length - 1, ((x - firstCenter) / span) * (cards.length - 1)));
    focusProject(cards, focus);
  };

  shelf.addEventListener("pointermove", updateFromPointer);
  shelf.addEventListener("pointerleave", () => resetProjects(cards));
  cards.forEach((card, index) => {
    card.addEventListener("focusin", () => focusProject(cards, index));
    card.addEventListener("mouseenter", () => focusProject(cards, index));
  });
}

function timelineItem(entry, index) {
  const item = document.createElement("li");
  const detailsId = `timeline-details-${index}`;
  const highlights = entry.Highlights?.trim();
  const hasDetails = Boolean(entry.Role?.trim() || highlights);
  const bullets = highlights
    ? highlights.split("|").map((itemText) => `<li>${itemText.trim()}</li>`).join("")
    : "";

  item.className = "timeline-item";
  if (!hasDetails) {
    item.innerHTML = `
      <div class="timeline-item__button">
        <span class="timeline-item__mark" aria-hidden="true">⌁</span>
        <span>${entry.Company}</span>
        <span class="timeline-item__rule" aria-hidden="true"></span>
        <span class="timeline-item__date">${entry.Dates}</span>
      </div>`;
    return item;
  }

  item.innerHTML = `
    <button class="timeline-item__button" type="button" aria-expanded="false" aria-controls="${detailsId}">
      <span class="timeline-item__mark" aria-hidden="true">⌁</span>
      <span>${entry.Company}</span>
      <span class="timeline-item__rule" aria-hidden="true"></span>
      <span class="timeline-item__date">${entry.Dates}</span>
    </button>
    <div class="timeline-item__details" id="${detailsId}">
      <div>
        <p>${entry.Role}</p>
        <ul>${bullets}</ul>
      </div>
    </div>`;

  const button = item.querySelector("button");
  button.addEventListener("click", () => {
    const open = item.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(open));
  });
  return item;
}

function enableEmailCopy() {
  document.querySelectorAll(".copy-email").forEach((link) => {
    link.addEventListener("click", async (event) => {
      event.preventDefault();
      const originalText = link.textContent;

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(EMAIL_ADDRESS);
        } else {
          const textArea = document.createElement("textarea");
          textArea.value = EMAIL_ADDRESS;
          textArea.style.position = "fixed";
          textArea.style.opacity = "0";
          document.body.append(textArea);
          textArea.select();
          document.execCommand("copy");
          textArea.remove();
        }

        link.textContent = "Copied!";
        window.setTimeout(() => {
          link.textContent = originalText;
        }, 1400);
      } catch {
        window.location.href = `mailto:${EMAIL_ADDRESS}`;
      }
    });
  });
}

async function initialize() {
  enableEmailCopy();
  const currentYear = document.querySelector("#current-year");
  if (currentYear) currentYear.textContent = new Date().getFullYear();

  if (projectShelves) {
    try {
      const shelves = await fetchYaml("data/projects.yaml");
      projectShelves.replaceChildren(...shelves.map(projectShelfGroup));
      projectShelves.querySelectorAll(".project-shelf").forEach((shelf) => {
        enableShelfInteraction(shelf, [...shelf.querySelectorAll(".project-tape")]);
      });
    } catch (error) {
      projectShelves.innerHTML = `<p class="error-message">Projects could not be loaded.</p>`;
      console.error(error);
    }
  }

  if (timelineList) {
    try {
      const timeline = await fetchYaml("data/timeline.yaml");
      timelineList.replaceChildren(...timeline.map(timelineItem));
    } catch (error) {
      timelineList.innerHTML = `<li class="error-message">Timeline could not be loaded.</li>`;
      console.error(error);
    }
  }
}

initialize();
