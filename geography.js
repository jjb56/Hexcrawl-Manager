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

function updateTerrainProperty(property, value) {
    const terrainId = app.state.selectedTerrain;
    if (!terrainId) return;
    app.data.map.geography[terrainId][property] = value;
    renderMap();
    const terrainButton = document.querySelector(`.geography-terrain[data-terrain-id="${terrainId}"]`);
    if (terrainButton) {
        const terrain = app.data.map.geography[terrainId];
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

function deleteTerrain(terrainId) {
    const terrain = app.data.map.geography[terrainId];
    const usageCount = getTerrainUsageCount(terrainId);
    if (usageCount > 0) {
        showMessage(`Cannot delete ${terrain.name}; ${usageCount} ${terrain.name} cell${usageCount === 1 ? "" : "s"} still exist.`, "error");
        return;
    }
    delete app.data.map.geography[terrainId];
    app.state.selectedTerrain = null;
    renderMap();
    renderGeographyProperties();
    showMessage(`${terrain.name} terrain deleted.`);
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
    document.querySelectorAll(".geography-terrain").forEach(button => {
        button.addEventListener("click", () => {
            selectTerrain(button.dataset.terrainId);
        });
    });
    const terrainNameInput = document.getElementById("terrain-name");
    const terrainIconInput = document.getElementById("terrain-icon");
    const terrainBackgroundColorInput = document.getElementById("terrain-background-color");
    const terrainIconColorInput = document.getElementById("terrain-icon-color");
    if (terrainNameInput) {
        terrainNameInput.addEventListener("input", event => {
            updateTerrainProperty("name", event.target.value);
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
    document.getElementById("add-terrain-button").addEventListener("click", () => {
        // TODO: Add terrain creation in Phase 6E.
    });
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