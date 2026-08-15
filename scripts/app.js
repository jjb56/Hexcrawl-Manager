/*
    This file contains the necessary functions to bring other files together, and has the code
    responsible for tying the app together. It also contains state machines, enums, and the info framework.
*/

//========================================================================================================================================
//              Main Functions
//========================================================================================================================================

const tools = Object.freeze({
    NONE: "NONE",
    GEOGRAPHY: "GEOGRAPHY",
    FACTIONS: "FACTIONS",
    HEX_CONFIGURATION: "HEX_CONFIGURATION",
    TERRAIN_PAINT: "TERRAIN_PAINT",
    EDIT_HEX: "EDIT_HEX"
});

let app = {
    current_tool: tools.NONE,
    menu: {
        is_active: false,
        selected: null
    },
    history: {
        undo: [],
        redo: [],
        maxHistory: 128
    },
    document: {
        name: "Untitled.json",
        hasUnsavedChanges: false
    },
    data: {
        next_id: 0,
        map: {},
        geography: {},
        factions: {},
        hex_configuration: {},
        roll_tables: {}
    }
};

//========================================================================================================================================
//              Tool open/close
//========================================================================================================================================
function activateTool(tool) {
  app.current_tool = tool;
  const hide_var = "hide";
  
    // Hide all tool areas
  document.querySelectorAll(".tool-area").forEach(div => {
    div.classList.add(hide_var);
  });

  switch (tool) {
    case "GEOGRAPHY":
      document.getElementById("properties-geography")?.classList.remove(hide_var);
      renderCurrentTool();
      return;

    case "FACTIONS":
      document.getElementById("properties-factions")?.classList.remove(hide_var);
      renderCurrentTool();
      return;

    case "HEX_CONFIGURATION":
      document.getElementById("properties-hex-configuration")?.classList.remove(hide_var);
      return;

    case "TERRAIN_PAINT":
      document.getElementById("properties-terrain-paint")?.classList.remove(hide_var);
      return;

    case "NONE":
    default:
      document.getElementById("properties-none")?.classList.remove(hide_var);
      return;
  }
}

activateTool("NONE");

// close tool buttons
document.querySelectorAll(".exit-tool-button").forEach(button => {
    button.addEventListener("click", () => {
        activateTool("NONE");
    });
});

// timer
function resetTimer(timer) {
    clearTimeout(timer);
    timer = setTimeout(() => saveTerrainChanges(), 7000);
}

//re-render tool
function renderCurrentTool() {
	switch (app.current_tool) {
		case "GEOGRAPHY":
			renderTerrainList();
			break;

		case "FACTIONS":
			renderFactionList();
			break;

		default:
			//none
	}
}