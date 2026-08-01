/* ******************************************************************************************************************
   *                                                                                                                *
   *                                         DEBREUT'S HEXCRAWL MANAGER                                             *
   *                                                                                                                *
   ******************************************************************************************************************/

/* ==================================================================================================================
    APPLICATION STATES
   ================================================================================================================== */
const APP_STATES = Object.freeze({
    NONE: "NONE",
    HEX_INFO: "HEX_INFO",
    HEX_GRID: "HEX_GRID",
    FACTIONS: "FACTIONS",
    GEOGRAPHY: "GEOGRAPHY"
});

/* ==================================================================================================================
   HEX PROPERTY DEFINITIONS
   ================================================================================================================== */
const HEX_PROPERTY_TYPES = Object.freeze({
    DESCRIPTION: "description",
    FACTION: "factions",
    NOTES: "notes",
    CITY: "cities",
    ROLL_TABLE: "rollTables",
    LANDMARK: "landmarks"
});
const HEX_REPEATABLE_PROPERTIES = Object.freeze(["factions", "notes", "cities", "rollTables", "landmarks"]);

/* ==================================================================================================================
   APPLICATION
   ================================================================================================================== */
const app = {
    state: {
        currentState: APP_STATES.NONE,
        selectedHex: null,
        tool: null,
        selectedTerrain: null,
        paintMode: null,
        pendingEdit: null,
        history: {
            undo: [],
            redo: [],
            maxHistory: 128
        },
        document: {
            name: "Untitled.json",
            hasUnsavedChanges: false
        },
    },
    data: {
        map: createDefaultMap()
    }
};

function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = value ?? "";
    return element.innerHTML;
}

/* ==================================================================================================================
   MESSAGES
   ================================================================================================================== */
function showMessage(text, type = "success") {
    const messages = document.getElementById("messages");
    const message = document.createElement("div");
    message.classList.add("message", type);
    message.textContent = text;
    messages.appendChild(message);
    setTimeout(() => {
        message.classList.add("fade-out");
        setTimeout(() => {
            message.remove();
        }, 500);
    }, 3000);
}

function commitAction(action) {
    const history = app.state.history;
    history.undo.push(action);
    history.redo = [];
    if (history.undo.length > history.maxHistory) {
        history.undo.shift();
    }
    app.state.document.hasUnsavedChanges = true;
    if (action.description) {
        showMessage(action.description);
    }
}

/* ==================================================================================================================
   INITIALIZATION
   ================================================================================================================== */
function createDefaultMap() {
    return {
        grid: {
            type: "hex-vertical",
            width: 10,
            height: 10,
            backgroundImage: null,
            backgroundWidth: 100,
            backgroundHeight: 100,
            showTerrainIcons: true,
            showTerrainColors: true
        },
        hexes: {},
        geography: {},
        factions: {}
    };
}

function initialize() {
    console.log("Initializing Debreut's Hexcrawl Manager...");
    setupPropertiesEvents();
    setupMenus();
    setupFileInput();
    render();
    showMessage("App Initialized");
}

/* ==================================================================================================================
   PROPERTIES EVENTS
   ================================================================================================================== */
function setupPropertiesEvents() {
    const propertiesWindow = document.getElementById("properties-window");
    propertiesWindow.addEventListener("click", event => {
        if (event.target.id === "add-hex-info") {
            const select = document.getElementById("hex-property-select");
            addHexProperty(select.value);
            return;
        }
        const removeButton = event.target.closest(".remove-hex-property");
        if (removeButton) {
            const property = removeButton.dataset.property;
            const index = Number(removeButton.dataset.index);
            removeHexProperty(property, index);
            return;
        }
    });
    propertiesWindow.addEventListener("input", event => {
        const hex = getSelectedHexData();
        if (!hex) { return; }
        if (event.target.id === "hex-description") {
            hex.description = event.target.value;
            return;
        }
        if (event.target.classList.contains("hex-note-input")) {
            const index = Number(event.target.dataset.index);
            hex.notes[index] = event.target.value;
            return;
        }
        if (event.target.classList.contains("hex-city-name")) {
            const index = Number(event.target.dataset.index);
            hex.cities[index].name = event.target.value;
            return;
        }
        if (event.target.classList.contains("hex-city-description")) {
            const index = Number(event.target.dataset.index);
            hex.cities[index].description = event.target.value;
            return;
        }
        if (event.target.classList.contains("hex-landmark-name")) {
            const index = Number(event.target.dataset.index);
            hex.landmarks[index].name = event.target.value;
            return;
        }
        if (event.target.classList.contains("hex-landmark-description")) {
            const index = Number(event.target.dataset.index);
            hex.landmarks[index].description = event.target.value;
            return;
        }
        if (event.target.classList.contains("hex-rolltable-name")) {
            const index = Number(event.target.dataset.index);
            hex.rollTables[index].name = event.target.value;
            return;
        }
        if (event.target.classList.contains("hex-rolltable-table")) {
            const index = Number(event.target.dataset.index);
            hex.rollTables[index].table = event.target.value;
        }
    });
    propertiesWindow.addEventListener("change", event => {
        const hex = getSelectedHexData();
        if (!hex) { return; }
        if (event.target.classList.contains("hex-faction-select")) {
            const index = Number(event.target.dataset.index);
            hex.factions[index] = event.target.value || null;
            renderMap();
        }
    });
}

/* ==================================================================================================================
   STATE MACHINE
   ================================================================================================================== */
function setState(newState) {
    if (!Object.values(APP_STATES).includes(newState)) {
        console.error("Invalid application state:", newState);
        return;
    }
    app.state.currentState = newState;
    render();
}

/* ==================================================================================================================
   HEX SELECTION AND STATE CHANGING
   ================================================================================================================== */
function selectHex(hexId) {
    // Select a hex. This is the ONLY function that should be used when something wants to select a hex.
    const[x, y] = hexId.split(",").map(Number);
    const width = app.data.map.grid.width;
    const height = app.data.map.grid.height;
    if (x < 0 || x >= width || y < 0 || y >= height) { // test if hex is within map
        console.error("Cannot select hex outside grid", hexId);
        return;
    }
    app.state.selectedHex = hexId; // Store the selection.
    app.state.currentState = APP_STATES.HEX_INFO; // Selecting a hex automatically puts the Properties window into HEX_INFO.
    render();
}

function clearSelection() {
    // Clear the current hex selection.
    app.state.selectedHex = null;
    app.state.currentState = APP_STATES.NONE;
    render();
}

function exitGeographyTool() {
    app.state.tool = null;
    app.state.currentState = app.state.selectedHex ? APP_STATES.HEX_INFO : APP_STATES.NONE;
    renderProperties();
}

function enterGeographyTool() {
    app.state.tool = "geography";
    app.state.currentState = APP_STATES.GEOGRAPHY;
    renderProperties();
}

function exitTool() {
    app.state.tool = null;
    renderProperties();
}

/* ==================================================================================================================
   HEX DATA
   ================================================================================================================== */
function getSelectedHexData() {
    const hexId = app.state.selectedHex;
    if (!hexId) {
        return null;
    }
    return app.data.map.hexes[hexId] || null;
}

function createHexData(hexId) {
    if (!app.data.map.hexes[hexId]) {
        app.data.map.hexes[hexId] = {
            terrain: null,
            description: "No special features"
        };
    }
    return app.data.map.hexes[hexId];
}

/* ==================================================================================================================
   PROPERTIES WINDOW
   ================================================================================================================== */
function renderProperties() {
    const propertyStates = document.querySelectorAll(".property-state");
    propertyStates.forEach(stateElement => {
        stateElement.classList.remove("active");
    });
    const activeState = document.querySelector(`.property-state[data-state="${app.state.currentState}"]`);
    if (activeState) {
        activeState.classList.add("active");
    }
    // State-specific content
    renderNoneProperties();
    renderHexInfoProperties();
    renderHexGridProperties();
    renderFactionProperties();
    renderGeographyProperties();
}

/* ==================================================================================================================
   NONE PROPERTIES
   ================================================================================================================== */
function renderNoneProperties() {
    const element = document.getElementById("properties-none");
    element.innerHTML = `
        <h2>Nothing Selected</h2>
        <p><i>Select something on the map to view its properties.</i></p>
    `;
}

/* ==================================================================================================================
   HEX INFO PROPERTIES
   ================================================================================================================== */
function renderHexInfoProperties() {
    const element = document.getElementById("properties-hex-info");
    const hexId = app.state.selectedHex;
    if (!hexId) {
        element.innerHTML = `
            <h2>No Hex Selected</h2>
            <p>Select a hex on the map.</p>
        `;
        return;
    }
    const hex = getSelectedHexData() || { terrain: null, description: "No special features" };
    const terrain = app.data.map.geography[hex.terrain];
    const terrainIcon = terrain ? terrain.icon : "";
    const terrainColor = terrain ? terrain.backgroundColor : "transparent"; //TODO add to hex header area
    const terrainIconColor = terrain ? terrain.iconColor : "inherit"; //TODO add to hex header  area
    // Include Basic Info Section
    let html = `
        <div id="hex-info-header" style="background: linear-gradient(to bottom, ${terrainColor}, ${terrainColor}, transparent); color: ${terrainIconColor};">
            <h2>Region ${hexId}</h2>
            <div class="property-group terrain-display">
                <h3>${terrain ? terrain.name : "None"} <span>${terrainIcon}</span></h3>
            </div>
            <div class="property-group description-display">
                <label for="hex-description">Description</label>
                <textarea id="hex-description" rows="4">${escapeHTML(hex.description) || "No special features"}</textarea>
            </div>
        </div>
    `;
    if (Array.isArray(hex.factions)) { // Include Factions
        hex.factions.forEach((factionId, index) => {
            let factionOptions = `<option value="">None</option>`;
            Object.entries(app.data.map.factions).forEach(([id, faction]) => {
                const selected = factionId === id ? "selected" : "";
                factionOptions += `<option value="${id}" ${selected}>${faction.name}</option>`;
            });
            html += `
                <div class="hex-info-entry">
                    <div class="hex-info-entry-header">
                        <strong>Faction ${index + 1}</strong>
                        <button class="remove-hex-property" data-property="factions" data-index="${index}" type="button">
                            Remove
                        </button>
                    </div>
                    <select class="hex-faction-select" data-index="${index}">${factionOptions}</select>
                </div>
            `;
        });
    }
    if (Array.isArray(hex.cities)) { // Include Cities
        hex.cities.forEach((city, index) => {
            html += `
                <div class="hex-info-entry">
                    <div class="hex-info-entry-header">
                        <strong>City ${index + 1}</strong>
                        <button class="remove-hex-property" data-property="cities" data-index="${index}" type="button">
                            Remove
                        </button>
                    </div>
                    <label>Name</label>
                    <input class="hex-city-name" data-index="${index}" type="text" value="${escapeHTML(city.name) || ""}">
                    <label>Description</label>
                    <textarea class="hex-city-description" data-index="${index}" rows="3">${escapeHTML(city.description) || ""}</textarea>
                </div>
            `;
        });
    }
    if (Array.isArray(hex.rollTables)) { // Include Roll Tables
        hex.rollTables.forEach((rollTable, index) => {
            html += `
                <div class="hex-info-entry">
                    <div class="hex-info-entry-header">
                        <strong>Roll Table ${index + 1}</strong>
                        <button class="remove-hex-property" data-property="rollTables" data-index="${index}" type="button">
                            Remove
                        </button>
                    </div>
                    <label>Name</label>
                    <input class="hex-rolltable-name" data-index="${index}" type="text" value="${escapeHTML(rollTable.name) || ""}">
                    <label>Table</label>
                    <textarea class="hex-rolltable-table" data-index="${index}" rows="5">${escapeHTML(rollTable.table) || ""}</textarea>
                </div>
            `;
        });
    }
    if (Array.isArray(hex.landmarks)) { // Include Landmarks
        hex.landmarks.forEach((landmark, index) => {
            html += `
                <div class="hex-info-entry">
                    <div class="hex-info-entry-header">
                        <strong>Landmark ${index + 1}</strong>
                        <button class="remove-hex-property" data-property="landmarks" data-index="${index}" type="button">
                            Remove
                        </button>
                    </div>
                    <label>Name</label>
                    <input class="hex-landmark-name" data-index="${index}" type="text" value="${escapeHTML(landmark.name) || ""}">
                    <label>Description</label>
                    <textarea class="hex-landmark-description" data-index="${index}" rows="3">${escapeHTML(landmark.description) || ""}</textarea>
                </div>
            `;
        });
    }
    if (Array.isArray(hex.notes)) { // Include Notes
        hex.notes.forEach((note, index) => {
            html += `
                <div class="hex-info-entry">
                    <div class="hex-info-entry-header">
                        <strong>Note ${index + 1}</strong>
                        <button class="remove-hex-property" data-property="notes" data-index="${index}" type="button">
                            Remove
                        </button>
                    </div>
                    <textarea class="hex-note-input" data-index="${index}" rows="3">${escapeHTML(note)}</textarea>
                </div>
            `;
        });
    }
    html += `
        <div class="hex-info-footer">
            <select id="hex-property-select">
                <option value="factions">Faction</option>
                <option value="landmarks">Landmark</option>
                <option value="cities">City</option>
                <option value="rollTables">Roll Table</option>
                <option value="notes">Note</option>
            </select>
            <button id="add-hex-info" type="button">
                + Add
            </button>
        </div>
    `;
    element.innerHTML = html;
}

/* ==================================================================================================================
   HEX GRID PROPERTIES
   ================================================================================================================== */
function renderHexGridProperties() {
    const element = document.getElementById("properties-hex-grid");
    element.innerHTML = `
        <h2>Hex Grid</h2>
        <p>Grid configuration will appear here.</p>
        <p>Width: ${app.data.map.grid.width}</p>
        <p>Height: ${app.data.map.grid.height}</p>
    `;
}

/* ==================================================================================================================
   FACTION PROPERTIES
   ================================================================================================================== */
function renderFactionProperties() {
    const element = document.getElementById("properties-factions");
    const factions = Object.values(app.data.map.factions);
    element.innerHTML = `
        <h2>Factions</h2>
        <p>${factions.length} faction(s)</p>
    `;
}

/* ==================================================================================================================
   GEOGRAPHY PROPERTIES
   ================================================================================================================== */
function selectTerrain(terrainId) {
    if (app.state.selectedTerrain === terrainId) {
        app.state.selectedTerrain = null;
    } else {
        app.state.selectedTerrain = terrainId;
        const terrain = app.data.map.geography[terrainId];
    }
    renderGeographyProperties();
}

function startTerrainEdit(terrainId, property) {
    if (app.state.pendingEdit) {
        commitPendingTerrainEdit();
    }
    const terrain = app.data.map.geography[terrainId];
    app.state.pendingEdit = {
        terrainId: terrainId,
        property: property,
        oldValue: structuredClone(terrain[property]),
        timer: null
    };
}

function commitPendingTerrainEdit() {
    const edit = app.state.pendingEdit;
    if (!edit) return;
    if (edit.timer) {
        clearTimeout(edit.timer);
    }
    const terrain = app.data.map.geography[edit.terrainId];
    if (!terrain) {
        app.state.pendingEdit = null;
        return;
    }
    const newValue = structuredClone(terrain[edit.property]);
    if (JSON.stringify(edit.oldValue) !== JSON.stringify(newValue)) {
        commitAction({
            type: "EDIT_TERRAIN",
            description: `Changed ${edit.property} of ${terrain.name}.`,
            undo: {
                terrainId: edit.terrainId,
                property: edit.property,
                value: structuredClone(edit.oldValue)
            },
            redo: {
                terrainId: edit.terrainId,
                property: edit.property,
                value: structuredClone(newValue)
            }
        });
    }
    app.state.pendingEdit = null;
}

function updateTerrainProperty(property, value) {
    const terrainId = app.state.selectedTerrain;
    if (!terrainId) return;
    const terrain = app.data.map.geography[terrainId];
    if (!terrain) return;
    if (!app.state.pendingEdit || app.state.pendingEdit.terrainId !== terrainId || app.state.pendingEdit.property !== property) {
        startTerrainEdit(terrainId, property);
    }
    terrain[property] = value;
    if (app.state.pendingEdit.timer) {
        clearTimeout(app.state.pendingEdit.timer);
    }
    app.state.pendingEdit.timer = setTimeout(() => {
        commitPendingTerrainEdit();
    }, 5000);
    renderMap();
    const terrainButton = document.querySelector(`.geography-terrain[data-terrain-id="${terrainId}"]`);
    if (terrainButton) {
        const preview = terrainButton.querySelector(".terrain-preview");
        if (preview) {
            preview.textContent = terrain.icon;
            preview.style.backgroundColor = terrain.backgroundColor;
            preview.style.color = terrain.iconColor;
        }
        const textNode = Array.from(terrainButton.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        if (textNode) {
            textNode.textContent = ` ${terrain.name}`;
        }
    }
}

function getTerrainUsageCount(terrainId) {
    let count = 0;
    Object.values(app.data.map.hexes).forEach(hex => {
        if (hex.terrain === terrainId) {
            count++;
        }
    });
    return count;
}

function updateHexVisual(hexId) {
    const hex = document.querySelector(`.hex[data-hex-id="${hexId}"]`);
    if (!hex) return;
    const hexData = app.data.map.hexes[hexId];
    const grid = app.data.map.grid;
    const terrain = hexData && hexData.terrain ? app.data.map.geography[hexData.terrain] : null;
    const faction = hexData && hexData.faction ? app.data.map.factions[hexData.faction] : null;
    const existingFactionMarker = hex.querySelector(".faction-marker");
    if (existingFactionMarker) existingFactionMarker.remove();
    const existingTerrainIcon = hex.querySelector(".terrain-icon");
    if (existingTerrainIcon) existingTerrainIcon.remove();
    if (terrain && grid.showTerrainColors) {
        hex.style.backgroundColor = terrain.backgroundColor;
    } else {
        hex.style.backgroundColor = "";
    }
    if (faction) {
        const factionMarker = document.createElement("span");
        factionMarker.classList.add("faction-marker");
        factionMarker.textContent = faction.icon;
        factionMarker.style.color = faction.color;
        hex.appendChild(factionMarker);
    }
    if (terrain && grid.showTerrainIcons) {
        const terrainIcon = document.createElement("span");
        terrainIcon.classList.add("terrain-icon");
        terrainIcon.textContent = terrain.icon;
        terrainIcon.style.color = terrain.iconColor;
        hex.appendChild(terrainIcon);
    }
}

function paintTerrain(hexId, terrainId) {
    if (!terrainId) return;
    if (!app.data.map.geography[terrainId]) return;
    if (!app.data.map.hexes[hexId]) {
        app.data.map.hexes[hexId] = {
            terrain: null,
            faction: null
        };
    }
    app.data.map.hexes[hexId].terrain = terrainId;
    updateHexVisual(hexId);
}

function eraseTerrain(hexId) {
    if (!app.data.map.hexes[hexId]) return;
    app.data.map.hexes[hexId].terrain = null;
    updateHexVisual(hexId);
}

function deleteTerrain(terrainId) {
    const terrain = app.data.map.geography[terrainId];
    const usageCount = getTerrainUsageCount(terrainId);
    if (usageCount > 0) {
        showMessage(`Cannot delete ${terrain.name}; ${usageCount} ${terrain.name} cell${usageCount === 1 ? "" : "s"} still exist.`, "error");
        return;
    }
    const deletedTerrain = structuredClone(terrain);
    delete app.data.map.geography[terrainId];
    app.state.selectedTerrain = null;
    renderMap();
    renderGeographyProperties();
    commitAction("DELETE_TERRAIN", `${terrain.name} terrain deleted.`, {
        terrainId: terrainId,
        terrain: deletedTerrain
    });
}

function addTerrain() {
    const terrainId = `terrain_${Date.now()}`;
    const terrain = {
        name: "New Terrain",
        icon: "?",
        backgroundColor: "#334155",
        iconColor: "#ffffff",
        rollTable: null
    };
    app.data.map.geography[terrainId] = terrain;
    app.state.selectedTerrain = terrainId;
    renderMap();
    renderGeographyProperties();
    commitAction("CREATE_TERRAIN", "New terrain created.", {
        terrainId: terrainId,
        terrain: structuredClone(terrain)
    });
}

function renderGeographyProperties() {
    const element = document.getElementById("properties-geography");
    const geography = Object.entries(app.data.map.geography);
    let terrainHTML = "";
    geography.forEach(([terrainId, terrain]) => {
        const selected = app.state.selectedTerrain === terrainId;
        const selectedClass = selected ? " selected" : "";
        terrainHTML += `
            <button class="geography-terrain${selectedClass}" data-terrain-id="${terrainId}" type="button">
                <span class="terrain-preview" style="background-color: ${terrain.backgroundColor}; color: ${terrain.iconColor};">${terrain.icon}</span>
                ${escapeHTML(terrain.name)}
            </button>
        `;
        let rollTableHTML = "";
        if (terrain.rollTable) {
            rollTableHTML = `
                <div class="terrain-roll-table">
                    <h4>Roll Table</h4>

                    <table id="terrain-roll-table">
                        <thead>
                            <tr>
                                ${terrain.rollTable.headers.map((header, column) => `
                                    <th>
                                        <input
                                            type="text"
                                            class="roll-table-header"
                                            data-column="${column}"
                                            value="${escapeHTML(header)}">
                                    </th>
                                `).join("")}
                                <th></th>
                            </tr>
                        </thead>

                        <tbody>
                            ${terrain.rollTable.rows.map((row, rowIndex) => `
                                <tr>
                                    ${row.map((cell, column) => `
                                        <td>
                                            <input
                                                type="text"
                                                class="roll-table-cell"
                                                data-row="${rowIndex}"
                                                data-column="${column}"
                                                value="${escapeHTML(cell)}">
                                        </td>
                                    `).join("")}

                                    <td>
                                        <button
                                            class="delete-roll-row"
                                            data-row="${rowIndex}"
                                            type="button">
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>

                    <button id="add-roll-table-row" type="button">
                        + Add Row
                    </button>
                </div>
            `;
        } else {
            rollTableHTML = `
                <div class="terrain-roll-table">
                    <h4>Roll Table</h4>
                    <p>No roll table.</p>
                    <button id="add-roll-table-button" type="button">
                        + Add Roll Table
                    </button>
                </div>
            `;
        }
        if (selected) {
            terrainHTML += `
                <div class="terrain-editor">
                    <label for="terrain-name">Name</label>
                    <input id="terrain-name" type="text" value="${escapeHTML(terrain.name)}">
                    <label for="terrain-icon">Icon</label>
                    <input id="terrain-icon" type="text" value="${escapeHTML(terrain.icon)}">
                    <label for="terrain-background-color">Background Color</label>
                    <input id="terrain-background-color" type="color" value="${terrain.backgroundColor}">
                    <label for="terrain-icon-color">Icon Color</label>
                    <input id="terrain-icon-color" type="color" value="${terrain.iconColor}">
                    ${rollTableHTML}
                    <p>Used by ${getTerrainUsageCount(terrainId)} hex(es)</p>
                    <button id="delete-terrain-button" type="button" ${getTerrainUsageCount(terrainId) > 0 ? "disabled" : ""}>Delete Terrain</button>
                </div>
            `;
        }
    });
    element.innerHTML = `
        <h2>Geography</h2>
        <h3>Terrain Types</h3>
        <div id="geography-terrain-list">${terrainHTML}</div>
        <button id="add-terrain-button" type="button">+ Add New Terrain</button>
        <button id="exit-geography-button" type="button">Exit Geography Tool</button>
    `;
    bindGeographyProperties();
}

function bindGeographyProperties() {
    bindTerrainButtons();
    bindTerrainEditor();
    bindRollTable();
    bindToolButtons();
}

function bindTerrainButtons() {
    document.querySelectorAll(".geography-terrain").forEach(button => {
        button.addEventListener("click", () => {
            selectTerrain(button.dataset.terrainId);
        });
    });
}

function bindTerrainEditor() {
    const terrainNameInput = document.getElementById("terrain-name");
    const terrainIconInput = document.getElementById("terrain-icon");
    const terrainBackgroundColorInput = document.getElementById("terrain-background-color");
    const terrainIconColorInput = document.getElementById("terrain-icon-color");
    if (terrainNameInput) {
        terrainNameInput.addEventListener("input", event => {
            updateTerrainProperty("name", event.target.value);
        });
        terrainNameInput.addEventListener("blur", () => {
            commitPendingTerrainEdit();
        });
    }
    if (terrainIconInput) {
        terrainIconInput.addEventListener("input", event => {
            updateTerrainProperty("icon", event.target.value);
        });
        terrainIconInput.addEventListener("blur", () => {
            commitPendingTerrainEdit();
        });
    }
    if (terrainBackgroundColorInput) {
        terrainBackgroundColorInput.addEventListener("input", event => {
            updateTerrainProperty("backgroundColor", event.target.value);
        });
        terrainBackgroundColorInput.addEventListener("blur", () => {
            commitPendingTerrainEdit();
        });
    }
    if (terrainIconColorInput) {
        terrainIconColorInput.addEventListener("input", event => {
            updateTerrainProperty("iconColor", event.target.value);
        });
        terrainIconColorInput.addEventListener("blur", () => {
            commitPendingTerrainEdit();
        });
    }
    if (terrainIconInput) {
        terrainIconInput.addEventListener("input", event => {
            updateTerrainProperty("icon", event.target.value);
        });
    }
    if (terrainBackgroundColorInput) {
        terrainBackgroundColorInput.addEventListener("input", event => {
            updateTerrainProperty("backgroundColor", event.target.value);
        });
    }
    if (terrainIconColorInput) {
        terrainIconColorInput.addEventListener("input", event => {
            updateTerrainProperty("iconColor", event.target.value);
        });
    }
}

function bindRollTable() {
    document.querySelectorAll(".roll-table-header").forEach(input => {
        input.addEventListener("input", event => {
            const column = Number(event.target.dataset.column);
            const terrain = app.data.map.geography[app.state.selectedTerrain];
            terrain.rollTable.headers[column] = event.target.value;
        });
    });
    document.querySelectorAll(".roll-table-cell").forEach(input => {
        input.addEventListener("input", event => {
            const row = Number(event.target.dataset.row);
            const column = Number(event.target.dataset.column);
            const terrain = app.data.map.geography[app.state.selectedTerrain];
            terrain.rollTable.rows[row][column] = event.target.value;
        });
    });
    const addRollTableRowButton = document.getElementById("add-roll-table-row");
    if (addRollTableRowButton) {
        addRollTableRowButton.addEventListener("click", () => {
            const terrain = app.data.map.geography[app.state.selectedTerrain];
            const nextRoll = String(terrain.rollTable.rows.length + 1);
            terrain.rollTable.rows.push([nextRoll, ""]);
            renderGeographyProperties();
        });
    }
    document.querySelectorAll(".delete-roll-row").forEach(button => {
        button.addEventListener("click", () => {
            deleteRollTableRow(Number(button.dataset.row));
        });
    });
    const addRollTableButton = document.getElementById("add-roll-table-button");
    if (addRollTableButton) {
        addRollTableButton.addEventListener("click", addTerrainRollTable);
    }
    const removeRollTableButton = document.getElementById("remove-roll-table-button");
    if (removeRollTableButton) {
        removeRollTableButton.addEventListener("click", removeTerrainRollTable);
    }
}

function bindToolButtons() {
    document.getElementById("add-terrain-button").addEventListener("click", addTerrain);
    const deleteTerrainButton = document.getElementById("delete-terrain-button");
    if (deleteTerrainButton) {
        deleteTerrainButton.addEventListener("click", () => {
            deleteTerrain(app.state.selectedTerrain);
        });
    }
    document.getElementById("exit-geography-button").addEventListener("click", exitGeographyTool);
}

function addTerrainRollTable() {
    const terrain = app.data.map.geography[app.state.selectedTerrain];
    terrain.rollTable = {
        headers: ["Roll", "Result"],
        rows: [
            ["1", ""]
        ]
    };
    renderGeographyProperties();
    showMessage("Roll table added.");
}

function deleteRollTableRow(rowIndex) {
    const terrain = app.data.map.geography[app.state.selectedTerrain];
        if (terrain.rollTable.rows.length <= 1) {
        terrain.rollTable = null;
        renderGeographyProperties();
        showMessage("Roll table removed.");
        return;
    }
    terrain.rollTable.rows.splice(rowIndex, 1);
    renderGeographyProperties();
    showMessage("Roll table row deleted.");
}

/* ==================================================================================================================
   MAP RENDERER
   ================================================================================================================== */
function renderMap() {
    const mapArea = document.getElementById("map-area");
    mapArea.onclick = (event) => {
        if (event.target !== mapArea) return;
        if (app.state.currentState === APP_STATES.GEOGRAPHY) {
            if (!app.state.selectedTerrain) {
                exitGeographyTool();
            }
            return;
        }
        clearSelection();
    };
    mapArea.innerHTML = "";
    const grid = app.data.map.grid;
    const width = grid.width;
    const height = grid.height;
    /*
        Temporary map sizing.

        We will replace this with the actual configurable grid geometry later.
    */
    const hexWidth = 70;
    const hexHeight = 80;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const hexId = `${x},${y}`;
            const hexData = app.data.map.hexes[hexId] || {
                terrain: null,
                faction: null
            };
            const terrain = app.data.map.geography[hexData.terrain];
            const faction = hexData.faction ? app.data.map.factions[hexData.faction] : null;
            const hex = document.createElement("div");
            hex.classList.add("hex");
            hex.dataset.hexId = hexId;
            // Temporary pointy-top hex positioning.
            const xPosition = x * hexWidth * 0.75;
            const yPosition = y * hexHeight + (x % 2) * (hexHeight / 2);
            hex.style.left = `${xPosition}px`;
            hex.style.top = `${yPosition}px`;
            // Terrain appearance
            if (terrain && grid.showTerrainColors) {
                hex.style.backgroundColor = terrain.backgroundColor;
            }
            // Selected state
            if (app.state.selectedHex === hexId) {
                hex.classList.add("selected");
            }
            // Faction indicator
            if (faction) {
                const factionMarker = document.createElement("span");
                factionMarker.classList.add("faction-marker");
                factionMarker.textContent = faction.icon;
                factionMarker.style.color = faction.color;
                hex.appendChild(factionMarker);
            }
            // Terrain icon
            if (terrain && grid.showTerrainIcons) {
                const terrainIcon = document.createElement("span");
                terrainIcon.classList.add("terrain-icon");
                terrainIcon.textContent = terrain.icon;
                terrainIcon.style.color = terrain.iconColor;
                hex.appendChild(terrainIcon);
            }
            // Coordinate label. Temporary and useful for testing.
            const coordinate = document.createElement("span");
            coordinate.classList.add("hex-coordinate");
            coordinate.textContent = hexId;
            hex.appendChild(coordinate);
            // Selection
            hex.addEventListener("click", (event) => {
                event.stopPropagation();
                if (app.state.currentState === APP_STATES.GEOGRAPHY) {
                    if (app.state.selectedTerrain) {
                        paintTerrain(hexId, app.state.selectedTerrain);
                    } else {
                        exitGeographyTool();
                        selectHex(hexId);
                    }
                    return;
                }
                selectHex(hexId);
            });
            hex.addEventListener("mousedown", (event) => {
                if (app.state.currentState !== APP_STATES.GEOGRAPHY) return;
                if (!app.state.selectedTerrain) return;

                if (event.button === 0) {
                    event.preventDefault();
                    app.state.isPainting = true;
                    app.state.paintMode = "paint";
                    paintTerrain(hexId, app.state.selectedTerrain);
                }

                if (event.button === 2) {
                    event.preventDefault();
                    app.state.isPainting = true;
                    app.state.paintMode = "erase";
                    eraseTerrain(hexId);
                }
            });
            hex.addEventListener("mouseenter", () => {
                if (!app.state.isPainting) return;
                if (app.state.currentState !== APP_STATES.GEOGRAPHY) return;

                if (app.state.paintMode === "paint") {
                    paintTerrain(hexId, app.state.selectedTerrain);
                }

                if (app.state.paintMode === "erase") {
                    eraseTerrain(hexId);
                }
            });
            hex.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                event.stopPropagation();
            });
            mapArea.appendChild(hex);
        }
    }
    document.onmouseup = () => {
        if (!app.state.isPainting) return;

        app.state.isPainting = false;
        app.state.paintMode = null;

        if (app.state.currentState === APP_STATES.GEOGRAPHY) {
            renderGeographyProperties();
        }
    };
}

/* ==================================================================================================================
   ADD HEX PROPERTY
   ================================================================================================================== */

function addHexProperty(property) {
    const hexId = app.state.selectedHex;
    if (!hexId) {
        return;
    }
    const hex = createHexData(hexId);
    if (property === "description") {
        return;
    }
    if (HEX_REPEATABLE_PROPERTIES.includes(property)) {
        if (!Array.isArray(hex[property])) { hex[property] = []; }
        switch (property) {
            case "factions":
                hex[property].push(null);
                break;
            case "notes":
                hex[property].push("New note.");
                break;
            case "cities":
                hex[property].push({name: "New City", description: ""});
                break;
            case "rollTables":
                hex[property].push({name: "New Roll Table", table: ""});
                break;
            case "landmarks":
                hex[property].push({ name: "New Landmark", description: "" });
                break;
        }
    }
    render();
}

/* ==================================================================================================================
   REMOVE HEX PROPERTY
   ================================================================================================================== */
function removeHexProperty(property, index) {
    const hex = getSelectedHexData();
    if (!hex || !HEX_REPEATABLE_PROPERTIES.includes(property)) {
        return;
    }
    if (!Array.isArray(hex[property])) {
        return;
    }
    hex[property].splice(index, 1);
    if (hex[property].length === 0) {
        delete hex[property];
    }
    const hasOnlyDefaultData = Object.keys(hex).every(key => key === "terrain" || key === "description");
    if (hasOnlyDefaultData && hex.terrain === null && hex.description === "No special features") {
        delete app.data.map.hexes[app.state.selectedHex];
    }
    render();
}

/* ==================================================================================================================
   SET UP MENU
   ================================================================================================================== */
function executeMenuAction(action) {
    switch (action) {
        case "FILE_NEW":
            newMap();
            break;

        case "FILE_OPEN":
            openDocument();
            break;

        case "FILE_SAVE":
            saveDocument();
            break;

        case "FILE_SAVE_AS":
            saveDocumentAs();
            break;

        case "EDIT_UNDO":
            undo();
            break;

        case "TOOLS_GEOGRAPHY":
            enterGeographyTool();
            break;
    }
}

function setupMenus() {
    const menuItems = document.querySelectorAll(".menu-item");
    menuItems.forEach(menuItem => {
        const button = menuItem.querySelector(".menu-button");
        button.addEventListener("click", event => {
            event.stopPropagation();
            const wasOpen = menuItem.classList.contains("open");
            menuItems.forEach(item => item.classList.remove("open"));
            if (!wasOpen) {
                menuItem.classList.add("open");
            }
        });
    });
    const geographyButton = document.getElementById("geography-tool-button");
    geographyButton.addEventListener("click", () => {
        enterGeographyTool();
        menuItems.forEach(item => item.classList.remove("open"));
    });
    document.addEventListener("click", () => {
        menuItems.forEach(item => item.classList.remove("open"));
    });
    document.getElementById("file-new-button").addEventListener("click", () => {
        executeMenuAction("FILE_NEW");
    });
    document.getElementById("file-save-button").addEventListener("click", () => {
        executeMenuAction("FILE_SAVE");
    });
    document.getElementById("file-open-button").addEventListener("click", () => {
        executeMenuAction("FILE_OPEN");
    });
    document.getElementById("file-save-as-button").addEventListener("click", () => {
        executeMenuAction("FILE_SAVE_AS");
    });
}

/* ==================================================================================================================
   FILE OPERATIONS
   ================================================================================================================== */
function newMap() {
    const confirmed = confirm(
        "Create a new map?\n\nAny unsaved changes will be lost."
    );
    if (!confirmed) {
        return;
    }
    app.data.map = createDefaultMap();
    app.state.selectedHex = null;
    app.state.selectedTerrain = null;
    app.state.currentState = APP_STATES.NONE;
    app.state.history.undoStack = [];
    app.state.history.redoStack = [];
    app.state.document.name = "Untitled.json";
    app.state.document.hasUnsavedChanges = false;
    render();
    commitAction({
        type: "NEW_MAP",
        description: "Created new map.",
        undo: null,
        redo: null
    });
}

function openDocument() {
    if (app.state.document.hasUnsavedChanges) {
        const confirmed = confirm(
            "Open another map?\n\nUnsaved changes will be lost."
        );
        if (!confirmed) {
            return;
        }
    }
    document.getElementById("file-input").click();
}

function saveDocument() {
    downloadDocument(app.state.document.name);
    app.state.document.hasUnsavedChanges = false;
    render();
    showMessage("Document saved.");
}

function saveDocumentAs() {
    let filename = prompt(
        "Enter a file name:",
        app.state.document.name
    );
    if (filename === null) {
        return;
    }
    filename = filename.trim();
    if (filename === "") {
        showMessage("Invalid file name.", "error");
        return;
    }
    if (!filename.toLowerCase().endsWith(".json")) {
        filename += ".json";
    }
    downloadDocument(filename);
    app.state.document.name = filename;
    app.state.document.hasUnsavedChanges = false;
    render();
    showMessage("Document saved as " + filename + ".");
}

function downloadDocument(filename) {
    const json = serializeDocument();
    const blob = new Blob([json], {
        type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function setupFileInput() {
    const input = document.getElementById("file-input");
    input.addEventListener("change", event => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }
        loadDocument(file);
        input.value = "";
    });
}

function loadDocument(file) {
    const reader = new FileReader();
    reader.onload = event => {
        try {
            const documentData = JSON.parse(event.target.result);
            importDocument(documentData);
            app.state.document.name = file.name;
            app.state.document.hasUnsavedChanges = false;
            render();
            showMessage("Document opened.");
        }
        catch {
            showMessage("Invalid document.", "error");
        }
    };
    reader.readAsText(file);
}

function importDocument(documentData) {
    app.data = documentData;
}

function serializeDocument() {
    return JSON.stringify(app.data, null, 4);
}

function updateWindowTitle() {
    let title = "";
    if (app.state.document.hasUnsavedChanges) {
        title += "*";
    }
    title += `Debreut's Hexcrawl Manager - ${app.state.document.name}`;
    document.title = title;
}

function updateFileName() {
    let fileName = `${app.state.document.name}`;
    fileName += app.state.document.hasUnsavedChanges ? "*" : " (saved)";
    let element = document.getElementById("file-name")
    element.innerHTML = `<i>${fileName}</i>`;
}

/* ==================================================================================================================
   MASTER RENDER
   ================================================================================================================== */
function render() {
    renderMap();
    renderProperties();
    updateWindowTitle();
    updateFileName();
}

/* ==================================================================================================================
   START
   ================================================================================================================== */
initialize();