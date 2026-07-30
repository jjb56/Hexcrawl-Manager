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