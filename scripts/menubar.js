/*
    This file contains functions related to the menu bar, that is file, edit, view, etc.
    File | Edit | View | Tools | Help
*/

//========================================================================================================================================
//              Main Functions
//========================================================================================================================================
// File - New
function newMap() {
    let new_data = {
        next_id: 0,
        party_hex: null,
        map: {},
        geography: {},
        factions: {},
        roll_tables: {},
        hex_configuration: {
            map_width: 10,
            map_height: 10,
            shape: "pointy-top",
            cell_width: 100,
            cell_height: 100,
            bg_image: "",
            bg_stretch_x: 100,
            bg_stretch_y: 100,
            bg_offset_x: 0,
            bg_offset_y: 0,
            bg_alpha: 100,
            show_coordinates: true,
            show_empty_cell_background: true,
            show_geography_background_colors: true,
            icon_alpha: 100,
            faction_border_width: 7,
            faction_border_alpha: 100,
            border_width: 1
        }
    }

    app.data = new_data;
    app.document.name = "Untitles.json";
    app.document.has_unsaved_changes = false;
    app.selected_hex = null;
    app.hovered_hex = null;
    renderHexes();
    showMessage("Created new map", true);
}

// File - Open
function openMap() {
    //used the hidden file selector at the bottom of the page
    document.getElementById("map-file-input").click();
}

// File - Save
async function saveMap() {
    const json = getMapJSON();
    const handle = await window.showSaveFilePicker({
        suggestedName: app.document.name,
        types: [{
            description: "JSON Map",
            accept: { "application/json": [".json"] }
        }]
    });

    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();

    app.document.name = handle.name;
    app.document.has_unsaved_changes = false;

    renderFileName();
}

// // File - Save As
// function saveMapAs() {
//     //save the current map with a new name
// }


// Edit - Undo
function undo() {
    const action = app.history.undo.pop();
    if (!action) return false;

    action.undo();
    app.history.redo.push(action);

    const actionName = action.name || action.type || "Action";
    showMessage(`Undo: ${actionName}`, true);

    renderCurrentTool();
    updateHistoryButtons();
    return true;
}

// Edit - Redo
function redo() {
    const action = app.history.redo.pop();
    if (!action) return false;

    action.redo();
    app.history.undo.push(action);

    const actionName = action.name || action.type || "Action";
    showMessage(`Redo: ${actionName}`, true);

    renderCurrentTool();
    updateHistoryButtons();
    return true;
}

function updateHistoryButtons() {
    document.querySelector("#button-edit-undo").disabled = app.history.undo.length === 0;
    document.querySelector("#button-edit-redo").disabled = app.history.redo.length === 0;
}

// // Edit - Cut
// function cut() {
//     //cut the selected element to the clipboard
// }

// // Edit - Copy
// function copy() {
//     //copy the selected element to the clipboard
// }

// // Edit - Paste
// function paste() {
//     //paste the element from the clipboard
// }


// View - Zoom In
function zoomIn() {
    zoomMapIn();
}

// View - Zoom Out
function zoomOut() {
    zoomMapOut();
}
// View - Zoom Reset
function zoomReset() {
    resetMapZoom();
}


//File
document.querySelector("#button-file-new").addEventListener("click", newMap);
document.querySelector("#button-file-open").addEventListener("click", openMap);
document.getElementById("map-file-input").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            app.data = data;
            app.document.name = file.name;
            app.document.has_unsaved_changes = false;
            renderHexes();
            renderFileName();
            showMessage(`Opened ${file.name}`, true);
        } catch (error) {
            console.error(error);
            showMessage("Could not open map file.", false);
        }
    };
    reader.readAsText(file);
    event.target.value = ""; // Allows the user to open the same file again later
});
document.querySelector("#button-file-save").addEventListener("click", saveMap);


//Edit
document.querySelector("#button-edit-undo").addEventListener("click", undo);
document.querySelector("#button-edit-redo").addEventListener("click", redo);
updateHistoryButtons();

// View
document.querySelector("#button-view-zoom-in").addEventListener("click", zoomIn);
document.querySelector("#button-view-zoom-out").addEventListener("click", zoomOut);
document.querySelector("#button-view-zoom-reset").addEventListener("click", zoomReset);

//Tools
document.querySelector("#button-tools-terrain-paint").addEventListener("click", () => activateTool(tools.TERRAIN_PAINT));
document.querySelector("#button-tools-faction-paint").addEventListener("click", () => activateTool(tools.FACTION_PAINT));
document.querySelector("#button-tools-geography").addEventListener("click", () => activateTool(tools.GEOGRAPHY));
document.querySelector("#button-tools-factions").addEventListener("click", () => activateTool(tools.FACTIONS));
document.querySelector("#button-tools-hex-configuration").addEventListener("click", () => activateTool(tools.HEX_CONFIGURATION));

// Help - Manual
function displayManual() {
    //display the manual
}

// Help - About
function displayAbout() {
    //display information about the application
}

// Help - Version
//no tool, only a disabled button that displays a modal with information about the application

// Menu Clicking Functionality
const menuButtons = document.querySelectorAll(".menu-button");
const menus = document.querySelectorAll(".dropdown-menu");

// menu button click
menuButtons.forEach(button => {
    button.addEventListener("click", (event) => {
        event.stopPropagation();

        if (app.menu.is_active && app.menu.selected === button.nextElementSibling) {
            closeAllMenus() //TODO
        } else {
            openMenu(button);
        }
    });

    //hover handling
    button.addEventListener("mouseenter", () => {
        if (app.menu.is_active) {
            openMenu(button);
        }
    });
});

// click outside menu
document.addEventListener("click", () => {
    closeAllMenus();
});

//hotkeys
document.addEventListener("keydown", function(event) {
    if (!event.ctrlKey) return;
    switch (event.key.toLowerCase()) {
        case "n":
            event.preventDefault();
            newMap();
            break;

        case "o":
            event.preventDefault();
            openMap();
            break;

        case "s":
            event.preventDefault();
            if (event.shiftKey) {
                saveMapAs();
            } else {
                saveMap();
            }
            break;
    }
});

//========================================================================================================================================
//              Helper Functions
//========================================================================================================================================
function openMenu(button) {
    closeAllMenus();

    app.menu.is_active = true;
    app.menu.selected = button.nextElementSibling; //assumes the new dropdown is right

    if (app.menu.selected) {
        app.menu.selected.classList.add("show");
        button.classList.add("active-button");
    }
}

function closeAllMenus() {
    app.menu.is_active = false;
    app.menu.selected = null;

    menus.forEach(menu => menu.classList.remove("show"));
    menuButtons.forEach(btn => btn.classList.remove("active-button"));
}