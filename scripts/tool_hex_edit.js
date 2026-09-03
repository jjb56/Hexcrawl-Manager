/*
    This file contains code related to the hex drawing and selecting surface.
*/

//========================================================================================================================================
//              Main Functions
//========================================================================================================================================


//========================================================================================================================================
//              Render Functions
//========================================================================================================================================
/**
 * Renders the hex edit tool in the properties window.
 * @returns {void}
 */
function renderHexEditTool() {
    const hex_key = app.selected_hex;
    let data = app.data.map[hex_key];
    if (!data) {
        data = {
            name: "",
            geography_id: null,
            description: ""
        };
        app.data.map[hex_key] = data;
    }

    const owner_div = document.getElementById("properties-hex-edit");
    owner_div.innerHTML = "";

    //render features
    renderHexEditBackground();
    renderHexHeader();
    const header_hr = document.createElement("hr");
    header_hr.id = "header-hr";
    //header_hr.style.cssText = "height: 3px; margin: 12px 0; border: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.95) 20%, rgba(255,255,255,.95) 80%, transparent); box-shadow: 0 0 0 1px rgba(0,0,0,.9), 0 0 0 2px rgba(255,255,255,.8), 0 0 10px rgba(255,255,255,.9);"
    owner_div.appendChild(header_hr);
    if (data.cities) {
        renderHexCities();
        owner_div.appendChild(document.createElement("hr"));
    }
    if (data.factions) {
        renderHexFactions();
        owner_div.appendChild(document.createElement("hr"));
    }
    if (data.landmarks) {
        renderHexLandmarks();
        owner_div.appendChild(document.createElement("hr"));
    }
    if (data.notes) {
        renderHexNotes();
        owner_div.appendChild(document.createElement("hr"));
    }

    //roll tables
    let has_roll_tables = false;
    if (data.roll_table_ids?.length > 0) has_roll_tables = true;
    if (!has_roll_tables && data.factions?.length > 0) {
        for (const faction of data.factions) {
            const faction_data = app.data.factions[faction.faction_id];
            if (faction_data?.roll_table_ids?.length > 0) {
                has_roll_tables = true;
                break;
            }
        }
    }
    if (!has_roll_tables) {
        const geography = app.data.geography[data.geography_id];
        if (geography?.roll_table_ids?.length > 0) has_roll_tables = true;
    }
    if (has_roll_tables) {
        renderHexRollTables();
        owner_div.appendChild(document.createElement("hr"));
    }
    
    renderHexAddFeature();
    owner_div.appendChild(document.createElement("hr"));
    renderHexCloseButton();
}


/**
 * Updates the background color of the hex edit properties window based on the selected hex's geography.
 * @returns {void}
 */
function renderHexEditBackground() {
    const hex_key = app.selected_hex;
    const data = app.data.map[hex_key];
    const properties = document.getElementById("properties-hex-edit");
    if (!properties || !data) return;
    let background_color = "#000";

    if (data.geography_id !== null && data.geography_id !== undefined) {
        const geography = app.data.geography[data.geography_id];

        if (geography && geography.background_color) {
            background_color = geography.background_color;
        }
    }

    properties.style.background = `linear-gradient(to bottom, ${background_color}, var(--section-bg-color), var(--section-bg-color))`;
}


/**
 * Renders the header for the selected hex.
 * @returns {void}
 */
function renderHexHeader() {
    const owner_div = document.getElementById("properties-hex-edit");

    const hex_key = app.selected_hex;
    const [x, y] = hex_key.split(",").map(Number);
    const data = app.data.map[hex_key];

    const header = document.createElement("div");
    header.id = "header-hex-edit";
    header.className = "tool-header";

    const title = document.createElement("input");
    title.id = "header-hex-title";
    title.type = "text";
    title.placeholder = `Region ${x},${y}`;
    title.value = data.name || "";
    title.maxLength = 120;
    title.dataset.historyPath = `map.${app.selected_hex}.name`;

    const terrain = document.createElement("span");
    terrain.id = "hex-terrain-type";

    if (data.geography_id !== null && data.geography_id !== undefined) {
        const geography = app.data.geography[data.geography_id];

        if (geography) {
            const icon_data = icon_list.find(item => item.id === geography.icon);
            const terrain_text = `${geography.name}`;
            if (icon_data) {
                const create_icon = () => {
                    const image = document.createElement("img");
                    image.className = "hex-header-icon";
                    image.style.backgroundColor = geography.icon_color;
                    image.style.mask = `url(${icon_data.src}) center / contain no-repeat`;
                    return image;
                };
                terrain.appendChild(create_icon());
                terrain.appendChild(document.createTextNode(geography.name));
                terrain.appendChild(create_icon());
            } else {
                terrain.appendChild(document.createTextNode(geography.name));
            }
        } else {
            terrain.textContent = "Unknown terrain";
        }
    } else {
        terrain.textContent = "No terrain";
    }

    const description = document.createElement("textarea");
    description.id = "hex-description";
    description.className = "textarea-row";
    description.placeholder = "Enter a description for this region...";
    description.value = data.description || "";
    description.dataset.historyPath = `map.${app.selected_hex}.description`;

    header.appendChild(title);
    header.appendChild(terrain);
    header.appendChild(description);

    owner_div.appendChild(header);
}


/**
 * Renders the cities section for the selected hex.
 * @returns {void}
 */
function renderHexCities() {
    const owner_div = document.getElementById("properties-hex-edit");
    const cities = app.data.map[app.selected_hex].cities;

    const section = document.createElement("div");
    section.className = "hex-city";

    const title = document.createElement("h3");
    title.textContent = "Cities";

    const city_list = document.createElement("div");
    city_list.id = "hex-city-list";

    for (let i = 0; i < cities.length; i++) {
        const city = cities[i];

        const entry = document.createElement("div");
        entry.className = "city-entry"

        //title row
        const title_row = document.createElement("div");
        title_row.className = "split-70-20-10"

        const name = document.createElement("input");
        name.type = "text";
        name.className = "hex-city-name";
        name.placeholder = "City name";
        name.value = city.name || "";
        name.dataset.historyPath = `map.${app.selected_hex}.cities.${i}.name`;

        const delete_city_button = document.createElement("button");
        delete_city_button.className = "bad-button";
        delete_city_button.textContent = "-";
        delete_city_button.addEventListener("click", () => {
            const hex_key = app.selected_hex;
            const removed_city = app.data.map[hex_key].cities[i];
            const do_action = () => {
                const hex = app.data.map[hex_key];
                hex.cities.splice(i, 1);
                if (hex.cities.length === 0) delete hex.cities;
            };
            const undo_action = () => {
                const hex = app.data.map[hex_key];
                if (!hex.cities) hex.cities = [];
                hex.cities.splice(i, 0, removed_city);
            };

            do_action();
            commitToHistory(`Removed city from region ${hex_key}`, undo_action, do_action);
            renderHexEditTool();
        });

        title_row.appendChild(name);
        appendIconPicker(title_row, `map.${app.selected_hex}.cities.${i}.icon`);
        title_row.appendChild(delete_city_button);

        // Description
        const description = document.createElement("textarea");
        description.className = "textarea-row";
        description.placeholder = "Enter city description...";
        description.value = city.description || "";
        description.dataset.historyPath = `map.${app.selected_hex}.cities.${i}.description`;

        entry.appendChild(title_row);
        //entry.appendChild(population_row);
        entry.appendChild(description);

        city_list.appendChild(entry);
    }

    section.appendChild(title);
    section.appendChild(city_list);

    owner_div.appendChild(section);
}


/**
 * Renders the faction section for the selected hex.
 * @returns {void}
 */
function renderHexFactions() {
    const owner_div = document.getElementById("properties-hex-edit");
    const factions = app.data.map[app.selected_hex].factions;

    const section = document.createElement("div");
    section.className = "hex-faction";

    const title = document.createElement("h3");
    title.textContent = "Factions";

    const faction_list = document.createElement("div");
    faction_list.id = "hex-faction-list";

    for (let i = 0; i < factions.length; i++) {
        const faction_data = factions[i]; // the actual object contents
        // Store an unselected faction as null and allow it to render safely.
        const faction_id = faction_data.faction_id ?? null;
        const faction = faction_id ? app.data.factions[faction_id] : null;

        const row = document.createElement("div");
        row.className = "hex-faction-row";

        // Faction flag
        const flag = document.createElement("span");
        flag.className = "hex-faction-flag";
        renderHexFactionFlag(flag, faction);

        // Faction selector
        const name = document.createElement("select");
        name.className = "hex-faction-name";
        name.dataset.valueType = "number";
        name.dataset.historyPath = `map.${app.selected_hex}.factions.${i}.faction_id`;

        const choose_option = document.createElement("option");
        choose_option.value = "";
        choose_option.textContent = "-- Choose --";
        name.appendChild(choose_option);

        //loop through all factions and make entries for them in the dropdown
        for (const id in app.data.factions) {
            const faction_option = document.createElement("option");
            faction_option.value = id;
            faction_option.textContent = app.data.factions[id].name;
            name.appendChild(faction_option);
        }
        name.value = faction_id ?? ""; //
        name.addEventListener("change", () => {
            const selected_id = name.value === "" ? null : Number(name.value);
            const selected_faction = selected_id === null ? null : app.data.factions[selected_id];

            renderHexFactionFlag(flag, selected_faction);
            remove.title = selected_faction ? `Remove ${selected_faction.name}` : "Remove faction";
        });

        // Presence
        const presence = document.createElement("input");
        presence.type = "number";
        presence.className = "hex-faction-presence";
        presence.min = "0";
        presence.value = faction_data.presence;
        presence.dataset.historyPath = `map.${app.selected_hex}.factions.${i}.presence`;
        presence.addEventListener("change", () => renderFactionBorders(app.selected_hex));

        // Remove faction button
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "bad-button";
        remove.textContent = "-";
        remove.title = faction ? `Remove ${faction.name}` : "Remove faction";
        remove.addEventListener("click", () => {
            const hex_key = app.selected_hex;
            const removed_faction = app.data.map[hex_key].factions[i];
            const do_action = () => {
                const hex = app.data.map[hex_key];
                if (hex.factions.length === 1) {
                    delete hex.factions;
                } else {
                    hex.factions.splice(i, 1);
                }
                refreshFactionBorderNeighbors(hex_key);
            };
            const undo_action = () => {
                const hex = app.data.map[hex_key];
                if (!hex.factions) {
                    hex.factions = [removed_faction];
                } else {
                    hex.factions.splice(i, 0, removed_faction);
                }
                refreshFactionBorderNeighbors(hex_key);
            };

            do_action();
            commitToHistory(`Removed faction from region ${hex_key}`, undo_action, do_action);
            renderHexEditTool();
            renderFactionBorders(hex_key);
        });

        row.appendChild(flag);
        row.appendChild(name);
        row.appendChild(presence);
        row.appendChild(remove);

        faction_list.appendChild(row);
    }

    section.appendChild(title);
    section.appendChild(faction_list);

    owner_div.appendChild(section);
}


/**
 * Renders the landmark section for the selected hex.
 * @returns {void}
 */
function renderHexLandmarks() {
    const owner_div = document.getElementById("properties-hex-edit");
    const landmarks = app.data.map[app.selected_hex].landmarks;

    const section = document.createElement("div");
    section.className = "hex-landmark";

    const title = document.createElement("h3");
    title.textContent = "Landmarks";

    const landmark_list = document.createElement("div");
    landmark_list.id = "hex-landmark-list";

    for (let i = 0; i < landmarks.length; i++) {
        const landmark = landmarks[i];

        const entry = document.createElement("div");
        entry.className = "hex-landmark-entry";

        // title row
        const title_row = document.createElement("div");
        title_row.className = "split-70-20-10";

        const name = document.createElement("input");
        name.type = "text";
        name.className = "hex-landmark-name";
        name.placeholder = "Landmark name";
        name.value = landmark.name || "";
        name.dataset.historyPath = `map.${app.selected_hex}.landmarks.${i}.name`;

        const delete_landmark_button = document.createElement("button");
        delete_landmark_button.className = "bad-button";
        delete_landmark_button.textContent = "-";
        delete_landmark_button.addEventListener("click", () => {
            const hex_key = app.selected_hex;
            const removed_landmark = app.data.map[hex_key].landmarks[i];
            const do_action = () => {
                const hex = app.data.map[hex_key];
                hex.landmarks.splice(i, 1);
                if (hex.landmarks.length === 0) delete hex.landmarks;
            };
            const undo_action = () => {
                const hex = app.data.map[hex_key];
                if (!hex.landmarks) hex.landmarks = [];
                hex.landmarks.splice(i, 0, removed_landmark);
            };

            do_action();
            commitToHistory(`Removed landmark from region ${hex_key}`, undo_action, do_action);
            renderHexEditTool();
            renderHexes();
        });
        
        title_row.appendChild(name);
        appendIconPicker(title_row, `map.${app.selected_hex}.landmarks.${i}.icon`);
        title_row.appendChild(delete_landmark_button);

        //description row
        const description = document.createElement("textarea");
        description.className = "textarea-row";
        description.placeholder = "Enter landmark description...";
        description.value = landmark.description || "";
        description.dataset.historyPath = `map.${app.selected_hex}.landmarks.${i}.description`;
        
        //assemble row

        entry.appendChild(title_row);
        entry.appendChild(description);
        landmark_list.appendChild(entry);
    }

    section.appendChild(title);
    section.appendChild(landmark_list);

    owner_div.appendChild(section);
}


/**
 * Renders the roll tables section for the selected hex.
 * @returns {void}
 */
function renderHexRollTables() {
    const owner_div = document.getElementById("properties-hex-edit");

    const old_section = document.getElementById("hex-roll-tables-section");
    if (old_section) old_section.remove();

    const section = document.createElement("div");
    section.className = "tool-roll-tables";
    section.id = "hex-roll-tables-section";

    const title = document.createElement("h3");
    title.textContent = "Roll Tables";

    section.appendChild(title);
    owner_div.appendChild(section);

    renderRollTableList("hex-roll-tables-section", app.selected_hex);
}


/**
 * Renders the notes section for the selected hex.
 * @returns {void}
 */
function renderHexNotes() {
    const owner_div = document.getElementById("properties-hex-edit");
    const notes = app.data.map[app.selected_hex].notes;

    const section = document.createElement("div");
    section.className = "hex-notes";

    const title = document.createElement("h3");
    title.textContent = "Notes";

    const note_list = document.createElement("div");
    note_list.id = "hex-notes-list";

    for (let i = 0; i < notes.length; i++) {
        if (typeof notes[i] === "string") {
            notes[i] = { name: "", content: notes[i] };
        }
        const note = notes[i];

        const entry = document.createElement("div");
        entry.className = "hex-note-entry";

        // title row
        const title_row = document.createElement("div");
        title_row.className = "split-90-10";

        const name = document.createElement("input");
        name.type = "text";
        name.className = "hex-note-name";
        name.placeholder = "Note Title";
        name.value = note.name || "";
        name.dataset.historyPath = `map.${app.selected_hex}.notes.${i}.name`;

        const delete_note_button = document.createElement("button");
        delete_note_button.className = "bad-button";
        delete_note_button.textContent = "-";
        delete_note_button.addEventListener("click", () => {
            const hex_key = app.selected_hex;
            const removed_note = app.data.map[hex_key].notes[i];
            const do_action = () => {
                const hex = app.data.map[hex_key];
                hex.notes.splice(i, 1);
                if (hex.notes.length === 0) delete hex.notes;
            };
            const undo_action = () => {
                const hex = app.data.map[hex_key];
                if (!hex.notes) hex.notes = [];
                hex.notes.splice(i, 0, removed_note);
            };

            do_action();
            commitToHistory(`Removed note from region ${hex_key}`, undo_action, do_action);
            renderHexEditTool();
        });
        
        title_row.appendChild(name);
        title_row.appendChild(delete_note_button);

        //content row
        const content = document.createElement("textarea");
        content.className = "textarea-row";
        content.placeholder = "Enter note...";
        content.value = note.content || "";
        content.dataset.historyPath = `map.${app.selected_hex}.notes.${i}.content`;
        
        //assemble row
        entry.appendChild(title_row);
        entry.appendChild(content);
        note_list.appendChild(entry);
    }

    section.appendChild(title);
    section.appendChild(note_list);

    owner_div.appendChild(section);
}


/**
 * Renders the add new feature controls.
 * @returns {void}
 */
function renderHexAddFeature() {
    const owner_div = document.getElementById("properties-hex-edit");

    const section = document.createElement("div");
    section.id = "add-property-region";

    const select = document.createElement("select");
    select.id = "hex-select-property";
    select.classList = "good-button";

    // Default option
    const default_option = document.createElement("option");
    default_option.value = "";
    default_option.textContent = "+ Add New Feature";
    default_option.selected = true;

    const city_option = document.createElement("option");
    city_option.value = "city";
    city_option.textContent = "City";

    const faction_option = document.createElement("option");
    faction_option.value = "faction";
    faction_option.textContent = "Faction";

    const landmark_option = document.createElement("option");
    landmark_option.value = "landmark";
    landmark_option.textContent = "Landmark";

    const notes_option = document.createElement("option");
    notes_option.value = "notes";
    notes_option.textContent = "Notes";

    const roll_table_option = document.createElement("option");
    roll_table_option.value = "roll_table";
    roll_table_option.textContent = "Roll Table";

    select.appendChild(default_option);
    select.appendChild(city_option);
    select.appendChild(faction_option);
    select.appendChild(landmark_option);
    select.appendChild(notes_option);
    select.appendChild(roll_table_option);
    select.addEventListener("change", () => {
        switch (select.value) {
            case "city": {
                const city = {
                    name: "New city",
                    population: 0,
                    description: ""
                };

                let created_array = false;

                const do_action = () => {
                    const data = app.data.map[app.selected_hex];
                    if (!Array.isArray(data.cities)) {
                        data.cities = [];
                        created_array = true;
                    }
                    data.cities.push(city);
                };
                const undo_action = () => {
                    const data = app.data.map[app.selected_hex];
                    data.cities.pop();
                    if (created_array && data.cities.length === 0) delete data.cities;
                };

                do_action();
                commitToHistory(`Added city to region ${app.selected_hex}`, undo_action, do_action);
                break;
            }

            case "landmark": {
                const landmark = {
                    name: "New landmark",
                    icon: "",
                    description: ""
                };
                let created_array = false;

                const do_action = () => {
                    const data = app.data.map[app.selected_hex];
                    if (!Array.isArray(data.landmarks)) {
                        data.landmarks = [];
                        created_array = true;
                    }
                    data.landmarks.push(landmark);
                };
                const undo_action = () => {
                    const data = app.data.map[app.selected_hex];
                    data.landmarks.pop();
                    if (created_array && data.landmarks.length === 0) delete data.landmarks;
                };

                do_action();
                commitToHistory(`Added landmark to region ${app.selected_hex}`, undo_action, do_action);
                break;
            }

            case "faction": {
                const faction = {
                    faction_id: null,
                    presence: 400
                };
                let created_array = false;

                const do_action = () => {
                    const data = app.data.map[app.selected_hex];
                    if (!Array.isArray(data.factions)) {
                        data.factions = [];
                        created_array = true;
                    }
                    data.factions.push(faction);
                };
                const undo_action = () => {
                    const data = app.data.map[app.selected_hex];
                    data.factions.pop();
                    if (created_array && data.factions.length === 0) delete data.factions;
                };

                do_action();
                commitToHistory(`Added faction to region ${app.selected_hex}`, undo_action, do_action);
                break;
            }

            case "notes": {
                const note = {
                    name: "",
                    content: ""
                };
                let created_array = false;

                const do_action = () => {
                    const data = app.data.map[app.selected_hex];
                    if (!Array.isArray(data.notes)) {
                        data.notes = [];
                        created_array = true;
                    }
                    data.notes.push(note);
                };
                const undo_action = () => {
                    const data = app.data.map[app.selected_hex];
                    data.notes.pop();
                    if (created_array && data.notes.length === 0) delete data.notes;
                };

                do_action();
                commitToHistory(`Added note to region ${app.selected_hex}`, undo_action, do_action);
                break;
            }

            case "roll_table":
                const hex = app.data.map[app.selected_hex];
                if (hex?.roll_table_ids === null || hex?.roll_table_ids === undefined) hex.roll_table_ids = [];
                createRollTable("map", app.selected_hex);
                console.log(`table ${hex.roll_table_ids}`);
                break;

            default:
                return;
        }

        // Return dropdown to "+ Add New Feature"
        select.value = "";
        renderHexEditTool();
    });

    section.appendChild(select);
    owner_div.appendChild(section);
}

/**
 * Renders the close button for the hex edit tool.
 * @returns {void}
 */
function renderHexCloseButton() {
    const owner_div = document.getElementById("properties-hex-edit");

    const button = document.createElement("button");
    button.className = "exit-tool-button";
    button.type = "button";
    button.textContent = "Close Region Window";
    button.addEventListener("click", () => activateTool(tools.NONE));
    

    owner_div.appendChild(button);
}

/**
 * Renders a faction flag with the faction's selected icon and colors.
 * @param {HTMLElement} flag The flag element to update.
 * @param {Object|null} faction The faction to render.
 * @returns {void}
 */
function renderHexFactionFlag(flag, faction) {
    flag.replaceChildren();
    flag.style.backgroundColor = faction?.color || "transparent";
    flag.title = faction?.name || "";

    const icon_data = icon_list.find(item => item.id === faction?.icon);
    if (!icon_data) return;

    const image = document.createElement("img");
    image.className = "icon-display";
    image.style.backgroundColor = faction.icon_color;
    image.style.mask = `url(${icon_data.src}) center / contain no-repeat`;
    flag.appendChild(image);
}