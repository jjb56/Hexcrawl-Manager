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
        name: "New Terrain",
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
    const roll_tables = {};
    for (const roll_table_id of terrain_data.roll_table_ids) {
        if (app.data.roll_tables[roll_table_id] !== undefined) {
            roll_tables[roll_table_id] = structuredClone(app.data.roll_tables[roll_table_id]);
        }
    }

    //create actions
    const do_action = () => {
        delete app.data.geography[terrain_id];
        for (const roll_table_id of terrain_data.roll_table_ids) {
            delete app.data.roll_tables[roll_table_id];
        }
        renderHexes();
    };
    const undo_action = () => {
        app.data.geography[terrain_id] = structuredClone(terrain_data);
        for (const roll_table_id in roll_tables) {
            app.data.roll_tables[roll_table_id] = structuredClone(roll_tables[roll_table_id]);
        }
        renderHexes();
    };

    //execute actions
    do_action();
    commitToHistory(`Deleted ${terrain_data.name}`, undo_action, do_action);
}


//========================================================================================================================================
//              Render Functions
//========================================================================================================================================
/**
 * Renders the list of existing terrains as clickable elements.
 * @returns {void}
 */
function renderTerrainList() {
    // Renders the full list of geography
    const div = document.getElementById("terrain-list");
    let selected_div_id = null;
    let selected_terrain_index = null;
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

        const icon = document.createElement("div");
        icon.className = "terrain-preview";
        icon.style.backgroundColor = terrain.background_color;
        // icon.style.color = terrain.icon_color;

        const icon_data = icon_list.find(item => item.id === terrain.icon);
        const image = document.createElement("img");
        image.className = "icon-display";
        image.style.backgroundColor = terrain.icon_color;
        image.style.mask = `url(${icon_data.src}) center / contain no-repeat`;

        // image.src = icon_data.src;
        // image.alt = icon_data.name;
        // image.style.backgroundColor = terrain.icon_color;
        // image.style.mask = `url(${icon_data.src}) center / contain no-repeat`;


        icon.appendChild(image);

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

    const inner_div = document.createElement("div");
    inner_div.className = "innerdiv";

    //name & background
    const name_row = document.createElement("div");
    name_row.className = "split-75-25";

    const name = document.createElement("input");
    name.id = `terrain-name${terrain_id}`;
    name.type = "text";
    name.value = terrain.name;
    name.dataset.historyPath = `geography.${terrain_id}.name`;
    name.defaultValue = "Terrain Name";

    const background = document.createElement("input");
    background.id = `terrain-background-color-${terrain_id}`;
    background.type = "color";
    background.value = terrain.background_color;
    background.dataset.historyPath = `geography.${terrain_id}.background_color`;

    name_row.appendChild(name);
    name_row.appendChild(background);

    //icon and icon color
    const icon_row = document.createElement("div");
    icon_row.className = "split-50-25-25";

    const label = document.createElement("span");
    label.textContent = "Terrain Icon";

    const icon_color = document.createElement("input");
    icon_color.id = `terrain-icon-color-${terrain_id}`;
    icon_color.type = "color";
    icon_color.value = terrain.icon_color;
    icon_color.dataset.historyPath = `geography.${terrain_id}.icon_color`;

    icon_row.appendChild(label);
    appendIconPicker(icon_row, `geography.${terrain_id}.icon`);
    icon_row.appendChild(icon_color);

    //tables prep
    const table_section = document.createElement("div");
    table_section.id = "roll-tables";

    const table_head = document.createElement("h4");
    table_head.textContent = "Roll Tables";

    const table_container = document.createElement("div");
    table_container.id = `terrain-roll-tables-${terrain_id}`;

    table_section.appendChild(table_head);
    table_section.appendChild(table_container);

    //assemble
    const details = document.createElement("h4");
    details.textContent = "Details";

    inner_div.appendChild(details);
    inner_div.appendChild(name_row);
    inner_div.appendChild(icon_row);
    inner_div.appendChild(table_section);
    editor.appendChild(inner_div);
    
    //update roll tables
    const table_div = editor.querySelector(`#terrain-roll-tables-${terrain_id}`);

    const add_roll_table_button = document.createElement("button");
    add_roll_table_button.textContent = "+ Add Roll Table";
    add_roll_table_button.className = "good-button";
    add_roll_table_button.onclick = () => createRollTable("geography", terrain_id);

    // re-render terrain info when any field inside the terrain editor changes
    editor.addEventListener("change", event => {
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


