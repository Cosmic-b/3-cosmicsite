const form = document.querySelector("#project-form");
const output = document.querySelector("#output");
const databaseList = document.querySelector("#database-list");
const status = document.querySelector("#status");
const nameInput = document.querySelector("#name");
const typeInput = document.querySelector("#type");
const submitButton = document.querySelector("#submit-button");
const cancelButton = document.querySelector("#cancel-button");
const jsonFileInput = document.querySelector("#json-file");
const saveFilenameInput = document.querySelector("#save-filename");
const saveJsonButton = document.querySelector("#save-json-button");

let projects = [];
let editingIndex = null;

form.addEventListener("submit", event => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const type = typeInput.value;
    const id = formatId(name);

    if (!id) {
        showStatus("Enter a name containing at least one letter or number.", true);
        nameInput.focus();
        return;
    }

    const duplicateIndex = projects.findIndex(project =>
        project.id === id || project.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicateIndex !== -1 && duplicateIndex !== editingIndex) {
        showStatus("A project with that name or ID already exists.", true);
        nameInput.focus();
        return;
    }

    const project = createProject(name, type);

    if (editingIndex === null) {
        projects.push(project);
        showStatus(`Added "${project.name}".`);
    } else {
        projects[editingIndex] = project;
        showStatus(`Updated "${project.name}".`);
    }

    resetForm();
    renderDatabase();
});

function formatId(name) {
    return name
        .trim()
        .toLowerCase()
        .normalize("NFKC")
        .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
        .replace(/^-|-$/g, "");
}

function createProject(name, type) {
    const id = formatId(name);

    return {
        id,
        name: name.trim(),
        type,
        splashImage: `./assets/projects/${id}/splash.webp`,
        thumbnailImage: `./assets/projects/${id}/thumbnail.webp`,
        mdDescription: `./assets/projects/${id}/${id}.md`
    };
}

async function loadProjects() {
    try {
        const response = await fetch("./projects.json");

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("The JSON root must be an array.");
        }

        projects = removeDuplicateProjects(data);
        showStatus(`Loaded ${projects.length} project(s) from projects.json.`);
    } catch (error) {
        projects = [];
        showStatus(
            `Could not load projects.json; started with an empty database. ${error.message}`,
            true
        );
    }

    renderDatabase();
}

function removeDuplicateProjects(data) {
    const usedIds = new Set();
    const usedNames = new Set();

    return data.filter(project => {
        if (!project || typeof project.name !== "string") {
            return false;
        }

        const normalizedProject = createProject(
            project.name,
            project.type === "music" ? "music" : "dev"
        );
        const normalizedName = normalizedProject.name.toLowerCase();

        if (
            !normalizedProject.id ||
            usedIds.has(normalizedProject.id) ||
            usedNames.has(normalizedName)
        ) {
            return false;
        }

        usedIds.add(normalizedProject.id);
        usedNames.add(normalizedName);
        Object.assign(project, normalizedProject);
        return true;
    });
}

function renderDatabase() {
    if (projects.length === 0) {
        databaseList.innerHTML = '<p class="empty-state">No projects yet.</p>';
    } else {
        databaseList.innerHTML = projects.map((project, index) => `
            <article class="project-card">
                <div>
                    <h2>${escapeHtml(project.name)}</h2>
                    <p><strong>ID:</strong> ${escapeHtml(project.id)}</p>
                    <p><strong>Type:</strong> ${escapeHtml(project.type)}</p>
                </div>
                <div class="project-actions">
                    <button type="button" data-action="modify" data-index="${index}">
                        Modify
                    </button>
                    <button type="button" data-action="delete" data-index="${index}">
                        Delete
                    </button>
                </div>
            </article>
        `).join("");
    }

    output.textContent = JSON.stringify(projects, null, 2);
}

databaseList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const index = Number(button.dataset.index);
    const project = projects[index];

    if (!project) {
        return;
    }

    if (button.dataset.action === "delete") {
        projects.splice(index, 1);
        resetForm();
        renderDatabase();
        showStatus(`Deleted "${project.name}".`);
        return;
    }

    editingIndex = index;
    nameInput.value = project.name;
    typeInput.value = project.type;
    submitButton.textContent = "Save changes";
    cancelButton.hidden = false;
    nameInput.focus();
    showStatus(`Modifying "${project.name}".`);
});

cancelButton.addEventListener("click", () => {
    resetForm();
    showStatus("Changes cancelled.");
});

jsonFileInput.addEventListener("change", async () => {
    const file = jsonFileInput.files[0];

    if (!file) {
        return;
    }

    try {
        const data = JSON.parse(await file.text());

        if (!Array.isArray(data)) {
            throw new Error("The JSON root must be an array.");
        }

        const importedProjects = removeDuplicateProjects(data);
        const skippedCount = data.length - importedProjects.length;

        projects = importedProjects;
        resetForm();
        renderDatabase();
        showStatus(
            `Loaded ${projects.length} project(s) from "${file.name}".` +
            (skippedCount ? ` Skipped ${skippedCount} invalid or duplicate item(s).` : "")
        );
    } catch (error) {
        showStatus(`Could not import "${file.name}": ${error.message}`, true);
    }
});

saveJsonButton.addEventListener("click", () => {
    const filename = formatJsonFilename(saveFilenameInput.value);
    const contents = `${JSON.stringify(projects, null, 2)}\n`;
    const blob = new Blob([contents], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = filename;
    downloadLink.click();
    URL.revokeObjectURL(downloadUrl);

    saveFilenameInput.value = filename;
    showStatus(`Saved ${projects.length} project(s) to "${filename}".`);
});

function formatJsonFilename(value) {
    const filename = value
        .trim()
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
        .replace(/^\.+/, "");
    const safeFilename = filename || "projects";

    return safeFilename.toLowerCase().endsWith(".json")
        ? safeFilename
        : `${safeFilename}.json`;
}

function resetForm() {
    form.reset();
    editingIndex = null;
    submitButton.textContent = "Add";
    cancelButton.hidden = true;
}

function showStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("error", isError);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

loadProjects();
