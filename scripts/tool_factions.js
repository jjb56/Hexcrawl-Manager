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
        name: "New Faction",
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
        renderHexes();
    };
    const undo_action = () => {
        app.data.factions[faction_id] = structuredClone(faction_data);
        for (const roll_table_id in roll_tables) {
            app.data.roll_tables[roll_table_id] = structuredClone(roll_tables[roll_table_id]);
        }
        renderHexes();
    };

    do_action();
    commitToHistory(`Deleted ${faction_data.name}`, undo_action, do_action);
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
            <div class="split-25-75"><label>Name</label><input id="faction-name-${faction_id}" type="text" value="${faction.name}" data-history-path="factions.${faction_id}.name"></div>
            <div class="split-50-50"><label>faction color</label><input id="faction-color-${faction_id}" type="color" value="${faction.color}" data-history-path="factions.${faction_id}.color"></div>
            <div class="split-50-50"><label>faction icon</label><input id="faction-icon-${faction_id}" type="text" value="${faction.icon}" data-history-path="factions.${faction_id}.icon"></div>
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
