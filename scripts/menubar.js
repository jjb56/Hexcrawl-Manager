/*
    This file contains functions related to the menu bar, that is file, edit, view, etc.
    File | Edit | View | Tools | Help
*/

//========================================================================================================================================
//              Main Functions
//========================================================================================================================================

//if app.menu_active === true, automatically move to the next menu item

// File - New
function newMap() {
    //create a new map
}

// File - Open
function openMap() {
    //open an existing map
}

// File - Save
function saveMap() {
    //save the current map
}

// File - Save As
function saveMapAs() {
    //save the current map with a new name
}


// Edit - Undo
function undo() {
    const action = app.history.undo.pop();
    if (!action) return false;

    action.undo();
    app.history.redo.push(action);
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
    renderCurrentTool();
    updateHistoryButtons();
    return true;
}

function updateHistoryButtons() {
    document.querySelector("#button-edit-undo").disabled = app.history.undo.length === 0;
    document.querySelector("#button-edit-redo").disabled = app.history.redo.length === 0;
}

// Edit - Cut
function cut() {
    //cut the selected element to the clipboard
}

// Edit - Copy
function copy() {
    //copy the selected element to the clipboard
}

// Edit - Paste
function paste() {
    //paste the element from the clipboard
}


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

document.querySelector("#button-view-zoom-in").addEventListener("click", zoomIn);
document.querySelector("#button-view-zoom-out").addEventListener("click", zoomOut);
document.querySelector("#button-view-zoom-reset").addEventListener("click", zoomReset);
document.querySelector("#button-edit-undo").addEventListener("click", undo);
document.querySelector("#button-edit-redo").addEventListener("click", redo);
updateHistoryButtons();

//Tools - Terrain Paint
document.querySelector("#button-tools-terrain-paint").addEventListener("click", () => {
    activateTool("TERRAIN_PAINT");
});

// Tools - Faction Paint
document.querySelector("#button-tools-faction-paint").addEventListener("click", () => {
	activateTool("FACTION_PAINT");
});

// Tools - Geography
document.querySelector("#button-tools-geography").addEventListener("click", () => { 
    activateTool("GEOGRAPHY");
});

// Tools - Factions
document.querySelector("#button-tools-factions").addEventListener("click", () => {
    activateTool("FACTIONS");
});

// Tools - Map Configuration
document.querySelector("#button-tools-hex-configuration").addEventListener("click", () => {
    activateTool("HEX_CONFIGURATION");
});

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