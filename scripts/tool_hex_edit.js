/*
    This file contains code related to the hex drawing and selecting surface.
*/

/* Format
const app = {
    data: {
        map: {
            "3,5": {
                geography_id: 0|null,
                description: "First Test Cell",
                cities: [
                    { //optional
                        name: "City of Doom",
                        population: 10000,
                        description: ""
                    }
                ],
                factions: [ //optional, drawn as border around faction owned area, with thicker border for higher ratio of presence.
                    { faction_id: 1, presence: 400 }
                ], 
                landmarks: [ //optional
                    { name: "Stone", icon: "", description: "An obelisk or something" }
                ],
                roll_table_ids: [3], //optional, but always displays the geography and faction-related tables below the hex tables
                notes: ["A dangerous zone full of mortals"] //optional
            }
        }
    }
}
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
            geography_id: null,
            description: ""
        };
        app.data.map[hex_key] = data;
    }

    const owner_div = document.getElementById("properties-hex-edit");
    owner_div.innerHTML = "";

    renderHexEditBackground();
    renderHexHeader();
    owner_div.appendChild(document.createElement("hr"));
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

    const title = document.createElement("h2");
    title.id = "header-hex-title";

    const coordinates = document.createElement("span");
    coordinates.id = "hex-coordinates";
    coordinates.textContent = `${x}, ${y}`;

    title.textContent = "Region ";
    title.appendChild(coordinates);

    const terrain = document.createElement("span");
    terrain.id = "hex-terrain-type";

    if (data.geography_id !== null && data.geography_id !== undefined) {
        const geography = app.data.geography[data.geography_id];

        if (geography) {
            terrain.textContent = `${geography.icon} ${geography.name} ${geography.icon}`;
        } else {
            terrain.textContent = "❌ Unknown terrain ❌";
        }
    } else {
        terrain.textContent = "❌ No terrain ❌";
    }

    const description = document.createElement("textarea");
    description.id = "hex-description";
    description.placeholder = "Enter a description for this region...";
    description.value = data.description || "";

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

        const row = document.createElement("div");
        row.className = "hex-city-row";

        // City name
        const name = document.createElement("input");
        name.type = "text";
        name.className = "hex-city-name";
        name.placeholder = "City name";
        name.value = city.name || "";

        // Population
        const population = document.createElement("input");
        population.type = "number";
        population.className = "hex-city-population";
        population.min = "0";
        population.placeholder = "Population";
        population.value = city.population ?? "";

        // Description
        const description = document.createElement("textarea");
        description.className = "hex-city-description";
        description.placeholder = "Enter city description...";
        description.value = city.description || "";

        row.appendChild(name);
        row.appendChild(population);
        row.appendChild(description);

        city_list.appendChild(row);
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
        const faction_data = factions[i];
        const faction = app.data.factions[faction_data.faction_id];
        if (!faction) continue;

        const row = document.createElement("div");
        row.className = "hex-faction-row";

        // Faction flag
        const flag = document.createElement("span");
        flag.className = "hex-faction-flag";
        flag.style.backgroundColor = faction.color;
        flag.textContent = faction.icon;
        flag.title = faction.name;

        // Faction name
        const name = document.createElement("span");
        name.className = "hex-faction-name";
        name.textContent = faction.name;

        // Presence
        const presence = document.createElement("input");
        presence.type = "number";
        presence.className = "hex-faction-presence";
        presence.min = "0";
        presence.value = faction_data.presence;

        // Remove faction button
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "bad-button";
        remove.textContent = "-";
        remove.title = `Remove ${faction.name}`;

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

        const row = document.createElement("div");
        row.className = "hex-landmark-row";

        // Icon selector
        const icon = document.createElement("select");
        icon.className = "hex-landmark-icon";

        const none_option = document.createElement("option");
        none_option.value = "";
        none_option.textContent = "--";

        icon.appendChild(none_option);

        // Select the current icon.
        icon.value = landmark.icon || "";

        // Landmark name
        const name = document.createElement("input");
        name.type = "text";
        name.className = "hex-landmark-name";
        name.placeholder = "Landmark name";
        name.value = landmark.name || "";

        // Landmark description
        const description = document.createElement("textarea");
        description.className = "hex-landmark-description";
        description.placeholder = "Enter landmark description...";
        description.value = landmark.description || "";

        row.appendChild(icon);
        row.appendChild(name);
        row.appendChild(description);

        landmark_list.appendChild(row);
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
        const row = document.createElement("div");
        row.className = "hex-note-row";

        const note = document.createElement("textarea");
        note.className = "hex-note";
        note.placeholder = "Enter note...";
        note.value = notes[i];

        row.appendChild(note);
        note_list.appendChild(row);
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

    const city_option = document.createElement("option");
    city_option.value = "city";
    city_option.textContent = "City";

    const landmark_option = document.createElement("option");
    landmark_option.value = "landmark";
    landmark_option.textContent = "Landmark";

    const faction_option = document.createElement("option");
    faction_option.value = "faction";
    faction_option.textContent = "Faction";

    const notes_option = document.createElement("option");
    notes_option.value = "notes";
    notes_option.textContent = "Notes";

    select.appendChild(city_option);
    select.appendChild(faction_option);
    select.appendChild(landmark_option);
    select.appendChild(notes_option);

    const add_button = document.createElement("button");
    add_button.id = "hex-add-property";
    add_button.className = "good-button";
    add_button.type = "button";
    add_button.textContent = "+ Add";

    section.appendChild(select);
    section.appendChild(add_button);

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

    owner_div.appendChild(button);
}