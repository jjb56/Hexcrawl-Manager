/*
    This file contains all related functionality for the faction setup tool.
*/

let expanded_faction = null;

//========================================================================================================================================
//              Main Functions
//========================================================================================================================================

/**
 * Adds a new faction to the factions tool.
 * @returns {void}
 */
function addFactionType() {
    const faction_id = app.data.next_id++;
    const faction_data = {
        name: `New Faction ${faction_id}`,
        color: "#4481b9",
        icon: "?",
        roll_table_ids: []
    };

    const do_action = () => app.data.factions[faction_id] = structuredClone(faction_data);
    const undo_action = () => delete app.data.factions[faction_id];

    do_action();
    commitToHistory(`Added faction ${faction_data.name}`, undo_action, do_action);
}

/**
 * Deletes a faction from the factions tool.
 * @param {number} faction_id The ID of the faction to delete.
 * @returns {void}
 */
function deleteFactionType(faction_id) {
    const faction_data = structuredClone(app.data.factions[faction_id]);
    const roll_tables = {};
    for (const roll_table_id of faction_data.roll_table_ids) {
        if (app.data.roll_tables[roll_table_id] !== undefined) {
            roll_tables[roll_table_id] = structuredClone(app.data.roll_tables[roll_table_id]);
        }
    }

    const do_action = () => {
        delete app.data.factions[faction_id];
        for (const roll_table_id of faction_data.roll_table_ids) {
            delete app.data.roll_tables[roll_table_id];
        }
    };
    const undo_action = () => {
        app.data.factions[faction_id] = structuredClone(faction_data);
        for (const roll_table_id in roll_tables) {
            app.data.roll_tables[roll_table_id] = structuredClone(roll_tables[roll_table_id]);
        }
    };

    do_action();
    commitToHistory(`Deleted ${faction_data.name}`, undo_action, do_action);
}

/**
 * Updates the name of the selected faction.
 * @param {number} faction_id The ID of the faction.
 * @param {string} value The new name.
 * @returns {void}
 */
function updateFactionName(faction_id, value) {
    const old_value = app.data.factions[faction_id].name;
    if (old_value === value) return;

    const do_action = () => app.data.factions[faction_id].name = value;
    const undo_action = () => app.data.factions[faction_id].name = old_value;

    do_action();
    commitToHistory(`Renamed ${old_value} to ${value}`, undo_action, do_action);
}

function updateFactionColor(faction_id, value) {
    const old_value = app.data.factions[faction_id].color;
    if (old_value === value) return;

    const do_action = () => app.data.factions[faction_id].color = value;
    const undo_action = () => app.data.factions[faction_id].color = old_value;

    do_action();
    commitToHistory(`Changed ${app.data.factions[faction_id].name} color`, undo_action, do_action);
}

function updateFactionIcon(faction_id, value) {
    const old_value = app.data.factions[faction_id].icon;
    if (old_value === value) return;

    const do_action = () => app.data.factions[faction_id].icon = value;
    const undo_action = () => app.data.factions[faction_id].icon = old_value;

    do_action();
    commitToHistory(`Changed ${app.data.factions[faction_id].name} icon`, undo_action, do_action);
}

// ======================== May Be Optional Under New Framework ========================
function saveFactionChanges(faction_id, div_element) {
    clearTimeout(edit_timer);

    const name = div_element.querySelector(`#faction-name-${faction_id}`).value;
    const color = div_element.querySelector(`#faction-color-${faction_id}`).value;
    const icon = div_element.querySelector(`#faction-icon-${faction_id}`).value;

    updateFactionName(faction_id, name);
    updateFactionColor(faction_id, color);
    updateFactionIcon(faction_id, icon);
}

//========================================================================================================================================
//              Render Functions
//========================================================================================================================================

function renderFactionList() {
    const div = document.getElementById("faction-list");
    let selected_div_id = null;
    let selected_faction_index = null;
    div.innerHTML = "";

    if (Object.keys(app.data.factions).length === 0) {
        div.innerHTML = "<p><i>No factions exist. Add a new one below.</i></p>";
        return;
    }

    for (const faction_id in app.data.factions) {
        const faction = app.data.factions[faction_id];

        const faction_div = document.createElement("div");
        faction_div.className = "faction";
        faction_div.id = `faction-${faction_id}`;

        const button = document.createElement("button");
        button.className = "faction-button";

        const icon = document.createElement("span");
        icon.className = "hex-faction-flag";
        icon.textContent = faction.icon;
        icon.style.backgroundColor = faction.color;

        const name = document.createElement("span");
        name.className = "faction-label";
        name.textContent = faction.name;

        const tables = document.createElement("span");
        tables.className = "faction-table-icons";
        let table_icons = "";
        if (faction.roll_table_ids.length > 5) {
            table_icons += ` ▦ x${faction.roll_table_ids.length}`;
        } else {
            for (const roll_table_id of faction.roll_table_ids) {
                table_icons += " ▦";
            }
        }
        tables.textContent = table_icons;

        button.appendChild(icon);
        button.appendChild(name);
        button.appendChild(tables);
        button.onclick = () => {
            expanded_faction = (expanded_faction === faction_id) ? null : faction_id;
            renderFactionList();
        };

        div.appendChild(faction_div);
        faction_div.appendChild(button);

        if (expanded_faction !== faction_id) continue;
        const faction_innerdiv = document.createElement("div");
        faction_innerdiv.id = `faction-inner-${faction_id}`;
        faction_div.appendChild(faction_innerdiv);

        selected_div_id = faction_innerdiv.id;
        selected_faction_index = faction_id;
    }

    if (selected_div_id !== null) renderFaction(selected_div_id, selected_faction_index);
}

function renderFaction(div_id, faction_id) {
    const faction = app.data.factions[faction_id];
    const editor = document.createElement("div");
    editor.className = "faction-editor"; //FIXME
    editor.innerHTML = `
        <div class="innerdiv">
            name <input id="faction-name-${faction_id}" type="text" value="${faction.name}" data-history-path="factions.${faction_id}.name">
            faction color <input id="faction-color-${faction_id}" type="color" value="${faction.color}" data-history-path="factions.${faction_id}.color">
            icon <input id="faction-icon-${faction_id}" type="text" value="${faction.icon}" data-history-path="factions.${faction_id}.icon">
            <div id="roll-tables">
                <h4>Roll Tables</h4>
                <div id="faction-roll-tables-${faction_id}"></div>
            </div>
        </div>
    `;
    const table_div = editor.querySelector(`#faction-roll-tables-${faction_id}`);

    const add_roll_table_button = document.createElement("button");
    add_roll_table_button.textContent = "+ Add Roll Table";
    add_roll_table_button.className = "good-button";
    add_roll_table_button.onclick = () => createRollTable("factions", faction_id);

    editor.addEventListener("focusout", event => {
        if (event.target.matches("input, textarea, select")) {
            setTimeout(() => renderFactionList(), 0);
        }
    });

    const delete_button = document.createElement("button");
    delete_button.textContent = `Delete ${faction.name}`;
    delete_button.className = "bad-button";
    delete_button.onclick = () => {
        deleteFactionType(faction_id);
        expanded_faction = null;
        renderFactionList();
    };

    editor.appendChild(delete_button);

    const container = document.getElementById(div_id);
    container.innerHTML = "";
    container.appendChild(editor);

    renderRollTables(`faction-roll-tables-${faction_id}`, faction.roll_table_ids, false, "factions", faction_id);
    table_div.appendChild(add_roll_table_button);
}

function renderFactionsTool() {
    // Renders the initialization of the faction tool when selected.
}

//========================================================================================================================================
//              Event Listeners
//========================================================================================================================================
const addNewFactionBtn = document.querySelector("#add-new-faction-button");
if (addNewFactionBtn) {
    addNewFactionBtn.onclick = () => {
        addFactionType();
        renderFactionList();
    };
}
