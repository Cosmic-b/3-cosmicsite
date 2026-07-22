const projectLists = document.querySelectorAll("[data-project-list]");
const contactLinks = document.querySelectorAll("[data-contact-link]");
const projectModal = projectLists.length > 0 ? createProjectModal() : null;
const contactModal = contactLinks.length > 0 ? createContactModal() : null;
let modalLoadId = 0;
let projectsDatabase = [];
let suppressModalUrlSync = false;

if (projectLists.length > 0) {
    loadProjects();
    window.addEventListener("popstate", syncProjectModalWithUrl);
}

contactLinks.forEach(link => {
    link.setAttribute("aria-haspopup", "dialog");
    link.setAttribute("aria-controls", "contact-modal");
    link.addEventListener("click", event => {
        event.preventDefault();
        openContactModal(link);
    });
});

async function loadProjects() {
    try {
        const response = await fetch("./assets/data/projects.json");

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const projects = await response.json();

        if (!Array.isArray(projects)) {
            throw new Error("The JSON root must be an array.");
        }

        projectsDatabase = projects;
        projectLists.forEach(list => renderProjects(list, projects));
        syncProjectModalWithUrl();
    } catch (error) {
        projectLists.forEach(list => {
            list.replaceChildren(createMessage(`Could not load projects: ${error.message}`));
        });
    }
}

function renderProjects(list, projects) {
    const type = list.dataset.projectType;
    const limit = Number.parseInt(list.dataset.projectLimit, 10);
    let visibleProjects = projects
        .filter(project => !type || project.type === type)
        .sort((first, second) =>
            String(second.date || "").localeCompare(String(first.date || ""))
        );

    if (Number.isInteger(limit) && limit >= 0) {
        visibleProjects = visibleProjects.slice(0, limit);
    }

    if (visibleProjects.length === 0) {
        list.replaceChildren(createMessage(`No ${type || "latest"} projects yet.`));
        return;
    }

    const cards = visibleProjects.map(project => createProjectCard(project, list));
    list.replaceChildren(...cards);
    cards.forEach(card => {
        card.dataset.previewColor = getComputedStyle(card).backgroundColor;
    });
}

function createProjectCard(project, list) {
    const card = document.createElement("article");
    const image = document.createElement("img");
    const title = document.createElement("h4");

    card.className = list.dataset.cardClass || "project-preview";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-haspopup", "dialog");
    card.setAttribute("aria-label", `Open details for ${project.name}`);
    card.dataset.projectId = project.id;
    image.className = list.dataset.imageClass || "thumbnail";
    image.src = project.thumbnailImage;
    image.alt = `${project.name} thumbnail`;
    title.textContent = project.name;

    card.addEventListener("click", () => openProjectModal(project, list, { card }));
    card.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") {
            return;
        }

        event.preventDefault();
        openProjectModal(project, list, { card });
    });

    card.append(image, title);
    return card;
}

function createProjectModal() {
    const dialog = document.createElement("dialog");
    const content = document.createElement("div");
    const closeButton = document.createElement("button");
    const image = document.createElement("img");
    const details = document.createElement("div");
    const title = document.createElement("h2");
    const date = document.createElement("time");
    const description = document.createElement("div");

    dialog.className = "project-modal";
    dialog.setAttribute("aria-labelledby", "project-modal-title");
    content.className = "project-modal__content";
    closeButton.className = "project-modal__close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close project details");
    closeButton.textContent = "x";
    image.className = "project-modal__image";
    details.className = "project-modal__details";
    title.id = "project-modal-title";
    title.className = "project-modal__title";
    date.className = "project-modal__date";
    description.className = "project-modal__description";
    description.setAttribute("aria-live", "polite");

    details.append(title, date, description);
    content.append(closeButton, image, details);
    dialog.append(content);
    document.body.append(dialog);

    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
        if (event.target === dialog) {
            dialog.close();
        }
    });
    dialog.addEventListener("close", () => {
        modalLoadId += 1;
        document.body.classList.remove("project-modal-open");

        if (!suppressModalUrlSync) {
            removeProjectFromUrl();
        }

        suppressModalUrlSync = false;
    });

    return { dialog, image, title, date, description };
}

function createContactModal() {
    const dialog = document.createElement("dialog");
    const content = document.createElement("div");
    const closeButton = document.createElement("button");
    const section = document.createElement("section");
    const title = document.createElement("h2");
    const introduction = document.createElement("p");
    const links = document.createElement("div");
    const emailGroup = document.createElement("div");
    const emailLabel = document.createElement("span");
    const email = document.createElement("a");
    const githubGroup = document.createElement("div");
    const githubLabel = document.createElement("span");
    const github = document.createElement("a");
    const telegramGroup = document.createElement("div");
    const telegramLabel = document.createElement("span");
    const telegram = document.createElement("a");

    dialog.id = "contact-modal";
    dialog.className = "project-modal contact-modal";
    dialog.setAttribute("aria-labelledby", "contact-modal-title");
    content.className = "project-modal__content";
    closeButton.className = "project-modal__close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close contact details");
    closeButton.textContent = "x";
    section.className = "contact";
    title.id = "contact-modal-title";
    title.textContent = "Contact";
    introduction.textContent =
        "Open to development work, creative projects, and collaborations.";
    links.className = "contact-links";
    emailGroup.className = "contact-link";
    emailLabel.className = "contact-link__label";
    emailLabel.textContent = "Email";
    email.href = "mailto:cosmicyegor@gmail.com";
    email.setAttribute("aria-label", "Email cosmicyegor@gmail.com");
    email.textContent = "cosmicyegor@gmail.com";
    githubGroup.className = "contact-link";
    githubLabel.className = "contact-link__label";
    githubLabel.textContent = "GitHub";
    github.href = "https://github.com/Cosmic-b";
    github.target = "_blank";
    github.rel = "noopener noreferrer";
    github.setAttribute("aria-label", "GitHub Cosmic-b");
    github.textContent = "github.com/Cosmic-b";
    telegramGroup.className = "contact-link";
    telegramLabel.className = "contact-link__label";
    telegramLabel.textContent = "Telegram";
    telegram.href = "https://t.me/Cosmic_b";
    telegram.target = "_blank";
    telegram.rel = "noopener noreferrer";
    telegram.setAttribute("aria-label", "Telegram Cosmic_b");
    telegram.textContent = "@Cosmic_b";

    emailGroup.append(emailLabel, email);
    githubGroup.append(githubLabel, github);
    telegramGroup.append(telegramLabel, telegram);
    links.append(emailGroup, githubGroup, telegramGroup);
    section.append(title, introduction, links);
    content.append(closeButton, section);
    dialog.append(content);
    document.body.append(dialog);

    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
        if (event.target === dialog) {
            dialog.close();
        }
    });
    dialog.addEventListener("close", () => {
        document.body.classList.remove("project-modal-open");
    });

    return { dialog, title };
}

function openContactModal(link) {
    const bodyStyles = getComputedStyle(document.body);
    const heading = document.querySelector("h1");
    const previewCard = document.querySelector("[data-project-id]");
    const headingColor = heading
        ? getComputedStyle(heading).color
        : getComputedStyle(link).color;

    contactModal.dialog.style.backgroundColor = bodyStyles.backgroundColor;
    contactModal.dialog.style.color = getComputedStyle(link).color;
    contactModal.dialog.style.borderColor = previewCard?.dataset.previewColor ||
        headingColor;
    contactModal.title.style.color = headingColor;

    if (!contactModal.dialog.open) {
        contactModal.dialog.showModal();
    }

    document.body.classList.add("project-modal-open");
}

async function openProjectModal(project, list, options = {}) {
    const { dialog, image, title, date, description } = projectModal;
    const bodyStyles = getComputedStyle(document.body);
    const listStyles = getComputedStyle(list);
    const pageHeading = document.querySelector("h1");
    const card = options.card || getProjectCard(project, list);
    const loadId = ++modalLoadId;

    dialog.style.backgroundColor = bodyStyles.backgroundColor;
    dialog.style.color = listStyles.color;
    dialog.style.borderColor = card?.dataset.previewColor || listStyles.color;
    image.src = project.splashImage;
    image.alt = `${project.name} cover`;
    title.textContent = project.name;
    title.style.color = pageHeading
        ? getComputedStyle(pageHeading).color
        : listStyles.color;
    date.dateTime = project.date;
    date.textContent = project.date;
    description.replaceChildren(createMessage("Loading description…"));

    if (options.updateUrl !== false) {
        addProjectToUrl(project.id);
    }

    if (!dialog.open) {
        dialog.showModal();
    }

    document.body.classList.add("project-modal-open");

    try {
        const response = await fetch(project.mdDescription);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const markdown = await response.text();

        if (loadId === modalLoadId && dialog.open) {
            renderMarkdown(markdown, description, project.name);
        }
    } catch (error) {
        if (loadId === modalLoadId && dialog.open) {
            description.replaceChildren(
                createMessage(`Could not load description: ${error.message}`)
            );
        }
    }
}

function syncProjectModalWithUrl() {
    if (projectsDatabase.length === 0) {
        return;
    }

    const projectId = new URL(window.location.href).searchParams.get("pop");
    const project = projectsDatabase.find(item => item.id === projectId);

    if (project) {
        const list = getProjectList(project);
        openProjectModal(project, list, {
            card: getProjectCard(project, list),
            updateUrl: false
        });
        return;
    }

    if (projectModal.dialog.open) {
        suppressModalUrlSync = true;
        projectModal.dialog.close();
    }
}

function getProjectList(project) {
    return [...projectLists].find(list =>
        !list.dataset.projectType || list.dataset.projectType === project.type
    ) || projectLists[0];
}

function getProjectCard(project, list) {
    return [...list.querySelectorAll("[data-project-id]")].find(card =>
        card.dataset.projectId === project.id
    ) || list.querySelector("[data-project-id]");
}

function addProjectToUrl(projectId) {
    const url = new URL(window.location.href);

    if (url.searchParams.get("pop") === projectId) {
        return;
    }

    url.searchParams.set("pop", projectId);
    window.history.pushState(null, "", url);
}

function removeProjectFromUrl() {
    const url = new URL(window.location.href);

    if (!url.searchParams.has("pop")) {
        return;
    }

    url.searchParams.delete("pop");
    window.history.replaceState(null, "", url);
}

function renderMarkdown(markdown, container, projectName) {
    const fragment = document.createDocumentFragment();
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    let paragraph = [];
    let list = null;

    const flushParagraph = () => {
        if (paragraph.length === 0) {
            return;
        }

        const element = document.createElement("p");
        appendInlineMarkdown(element, paragraph.join(" "));
        fragment.append(element);
        paragraph = [];
    };

    const closeList = () => {
        list = null;
    };

    lines.forEach((line, index) => {
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        const listMatch = line.match(/^[-*]\s+(.+)$/);

        if (headingMatch) {
            flushParagraph();
            closeList();

            const headingText = headingMatch[2].trim();
            const isRepeatedTitle = index === 0 &&
                headingMatch[1].length === 1 &&
                headingText.toLocaleLowerCase() === projectName.toLocaleLowerCase();

            if (!isRepeatedTitle) {
                const heading = document.createElement(
                    `h${Math.min(headingMatch[1].length + 2, 6)}`
                );
                appendInlineMarkdown(heading, headingText);
                fragment.append(heading);
            }
            return;
        }

        if (listMatch) {
            flushParagraph();

            if (!list) {
                list = document.createElement("ul");
                fragment.append(list);
            }

            const item = document.createElement("li");
            appendInlineMarkdown(item, listMatch[1]);
            list.append(item);
            return;
        }

        if (!line.trim()) {
            flushParagraph();
            closeList();
            return;
        }

        closeList();
        paragraph.push(line.trim());
    });

    flushParagraph();

    if (!fragment.hasChildNodes()) {
        fragment.append(createMessage("No description available."));
    }

    container.replaceChildren(fragment);
}

function appendInlineMarkdown(container, text) {
    const tokenPattern = /\[([^\]]+)]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = tokenPattern.exec(text)) !== null) {
        container.append(document.createTextNode(text.slice(lastIndex, match.index)));

        if (match[1] !== undefined) {
            const link = document.createElement("a");
            const href = getSafeHref(match[2]);

            link.textContent = match[1];
            if (href) {
                link.href = href;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                container.append(link);
            } else {
                container.append(document.createTextNode(match[1]));
            }
        } else if (match[3] !== undefined) {
            const code = document.createElement("code");
            code.textContent = match[3];
            container.append(code);
        } else {
            const strong = document.createElement("strong");
            strong.textContent = match[4];
            container.append(strong);
        }

        lastIndex = tokenPattern.lastIndex;
    }

    container.append(document.createTextNode(text.slice(lastIndex)));
}

function getSafeHref(value) {
    try {
        const url = new URL(value, document.baseURI);
        return ["http:", "https:"].includes(url.protocol) ? url.href : null;
    } catch {
        return null;
    }
}

function createMessage(text) {
    const message = document.createElement("p");
    message.className = "project-message";
    message.textContent = text;
    return message;
}
