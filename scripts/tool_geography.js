/*
    This file contains all related functionality for the geography tool.
*/

let expanded_terrain = null;

//========================================================================================================================================
//              Main Functions
//========================================================================================================================================

/**
 * Adds a new terrain type to the geography tool
 * @returns {void}
 */
function addTerrainType() {
    //set data
    const terrain_id = app.data.next_id++;
    const terrain_data = {
        name: `New Terrain ${terrain_id}`,
        background_color: "#4481b9",
        icon: "?",
        icon_color: "#ffffff",
        roll_table_ids: []
    }

    //create actions
    const do_action = () => app.data.geography[terrain_id] = structuredClone(terrain_data);
    const undo_action = () => delete app.data.geography[terrain_id];

    //execute actions
    do_action();
    commitToHistory(`Added terrain ${terrain_data.name}`, undo_action, do_action);
}

/**
 * Deletes a terrain type from the geography tool.
 * @param {number} terrain_id The ID of the terrain to delete.
 * @returns {void}
 */
function deleteTerrainType(terrain_id) {
    //set data
    const terrain_data = structuredClone(app.data.geography[terrain_id]);

    //create actions
    const do_action = () => delete app.data.geography[terrain_id];
    const undo_action = () => app.data.geography[terrain_id] = structuredClone(terrain_data);

    //execute actions
    do_action();
    commitToHistory(`Deleted ${terrain_data.name}`, undo_action, do_action);
}

// ======================== May Be Optional Under New Framework ========================

/**
 * Updates the name of the selected terrain to the value given.
 * @param {*} terrain_id The ID of the terrain to update.
 * @param {*} value The new name of the terrain
 * @returns {void}
 */
function updateTerrainName(terrain_id, value) {
    //set data
    const old_value = app.data.geography[terrain_id].name;
    if (old_value === value) return;

    //create actions
    const do_action = () => app.data.geography[terrain_id].name = value;
    const undo_action = () => app.data.geography[terrain_id].name = old_value;

    //execute actions
    do_action();
    commitToHistory(`Renamed ${old_value} to ${value}`, undo_action, do_action);
}

function updateTerrainBackgroundColor(terrain_id, value) {
    // Updates the background color of the selected terrain
    //set data
    const old_value = app.data.geography[terrain_id].background_color;
    if (old_value === value) return;

    //create actions
    const do_action = () => app.data.geography[terrain_id].background_color = value;
    const undo_action = () => app.data.geography[terrain_id].background_color = old_value;

    //execute actions
    do_action();
    commitToHistory(`Changed ${app.data.geography[terrain_id].name} background color`, undo_action, do_action);
}

function updateTerrainIcon(terrain_id, value) {
    // Updates the icon of the selected terrain
    //set data
    const old_value = app.data.geography[terrain_id].icon;
    if (old_value === value) return;

    //create actions
    const do_action = () => app.data.geography[terrain_id].icon = value;
    const undo_action = () => app.data.geography[terrain_id].icon = old_value;

    //execute actions
    do_action();
    commitToHistory(`Changed ${app.data.geography[terrain_id].name} icon`, undo_action, do_action);
}

function updateTerrainIconColor(terrain_id, value) {
    // Updates the icon color of the selected terrain
    //set data
    const old_value = app.data.geography[terrain_id].icon_color;
    if (old_value === value) return;

    //create actions
    const do_action = () => app.data.geography[terrain_id].icon_color = value;
    const undo_action = () => app.data.geography[terrain_id].icon_color = old_value;

    //execute actions
    do_action();
    commitToHistory(`Changed ${app.data.geography[terrain_id].name} icon color`, undo_action, do_action);
}

//may be optional
function saveTerrainChanges(terrain_id, div_element) {
    //update the ids of the changed items
    clearTimeout(edit_timer);

    const name = div_element.querySelector(`#terrain-name-${terrain_id}`).value;
    const background_color = div_element.querySelector(`#terrain-background-color-${terrain_id}`).value;
    const icon = div_element.querySelector(`#terrain-icon-${terrain_id}`).value;
    const icon_color = div_element.querySelector(`#terrain-icon-color-${terrain_id}`).value;

    updateTerrainName(terrain_id, name);
    updateTerrainBackgroundColor(terrain_id, background_color);
    updateTerrainIcon(terrain_id, icon);
    updateTerrainIconColor(terrain_id, icon_color);
}

//========================================================================================================================================
//              Render Functions
//========================================================================================================================================
function renderTerrainList() {
    // Renders the full list of geography
    const div = document.getElementById("terrain-list");
    let selected_div_id = null;
    let selected_terrain_index = null
    div.innerHTML = "";

    if (Object.keys(app.data.geography).length === 0) {
        div.innerHTML = "<p><i>No terrains exist. Add a new one below.</i></p>"
        return;
    }

    for (const terrain_id in app.data.geography) {
        const terrain = app.data.geography[terrain_id];
        
        const terrain_div = document.createElement("div");
        terrain_div.className = "terrain";
        terrain_div.id = `terrain-${terrain_id}`
        
        //make button
        const button = document.createElement("button");
        button.className = "terrain-button";

        const icon = document.createElement("span");
        icon.className = "terrain-preview";
        icon.textContent = terrain.icon;
        icon.style.backgroundColor = terrain.background_color;
        icon.style.color = terrain.icon_color;

        const name = document.createElement("span");
        name.className = "terrain-label";
        name.textContent = terrain.name;

        const tables = document.createElement("span");
        tables.className = "terrain-table-icons";
        let table_icons = "";
        if (terrain.roll_table_ids.length > 5) {
            table_icons += ` ▦ x${terrain.roll_table_ids.length}`;
        } else {
            for (const roll_table_id of terrain.roll_table_ids) {
                table_icons += " ▦";
            }
        }
        tables.textContent = table_icons;

        button.appendChild(icon);
        button.appendChild(name);
        button.appendChild(tables);
        button.onclick = () => {
            expanded_terrain = (expanded_terrain === terrain_id) ? null : terrain_id;
            renderTerrainList();
        };

        //put together
        div.appendChild(terrain_div);
        terrain_div.appendChild(button);

        if (expanded_terrain !== terrain_id) continue;
        const terrain_innerdiv = document.createElement("div");
        terrain_innerdiv.id = `terrain-inner-${terrain_id}`;
        terrain_div.appendChild(terrain_innerdiv);
        
        selected_div_id = terrain_innerdiv.id;
        selected_terrain_index = terrain_id;
    }
    if (selected_div_id !== null) renderTerrain(selected_div_id, selected_terrain_index);
}

function renderTerrain(div_id, terrain_id) {
    // Renders the editor of the given terrain within the given div
    const terrain = app.data.geography[terrain_id];
    const editor = document.createElement("div");
    editor.className = "terrain-editor";
    editor.innerHTML = "";
    editor.innerHTML = `
        <div class="innerdiv">
            name <input id="terrain-name-${terrain_id}" type="text" value="${terrain.name}">
            background color <input id="terrain-background-color-${terrain_id}" type="color" value="${terrain.background_color}">
            icon <input id="terrain-icon-${terrain_id}" type="text" value="${terrain.icon}">
            icon color <input id="terrain-icon-color-${terrain_id}" type="color" value="${terrain.icon_color}">
            <div id="roll-tables">
                <h4>Roll Tables</h4>
                <div id="terrain-roll-tables-${terrain_id}"></div>
            </div>
        </div>
    `;
    const table_div = editor.querySelector(`#terrain-roll-tables-${terrain_id}`);

    //roll tables
    const add_roll_table_button = document.createElement("button");
    add_roll_table_button.textContent = "+ Add Roll Table";
    add_roll_table_button.className = "good-button";
    add_roll_table_button.onclick = () => createRollTable("geography", terrain_id);

    //save
    const inputs = editor.querySelectorAll("input");

    inputs.forEach(input => {
        input.onblur = () => saveTerrainChanges(terrain_id, editor);
    });

    // re-render terrain info when any field inside the terrain editor loses focus
    editor.addEventListener("focusout", event => {
        if (event.target.matches("input, textarea, select")) {
            setTimeout(() => renderTerrainList(), 0);
        }
    });

    //delete button
    const delete_button = document.createElement("button");
    delete_button.textContent = `Delete ${terrain.name}`;
    delete_button.className = "bad-button";
    delete_button.onclick = () => {
        deleteTerrainType(terrain_id);
        expanded_terrain = null;
        renderTerrainList();
    };

    editor.appendChild(delete_button);

    const container = document.getElementById(div_id);
    container.innerHTML = "";
    container.appendChild(editor);

    renderRollTables(`terrain-roll-tables-${terrain_id}`, terrain.roll_table_ids, false, "geography", terrain_id);
    table_div.appendChild(add_roll_table_button);
}

function renderGeographyTool() {
    // Renders the initialization of the geography tool when selected.
    // is this function actually needed?
}

//========================================================================================================================================
//              Event Listeners
//========================================================================================================================================
const addNewTerrainBtn = document.querySelector("#add-new-terrain-button");
if (addNewTerrainBtn) {
    // Use onclick assignment so repeated script execution doesn't stack listeners
    addNewTerrainBtn.onclick = () => {
        addTerrainType();
        renderTerrainList();
    };
}


