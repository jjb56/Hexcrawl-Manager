/*
    This file contains all related functionality for the terrain paint tool.
*/

document.addEventListener("mouseup", () => { endTerrainPaint(); });

//========================================================================================================================================
//              Main Functions
//========================================================================================================================================
/**
 * Paints the selected terrain onto the currently hovered hex while painting is active.
 * Tracks affected hexes for the current stroke and updates the rendered hex.
 * @returns {void}
 */
function paintTerrain(hex_key) {
    if (app.current_tool !== tools.TERRAIN_PAINT) return;
    if (!app.is_painting) {
        app.is_painting = true;
        app.terrain_painting_affected = [];
    }
    if (app.terrain_painting_affected.some(hex => hex.hex_id === hex_key)) return;

    if (!app.data.map[hex_key]) {
        app.data.map[hex_key] = {
            name: "",
            geography_id: null,
            description: ""
        }
    }

    const previous_type = app.data.map[hex_key].geography_id ?? null;
    app.terrain_painting_affected.push({ 
        hex_id: hex_key, 
        previous_type: previous_type
    });

    setTerrainPaintHex(hex_key, app.terrain_painting);
}


function setTerrainPaintHex(hex_id, terrain_id) {
    if (!app.data.map[hex_id]) {
        app.data.map[hex_id] = {
            name: "",
            geography_id: null,
            description: ""
        };
    }

    app.data.map[hex_id].geography_id = terrain_id;
    renderHexTerrain(hex_id);
    renderHexIcon(hex_id);
}

/**
 * Finishes the current terrain-painting stroke and commits it to history.
 * @returns {void}
 */
function endTerrainPaint() {
    if (!app.is_painting || app.current_tool !== tools.TERRAIN_PAINT) return;
    app.is_painting = false;
    const affected_hexes = app.terrain_painting_affected;

    const num_hexes_edited = affected_hexes.length;
    if (num_hexes_edited === 0) return;

    const terrain_id = app.terrain_painting;
    
    let description = "";
    if (terrain_id !== null) {
        description = `Painted ${app.data.geography[terrain_id].name} to ${num_hexes_edited} cell${num_hexes_edited > 1 ? "s" : ""}`;
    } else {
        description = `Erased ${num_hexes_edited} cell${num_hexes_edited > 1 ? "s" : ""}`;
    }

    //history management
    const undo_method = () => {
		for (const hex of affected_hexes) {
			setTerrainPaintHex(hex.hex_id, hex.previous_type);
		}
	};

	const redo_method = () => {
		for (const hex of affected_hexes) {
            setTerrainPaintHex(hex.hex_id, terrain_id);
		}
	};

    commitToHistory(description, undo_method, redo_method);
    app.terrain_painting_affected = [];
}

//========================================================================================================================================
//              Render Functions
//========================================================================================================================================

/**
 * Renders the list of terrains to paint, along with the selected one.
 * @returns {void}
 */
function renderTerrainPaintList() {
    const paint_div = document.getElementById("terrain-paint-list");
    paint_div.innerHTML = "";

    const terrains = Object.entries(app.data.geography || {});

    if (terrains.length === 0) {
        const message = document.createElement("p");
        const messageText = document.createElement("i");
        messageText.textContent = "No terrain exists to paint. Create a new terrain using the Geography tool.";
        message.appendChild(messageText);
        paint_div.appendChild(message);
        return;
    }
    for (const [key, terrain] of terrains) {
        const box = document.createElement("div");
        box.id = `terrain-paint-${key}`;
        box.classList = "terrain-paint-list-box";
        box.dataset.terrainKey = key;
        box.style.backgroundColor = `${terrain.background_color}`;
        if (app.terrain_painting === key) {
            box.classList.add("selected");
            box.style.borderColor = "var(--selected-border-color)";
        }
        box.onclick = () => {
            if (app.terrain_painting === key) {
                app.terrain_painting = null;
                box.classList.remove("selected");
                box.style.borderColor = "";
            } else {
                app.terrain_painting = key;
                paint_div.querySelectorAll(".selected").forEach((item) => {
                    item.classList.remove("selected");
                    item.style.borderColor = "";
                });
                box.classList.add("selected");
                box.style.borderColor = "var(--selected-border-color)";
            }
        };

        const icon_data = icon_list.find(item => item.id === terrain.icon);
        const image = document.createElement("img");
        image.className = "paint-icon";
        image.style.backgroundColor = terrain.icon_color;
        image.style.mask = `url(${icon_data.src}) center / contain no-repeat`;
        box.appendChild(image);
        
        const nameParagraph = document.createElement("p");
        nameParagraph.textContent = terrain.name;
        box.appendChild(nameParagraph);

        paint_div.appendChild(box);
    }
}