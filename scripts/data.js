/*
    This file contains the framework for manipulating data within the app.
*/

let edit_timer = null;

document.addEventListener("change", event => {
    //get data
    const element = event.target;
    if (element.type === "file") return;
    if (!element.dataset.historyPath) return;
    const path = element.dataset.historyPath;
    const old_value = getDataFromHistoryPath(path);
    const new_value = getFormValue(element);
    if (old_value === new_value) return;

    //actions
    const do_action = () => {
        setDataFromHistoryPath(path, new_value);
        conditionalRenders(path);
    };
    const undo_action = () => { 
        setDataFromHistoryPath(path, old_value);
        conditionalRenders(path);
    };

    //execution
    do_action();
    commitToHistory(`Changed ${path}`, undo_action, do_action);
});

//========================================================================================================================================
//              Main Functions
//========================================================================================================================================
/**
 * Commits an action to the undo history and clears the redo history.
 * @param {string} action_name Short description of the edit made.
 * @param {Function} undo_method How to undo the change.
 * @param {Function} redo_method How to replicate the change.
 * @returns {void}
 */
function commitToHistory(action_name, undo_method, redo_method) {
    //Parameters: 
    //Functionality: Commits the action to the history stack
    //Example: commitToHistory("ACTION", remove hexes 3,2 and 3,4, add hexes 3,2 and 3,4);
    app.history.undo.push({
        name: action_name,
        undo: undo_method,
        redo: redo_method
    });
    console.log(action_name);
    // showMessage(action_name);
    //clear the redo stack if an edit is made.
    app.history.redo = [];
    updateHistoryButtons();
}

/**
 * Re-renders specific page elements based on the argument
 * @param {string} path The path tht is edited.
 * @returns {void}
 */
function conditionalRenders(path) {
    if (path.startsWith("geography.") && /\.(name|background_color|icon|icon_color)$/.test(path)) renderHexes();
    if (path.startsWith("factions.") && /\.(name|color|icon)$/.test(path)) renderHexes();
    if (path.includes(".factions.") && path.endsWith(".faction_id")) refreshFactionBorderNeighbors(app.selected_hex);

    //hex configuration
    if (path.startsWith("hex_configuration.")) {
        if (path.startsWith("hex_configuration.bg_")) {
            renderBackground();
            return;
        }
        renderHexes();
    }
}

/**
 * Retrieves a value from the application data object using a dot-separated property path.
 * @param {string} path Dot-separated path to the value in `app.data`.
 * @returns {*} The value stored at the specified path.
 */
function getDataFromHistoryPath(path) {
    return path.split(".").reduce((object, key) => object[key], app.data);
}

/**
 * Sets a value in the application data object using a dot-separated property path.
 * @param {string} path Dot-separated path to the destination in `app.data`.
 * @param {*} value The value to store at the specified path.
 * @returns {void}
 */
function setDataFromHistoryPath(path, value) {
    const keys = path.split(".");
    const last_key = keys.pop();

    const target = keys.reduce((object, key) => object[key], app.data);
    target[last_key] = value;

    // if (path.includes(".factions.") && path.endsWith(".faction_id")) {
    //     refreshFactionBorderNeighbors(app.selected_hex);
    // }
}

/**
 * Switches between different types of forms and returns its value.
 * @param {string} element The form to retrieve the value from.
 * @returns {*} The value of the form element.
 */
function getFormValue(element) {
    if (element.type === "checkbox") return element.checked;
    if (element.type === "number") return Number(element.value);
    if (element.dataset.valueType === "number") return element.value === "" ? null : Number(element.value);
    if (element.type === "radio") return element.checked ? element.value : null;
    return element.value;
}

//========================================================================================================================================
//              Roll Table Functions
//========================================================================================================================================
/**
 * Creates a new roll table and assigns ownership to an object.
 * The table itself is stored globally in `app.data.roll_tables`, while the owning object stores only its table ID.
 * @param {string} current_tool The collection that owns the table (e.g. "geography",  "factions", or "map").
 * @param {number} owner_id The ID of the owning object within the selected collection. 
 * @returns {void}
 */
function createRollTable(current_tool, owner_id) {
    //set data
    const table_id = app.data.next_id++;
    const table = {
        name: `Roll Table ${table_id}`,
        rows: [
            ["Roll", "Result"],
            ["", ""]
        ]
    }

    //create actions
    const render = () => refreshRollTableOwner(current_tool, owner_id);
    const do_action = () => {
        app.data.roll_tables[table_id] = structuredClone(table);
        app.data[current_tool][owner_id].roll_table_ids.push(table_id);
        render();
    };
    const undo_action = () => {
        delete app.data.roll_tables[table_id];
        app.data[current_tool][owner_id].roll_table_ids.pop();
        render();
    };

    //execute actions
    do_action();
    commitToHistory(`Added roll table to ${app.data[current_tool][owner_id].name}`, undo_action, do_action);
}

/**
 * Refreshes the roll table container for the owner object that contains the table.
 * If the owner is a geography terrain currently expanded in the editor, only that terrain editor is rerendered.
 * Otherwise the current tool is rerendered.
 * @param {string} current_tool The collection that owns the roll table.
 * @param {number} owner_id The ID of the owning object.
 */
function refreshRollTableOwner(current_tool, owner_id) {
    if (current_tool === "geography") {
        renderTerrainList();
        return;
    }
    renderCurrentTool();
}

/**
 * Deletes a roll table from the global roll table collection.
 * @param {number} roll_table_id The unique ID of the roll table to delete.
 * @param {string|null} current_tool The collection containing the current owner, if applicable.
 * @param {number|null} owner_id The ID of the current owner, if applicable.
 * @returns {void}
 */
function deleteRollTable(roll_table_id, current_tool = null, owner_id = null) {
    const deleted_table = structuredClone(app.data.roll_tables[roll_table_id]);
    const owners = findRollTableOwners(roll_table_id);

    const render = () => {
        if (current_tool && owner_id !== null) {
            refreshRollTableOwner(current_tool, owner_id);
        } else if (owners.length === 1) {
            refreshRollTableOwner(owners[0].tool, owners[0].owner_id);
        } else {
            renderCurrentTool();
        }
    };

    const do_action = () => {
        delete app.data.roll_tables[roll_table_id];
        owners.forEach(owner => removeRollTableFromOwner(roll_table_id, owner.tool, owner.owner_id));
        render();
    };
    const undo_action = () => {
        app.data.roll_tables[roll_table_id] = structuredClone(deleted_table);
        owners.forEach(owner => addRollTableToOwner(roll_table_id, owner.tool, owner.owner_id));
        render();
    };

    do_action();
    commitToHistory(`Deleted roll table ${deleted_table.name}`, undo_action, do_action);
}

/**
 * Finds all owning objects that reference a given roll table ID.
 * @param {number} roll_table_id The roll table ID to locate.
 * @returns {Array<{tool:string,owner_id:string}>} A list of owners containing the tool name and owner ID.
 */
function findRollTableOwners(roll_table_id) {
    const owners = [];

    for (const tool in app.data) {
        if (tool === "roll_tables" || tool === "next_id") continue;
        const collection = app.data[tool];
        if (!collection || typeof collection !== "object") continue;

        for (const owner_id in collection) {
            const owner = collection[owner_id];
            if (owner && Array.isArray(owner.roll_table_ids) && owner.roll_table_ids.includes(roll_table_id)) {
                owners.push({ tool, owner_id });
            }
        }
    }

    return owners;
}

/**
 * Removes a roll table ID from an owner's roll_table_ids array.
 * @param {number} roll_table_id The roll table ID to remove.
 * @param {string} tool The collection containing the owner object.
 * @param {string} owner_id The ID of the owner object.
 * @returns {void}
 */
function removeRollTableFromOwner(roll_table_id, tool, owner_id) {
    const owner = app.data[tool]?.[owner_id];
    if (!owner || !Array.isArray(owner.roll_table_ids)) return;
    const index = owner.roll_table_ids.indexOf(roll_table_id);
    if (index !== -1) owner.roll_table_ids.splice(index, 1);
}

/**
 * Adds a roll table ID to an owner's roll_table_ids array if not already present.
 * @param {number} roll_table_id The roll table ID to add.
 * @param {string} tool The collection containing the owner object.
 * @param {string} owner_id The ID of the owner object.
 * @returns {void}
 */
function addRollTableToOwner(roll_table_id, tool, owner_id) {
    const owner = app.data[tool]?.[owner_id];
    if (!owner || !Array.isArray(owner.roll_table_ids)) return;
    if (!owner.roll_table_ids.includes(roll_table_id)) {
        owner.roll_table_ids.push(roll_table_id);
    }
}

/**
 * Adds a blank row to the end of a roll table.
 * @param {number} table_id The unique ID of the roll table to modify.
 * @returns {void}
 */
function addRollTableRow(table_id) {
    //set data
    const table = app.data.roll_tables[table_id];
    if (!table || !Array.isArray(table.rows)) return;

    const reference_row = table.rows[0] || [];
    const new_row = new Array(reference_row.length || 2).fill("");

    //create actions
    const do_action = () => {
        table.rows.push(structuredClone(new_row));
        renderCurrentTool();
    };
    const undo_action = () => {
        table.rows.pop();
        renderCurrentTool();
    };

    //execute actions
    do_action();
    commitToHistory(`Added row to table ${table.name}`, undo_action, do_action);
}

/**
 * Deletes a row from a roll table.
 * @param {number} roll_table_id The unique ID of the roll table.
 * @param {number} row_index The zero-based index of the row to delete.
 * @returns {void}
 */
function deleteRollTableRow(roll_table_id, row_index) {
    //set data
    const table = app.data.roll_tables[roll_table_id];
    if (!table) return;
    const deleted_row = structuredClone(table.rows[row_index]);

    //create actions
    const render = () => renderCurrentTool();
    const do_action = () => {
        table.rows.splice(row_index, 1);
        render();
    }
    const undo_action = () => {
        table.rows.splice(row_index, 0, structuredClone(deleted_row));
        render();
    }

    //execute actions
    do_action();
    commitToHistory(`Deleted row ${row_index} from ${table.name}`, undo_action, do_action);
}

//========================================================================================================================================
//              Forms Data Functions
//========================================================================================================================================

/**
 * Saves changes made through a form element.
 *
 * The form element must contain:
 * - data-object: The app.data collection name.
 * - data-key: The unique key of the object within that collection.
 *
 * For direct properties:
 * - data-property: The property being modified.
 *
 * For nested properties:
 * - data-path: Dot-separated path to the property.
 *
 * Supports inputs, textareas, and other value-based form elements.
 *
 * Examples:
 * <input data-object="roll_tables" data-key="43" data-property="name" onblur="saveFormChanges(this)">
 * <textarea data-object="map" data-key="0, 3" data-property="description" onblur="saveFormChanges(this)">
 * <input data-object="roll_tables" data-key="43" data-path="rows.1.0" onblur="saveFormChanges(this)">
 * @param {HTMLElement} element The form element being saved.
 * @returns {void}
 */
function saveFormChanges(element) {
    const object_type = element.dataset.object;
    const object_key = element.dataset.key;
    const object = app.data[object_type][object_key];
    const property = element.dataset.property;
    const path = element.dataset.path;

    // Determine how to access the value
    const getValue = () => {
        if (path) return getNestedValue(object, path);
        return object[property];
    };
    const setValue = (value) => {
        if (path) {
            setNestedValue(object, path, value);
            return;
        }
        object[property] = value;
    };

    // Store old and new values
    const old_value = getValue();
    const new_value = element.value;

    // Ignore unchanged values
    if (old_value === new_value) return;

    // Create actions
    const do_action = () => setValue(new_value);
    const undo_action = () => setValue(old_value);

    // Execute action
    do_action();
    commitToHistory(`Changed ${path ?? property} of ${object.name ?? object_key}`, undo_action, do_action);
}

/**
 * Retrieves a nested value from an object using dot notation (ex. getNestedValue(table, "rows.2.1")).
 * @param {object} object The object to search.
 * @param {string} path Dot-separated property path.
 * @returns {*}
 */
function getNestedValue(object, path) {
    return path
        .split(".")
        .reduce((current, key) => current[key], object);
}

/**
 * Sets a nested value in an object using dot notation (ex. setNestedValue(table, "rows.2.1", "Forest")).
 * @param {object} object The object to modify.
 * @param {string} path Dot-separated property path.
 * @param {*} value The value to assign.
 * @returns {void}
 */
function setNestedValue(object, path, value) {
    const keys = path.split(".");
    const final_key = keys.pop();
    const target = keys.reduce((current, key) => current[key], object);
    target[final_key] = value;
}

//========================================================================================================================================
//              HTML render Functions
//========================================================================================================================================
/**
 * Renders multiple groups of roll tables.
 * The first array of roll table IDs is rendered as editable.
 * All subsequent arrays are rendered as read-only.
 * @param {string} div_id
 * @param {string} hex_id
 * @returns {void}
 */
function renderRollTableList(div_id, hex_id) {
    const container = document.getElementById(div_id);
    if (!container) return;
    container.innerHTML = "";
    let has_tables = false;
    const hex = app.data.map[hex_id];
    
    //hex
    const hex_array = hex.roll_table_ids ?? [];
    if (hex_array?.length > 0) {
        const hex_heading = document.createElement("h4");
        hex_heading.textContent = "Hex Roll Tables";
        container.appendChild(hex_heading);

        const hex_table_div = document.createElement("div");
        hex_table_div.id = `hex-roll-tables-${hex_id}`;
        container.appendChild(hex_table_div);

        renderRollTables(hex_table_div.id, hex_array, false, "map", hex_id);
        has_tables = true;
    }

    //factions
    let faction_has_tables = false;
    for (const faction of hex.factions ?? []) {
        const faction_data = app.data.factions[faction.faction_id];

        if (!faction_data?.roll_table_ids?.length) continue;

        if (!faction_has_tables) {
            const heading = document.createElement("h4");
            heading.textContent = "Faction Tables";
            container.appendChild(heading);
            faction_has_tables = true;
        }

        const table_div = document.createElement("div");
        table_div.id = `faction-roll-tables-${hex_id}-${faction.faction_id}`;
        container.appendChild(table_div);

        renderRollTables(table_div.id, faction_data.roll_table_ids, true);
        has_tables = true;
    }

    //geography
    const geography = app.data.geography[hex.geography_id];
    if (geography?.roll_table_ids?.length > 0) {
        const geography_heading = document.createElement("h4");
        geography_heading.textContent = "Geography Tables";
        container.appendChild(geography_heading);

        const geography_table_div = document.createElement("div");
        geography_table_div.id = `geography-roll-tables-${hex_id}`;
        container.appendChild(geography_table_div);

        renderRollTables(geography_table_div.id, geography.roll_table_ids, true);
        has_tables = true;
    }

    //nothing exists
    if (!has_tables) {
        const none_found = document.createElement("p");
        none_found.textContent = "No roll tables found";
        container.appendChild(none_found);
    }
}

/**
 * Renders a group of roll tables.
 * @param {string} div_id The empty div where the tables will be rendered.
 * @param {Array} roll_table_id_array Array of roll table IDs (ex. [0, 3, 4]).
 * @param {boolean} read_only Whether the tables are read-only.
 * @param {string|null} owner_tool Optional owning collection name.
 * @param {number|null} owner_id Optional owning object ID.
 * @returns {void}
 */
function renderRollTables(div_id, roll_table_id_array, read_only = false, owner_tool = null, owner_id = null) {
    //prepare container
    const container = document.getElementById(div_id);
    if (!container) return;
    container.innerHTML = "";

    //fill container
    if (roll_table_id_array.length === 0) {
        container.innerHTML = `<p><i>No roll tables.</i></p>`;
        return;
    }

    for (const table_id of roll_table_id_array) {
        const table_div = document.createElement("div");
        const mode_class = read_only ? "roll-table-read-only" : "roll-table-editable";
        table_div.className = `roll-table-div ${mode_class}`;
        table_div.id = `roll-table-div-${table_id}`;

        container.appendChild(table_div);
        renderRollTable(table_div.id, table_id, read_only, owner_tool, owner_id);
    }
}

/**
 * Renders a single roll table.
 * @param {string} div_id The empty div where the table will be rendered.
 * @param {number} roll_table_id The unique ID of the roll table.
 * @param {boolean} read_only Wether the table is read-only.
 * @param {string|null} owner_tool Optional owning collection name. Needed for deleting tables.
 * @param {number|null} owner_id Optional owning object ID. Needed for deleting tables.
 * @returns {void}
 */
function renderRollTable(div_id, roll_table_id, read_only = false, owner_tool = null, owner_id = null) {
    //prepare container
    const container = document.getElementById(div_id);
    if (!container) return;

    const table = app.data.roll_tables[roll_table_id];
    if (!table) {
        container.innerHTML = `<p><i>Missing roll table ${roll_table_id}</i></p>`;
        return;
    }

    const read = read_only ? "readonly" : "";
    const mode_class = read_only ? "roll-table-read-only" : "roll-table-editable";
    const deleteAction = owner_tool && owner_id !== null
        ? `deleteRollTable(${roll_table_id}, ${JSON.stringify(owner_tool)}, ${JSON.stringify(owner_id)})`
        : `deleteRollTable(${roll_table_id})`;
    const escaped_delete_action = deleteAction.replaceAll('"', "&quot;");
    //prepare html
    let html = `
        <table class="roll-table ${mode_class}">
            <colgroup>
                <col class="roll-table-col-1">
                <col class="roll-table-col-2">
                <col class="roll-table-col-3">
            </colgroup>
            <tr>
                <th colspan="3" class="table-header">
                    <input
                        type="text"
                        value="${table.name}"
                        data-object="roll_tables"
                        data-key="${roll_table_id}"
                        data-property="name"
                        data-history-path="roll_tables.${roll_table_id}.name"
                        ${read}
                    >`;
    if (!read_only) html += `
                    <button class="bad-button" onclick="${escaped_delete_action}">
                        Delete
                    </button>`;
    html += `
                </th>
            </tr>
    `;
    for (let row = 0; row < table.rows.length; row++) {
        html += `
            <tr>
                <td>
                    <input
                        type="text"
                        value="${table.rows[row][0]}"
                        data-object="roll_tables"
                        data-key="${roll_table_id}"
                        data-path="rows.${row}.0"
                        data-history-path="roll_tables.${roll_table_id}.rows.${row}.0"
                        ${read}
                    >
                </td>
                <td>
                    <input
                        type="text"
                        value="${table.rows[row][1]}"
                        data-object="roll_tables"
                        data-key="${roll_table_id}"
                        data-path="rows.${row}.1"
                        data-history-path="roll_tables.${roll_table_id}.rows.${row}.1"
                        ${read}
                    >
                </td>
        `;
        if (!read_only) {
            html += `
                <td>
                    <button class="bad-button" onclick="deleteRollTableRow('${roll_table_id}', ${row})">-</button>
                </td>
            `
        }
        html += `
            </tr>
        `;
    }

    if (!read_only) {
        html += `
            <tr>
                <td colspan="3">
                    <button class="good-button add-row-button" onclick="addRollTableRow(${roll_table_id})">+</button>
                </td>
            </tr>
        `;
    }

    html += `
        </table>
    `;

    container.innerHTML = html;
}

