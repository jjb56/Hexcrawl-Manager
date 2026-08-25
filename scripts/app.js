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
    HEX_EDIT: "HEX_EDIT"
});

let app = {
    current_tool: tools.NONE,
	selected_hex: null, //string coordinates
	hovered_hex: null, //string coordinates
	terrain_painting: null, //id of geography
	is_painting: false, //whether hovered hex will auto change to the new hex type. altered by paintTerrain();
	terrain_painting_affected: [],
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
    data: { //reset before use: next_id to 0, empty map, geography, roll_tables, and factions
        next_id: 6,
		party_hex: null,
        map: {  
			"3,5": {
				geography_id: 0,
				description: "First Test Cell",
				cities: [ //optional
					{
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
			},
			"3,6": {
				geography_id: 2,
				description: "Second Test Cell",
				factions: [ //optional, drawn as border around faction owned area, with thicker border for higher ratio of presence.
					{ faction_id: 1, presence: 400 },
					{ faction_id: 4, presence: 300 }
				], 
				landmarks: [ //optional
                    { name: "Stone", icon: "", description: "Another obelisk or something" }
                ]
			},
			"4,6": {
				geography_id: 0,
				description: "Third Test Cell",
				factions: [ //optional, drawn as border around faction owned area, with thicker border for higher ratio of presence.
					{ faction_id: 4, presence: 300 }
				]
			}
		},
        geography: {
			0: {
				name: 'Forest',
				background_color: '#047000',
				icon: '🌳',
				icon_color: '#00be00',
				roll_table_ids: []
			},
			2: {
				name: 'Desert',
				background_color: '#ebb400',
				icon: '🌵',
				icon_color: '#ffee8d',
				roll_table_ids: [5]
			}
		},
        factions: {
			1: {
				name: 'Empire',
				color: "#f72e2e",
				icon: "^",
				roll_table_ids: []
			},
			4: {
				name: 'Stormcloaks',
				color: "#5165d3",
				icon: "-.-",
				roll_table_ids: []
			}
		},
        roll_tables: {
			3: {
				name: "",
				rows: [
					["", ""],
					["", ""]
				]
			},
			5: {
				name: "",
				rows: [
					["", ""],
					["", ""]
				]
			}
		},
        hex_configuration: {
			map_width: 10,
			map_height: 10,

			shape: "pointy-top",

			cell_width: 87,
			cell_height: 100,

			bg_image: "",
			bg_stretch_x: 1.0,
			bg_stretch_y: 1.0,
			bg_offset_x: 0,
			bg_offset_y: 0,
			bg_alpha: 1.0,

			show_coordinates: true,
			icon_alpha: 1.0,
			faction_border_width: 15,
			faction_border_alpha: 1.0,
			border_width: 1
        }
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
			renderCurrentTool();
			return;

		case "HEX_EDIT":
			document.getElementById("properties-hex-edit")?.classList.remove(hide_var);
			renderCurrentTool();
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
		case tools.GEOGRAPHY:
			renderTerrainList();
			break;

		case tools.FACTIONS:
			renderFactionList();
			break;

		case tools.HEX_EDIT:
			renderHexEditTool();
			break;

		case tools.TERRAIN_PAINT:
			renderTerrainPaintList();
			break;

		default:
			//none
	}
}