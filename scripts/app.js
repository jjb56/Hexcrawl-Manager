/*
    This file contains the necessary functions to bring other files together, and has the code
    responsible for tying the app together. It also contains state machines, enums, and the info framework.
*/

const tools = Object.freeze({
    NONE: "NONE",
    GEOGRAPHY: "GEOGRAPHY",
    FACTIONS: "FACTIONS",
    HEX_CONFIGURATION: "HEX_CONFIGURATION",
    TERRAIN_PAINT: "TERRAIN_PAINT",
	FACTION_PAINT: "FACTION_PAINT",
    HEX_EDIT: "HEX_EDIT"
});


// Main data structure
let app = {
    current_tool: tools.NONE,
	selected_hex: null, //string coordinates
	hovered_hex: null, //string coordinates
	terrain_painting: null, //id of geography
	faction_painting: null, //id of faction
	faction_paint_amount: 100,
	is_painting: false, //whether hovered hex will auto change to the new hex type. altered by paintTerrain();
	terrain_painting_affected: [],
	faction_painting_affected: [],
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
        has_unsaved_changes: false
    },
	shape_sizes: {
		pointy_top: [87, 100],
		flat_top: [100, 87],
		square: [95, 95]
	},
    data: { //reset before use: next_id to 0, empty map, geography, roll_tables, and factions
		data_structure_version: 1, //Change this and creeate a migration when altering the data or how it holds info.
        next_id: 6,
		party_hex: null,
        map: {  
			"3,5": {
				name: "",
				geography_id: 0,
				description: "First Test Cell",
				cities: [ //optional
					{
						name: "City of Doom",
						icon: "",
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
				notes: [ //optional
					{ name: "Dangerous zone", content: "A dangerous zone full of mortals" }
				]
			},
			"3,6": {
				name: "",
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
				name: "",
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
				icon: 'oak_tree',
				icon_color: '#00be00',
				roll_table_ids: []
			},
			2: {
				name: 'Desert',
				background_color: '#ebb400',
				icon: 'cactus',
				icon_color: '#ffee8d',
				roll_table_ids: [5]
			}
		},
        factions: {
			1: {
				name: 'Empire',
				color: "#f72e2e",
				icon: "sun",
				icon_color: "#eeeedd",
				roll_table_ids: []
			},
			4: {
				name: 'Stormcloaks',
				color: "#5165d3",
				icon: "moon",
				icon_color: "#333355",
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
};

//========================================================================================================================================
//              Main Functions
//========================================================================================================================================
/**
 * Renders a tool in the properties panel
 * @param {string} tool The tool to render
 */
function activateTool(tool) {
	const previous_tool = app.current_tool;
	if (previous_tool !== tool && (previous_tool === tools.FACTION_PAINT || tool === tools.FACTION_PAINT ||
		previous_tool === tools.TERRAIN_PAINT || tool === tools.TERRAIN_PAINT)) {
		app.faction_painting = null;
		app.terrain_painting = null;
	}
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
			break;

		case "FACTIONS":
			document.getElementById("properties-factions")?.classList.remove(hide_var);
			renderCurrentTool();
			break;

		case "HEX_CONFIGURATION":
			document.getElementById("properties-hex-configuration")?.classList.remove(hide_var);
			renderCurrentTool();
			break;

		case "TERRAIN_PAINT":
			document.getElementById("properties-terrain-paint")?.classList.remove(hide_var);
			renderCurrentTool();
			break;

		case "FACTION_PAINT":
			document.getElementById("properties-faction-paint")?.classList.remove(hide_var);
			renderCurrentTool();
			break;

		case "HEX_EDIT":
			document.getElementById("properties-hex-edit")?.classList.remove(hide_var);
			renderCurrentTool();
			break;

		case "NONE":
		default:
			document.getElementById("properties-none")?.classList.remove(hide_var);
			app.selected_hex = null;
        	renderHexSelection(null)
	}

	document.querySelectorAll(".exit-tool-button").forEach(button => {
		button.addEventListener("click", () => activateTool(tools.NONE));
	})
}


/**
 * Renders the currently selected tool in app.data.current_tool
 */
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

		case tools.FACTION_PAINT:
			renderFactionPaintList();
			break;

		case tools.HEX_CONFIGURATION:
			renderHexConfiguration();
			break;

		default:
			//none
	}
}

//========================================================================================================================================
//              Icon Rendering
//========================================================================================================================================
/**
 * Returns an html element that allows the user to select an icon from the global icon list.
 * The selected icon is stored in the data at the given history path.
 * @param {string} parent_div The div to append the icon picker to
 * @param {string} history_path The path in the app.data object where the selected icon will be stored. For example, "map.3,5.landmarks.0.icon"
 */
function appendIconPicker(parent_div, history_path) {
	//button area
	const picker = document.createElement("div");
    picker.className = "icon-picker";
    picker.dataset.historyPath = history_path;
    picker.dataset.value = getDataFromHistoryPath(history_path);

	const button = document.createElement("button");
	button.type = "button";
	button.className = "icon-picker-button";

	const selected_image = document.createElement("img");
	selected_image.className = "icon-picker-selected-image";

	const arrow = document.createElement("span");
	arrow.className = "icon-picker-arrow";
	arrow.textContent = "▼";

	button.appendChild(selected_image);
	button.appendChild(arrow);

	//dropdown
	const dropdown = document.createElement("div");
	dropdown.className = "icon-picker-dropdown";

	const grid = document.createElement("div");
	grid.className = "icon-picker-grid";

	dropdown.appendChild(grid);

	//options
	icon_list.forEach(icon => {
		const option = document.createElement("button");
		option.type = "button";
		option.className = "icon-picker-option";
		option.dataset.value = icon.id;
		option.title = icon.name;
		option.addEventListener("click", () => {
			picker.dataset.value = icon.id;
			selected_image.src = icon.src;
			selected_image.alt = icon.name;
			dropdown.classList.remove("open");
			picker.dispatchEvent(new Event("change", { bubbles: true }));
		});

		const image = document.createElement("img");
		image.src = icon.src;
		image.alt = icon.name;

		option.appendChild(image);
		grid.appendChild(option);
	});

	//open/close
	button.addEventListener("click", () => {
		if (dropdown.classList.contains("open")) {
			dropdown.classList.remove("open");
			dropdown.classList.remove("open-above");
			return;
		}

		// Open it so we can measure it
		dropdown.classList.add("open");

		const aside = picker.closest("aside");

		if (aside) {
			const aside_rect = aside.getBoundingClientRect();
			const picker_rect = picker.getBoundingClientRect();

			const dropdown_width = dropdown.offsetWidth;

			// Center of the aside, relative to the picker
			const aside_center = aside_rect.left + aside_rect.width / 2;

			// Position dropdown so its center is at aside_center
			const dropdown_left =
				aside_center - picker_rect.left - dropdown_width / 2;

			dropdown.style.left = `${dropdown_left}px`;
		}

		// Determine whether it should open above or below
		const button_rect = button.getBoundingClientRect();
		const dropdown_rect = dropdown.getBoundingClientRect();

		const space_below = window.innerHeight - button_rect.bottom;
		const space_above = button_rect.top;

		if (space_below < dropdown_rect.height && space_above > space_below) {
			dropdown.classList.add("open-above");
		} else {
			dropdown.classList.remove("open-above");
		}
	});

	//initialize
	const initial_icon = icon_list.find(icon => icon.id === picker.dataset.value);
	if (initial_icon) {
		selected_image.src = initial_icon.src;
		selected_image.alt = initial_icon.name;
	}

	//assemble
	picker.appendChild(button);
	picker.appendChild(dropdown);

	//add to parent
	parent_div.appendChild(picker);
	return picker;
}

/**
 * gets the path to the image of the chosen icon
 * @param {string} icon_id The id of the icon to get
 * @returns {string} The path to the target icon
 */
function getIconPath(icon_id) {
	return icon_list.find(icon => icon.id === icon_id)?.src || "";
}


//========================================================================================================================================
//              Event Listeners
//========================================================================================================================================
// close tool buttons
document.querySelectorAll(".exit-tool-button").forEach(button => {
    button.addEventListener("click", () => {
        activateTool("NONE");
    });
});

document.addEventListener("DOMContentLoaded", () => activateTool(tools.NONE));