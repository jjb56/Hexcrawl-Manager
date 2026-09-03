/*
    This file contains code related to the hex drawing and selecting surface.
*/

let map_camera;
map_camera = {
    scale: 1,
    x: 0,
    y: 0,
    min_scale: 0.25,
    max_scale: 4,
    zoom_focus_x: null,
    zoom_focus_y: null,
    is_panning: false,
    pointer_id: null,
    start_pointer_x: 0,
    start_pointer_y: 0,
    start_camera_x: 0,
    start_camera_y: 0
};

renderHexes();
setupMapCamera();
updateMapSurfaceSize();
applyMapCamera();

//========================================================================================================================================
//              Main Functions
//========================================================================================================================================
/**
 * Selects a hex and opens the HEX editing tool.
 * @param {string} hex_key The string containing the x and y map coordinates of the cell.
 * @returns {void}
 */
function selectHex(hex_key) {
    if (app.current_tool === tools.TERRAIN_PAINT || app.current_tool === tools.FACTION_PAINT || app.is_painting) return;

    app.selected_hex = hex_key;
    renderHexSelection(hex_key);
    app.current_tool = "HEX_EDIT";
    activateTool("HEX_EDIT");
}

//========================================================================================================================================
//              Render Functions
//========================================================================================================================================
/**
 * Renders all hexes on the map.
 * @returns {void}
 */
function renderHexes() {
    const config = app.data.hex_configuration;

    // Remove cells from the previous render that are outside the current map bounds.
    document.querySelectorAll(".hex").forEach(hex => {
        const [x, y] = (hex.dataset.hexKey || "").split(",").map(Number);
        if (!Number.isInteger(x) || !Number.isInteger(y) ||
            x < 0 || x >= config.map_width || y < 0 || y >= config.map_height) {
            hex.remove();
        }
    });

    for (let y = 0; y < config.map_height; y++) {
        for (let x = 0; x < config.map_width; x++) {
            const hex_key = `${x},${y}`;
            renderHex(hex_key);
            renderHexTerrain(hex_key);
            renderHexIcon(hex_key);
            renderFactionBorders(hex_key);
            renderHexOutlines(hex_key);
            renderHexCoordinates(hex_key);
        }
    }

    if (app.selected_hex !== null) renderHexSelection(app.selected_hex);
    updateMapSurfaceSize();
    if (map_camera) applyMapCamera();
}

/**
 * Gets the map surface element.
 * @returns {HTMLElement|null}
 */
function getMapSurface() {
    return document.getElementById("hex-map-surface");
}


/**
 * Gets the bounds of the map surface.
 * @returns {Object} The width and height of the map bounds.
 */
function getMapBounds() {
    const config = app.data.hex_configuration;
    const dimensions = getHexDimensions(config);
    let width;
    let height;

    switch (config.shape) {
        case "pointy-top":
            width = (config.map_width - 1) * dimensions.width + dimensions.width +
                (config.map_height > 1 ? dimensions.width / 2 : 0);
            height = (config.map_height - 1) * dimensions.height * 0.75 + dimensions.height;
            break;
        case "flat-top":
            width = (config.map_width - 1) * dimensions.width * 0.75 + dimensions.width;
            height = (config.map_height - 1) * dimensions.height + dimensions.height +
                (config.map_width > 1 ? dimensions.height / 2 : 0);
            break;
        case "square":
        default:
            width = config.map_width * dimensions.width;
            height = config.map_height * dimensions.height;
            break;
    }

    return { width: Math.max(0, width), height: Math.max(0, height) };
}


/**
 * Updates the size of the map surface based on its bounds.
 * @returns {void}
 */
function updateMapSurfaceSize() {
    const surface = getMapSurface();
    if (!surface) return;

    const bounds = getMapBounds();
    surface.style.width = `${bounds.width}px`;
    surface.style.height = `${bounds.height}px`;
}


/**
 * Gets the limits of the map camera based on the map area and bounds.
 * @returns {Object} The minimum and maximum x and y coordinates for the camera.
 */
function getCameraLimits() {
    const map_area = document.getElementById("map-area");
    const bounds = getMapBounds();
    const scaled_width = bounds.width * map_camera.scale;
    const scaled_height = bounds.height * map_camera.scale;
    const half_viewport_width = map_area.clientWidth / 2;
    const half_viewport_height = map_area.clientHeight / 2;

    return {
        min_x: half_viewport_width - scaled_width,
        max_x: half_viewport_width,
        min_y: half_viewport_height - scaled_height,
        max_y: half_viewport_height
    };
}


/**
 * Clamps the map camera position within the calculated limits.
 */
function clampMapCamera() {
    const limits = getCameraLimits();
    map_camera.x = Math.min(limits.max_x, Math.max(limits.min_x, map_camera.x));
    map_camera.y = Math.min(limits.max_y, Math.max(limits.min_y, map_camera.y));
}


/**
 * Applies the current map camera position and scale to the map surface.
 * @returns {void}
 */
function applyMapCamera() {
    const surface = getMapSurface();
    if (!surface) return;

    clampMapCamera();
    surface.style.transform = `translate(${map_camera.x}px, ${map_camera.y}px) scale(${map_camera.scale})`;
}


/**
 * Sets the zoom level of the map.
 * @param {number} next_scale 
 * @param {number} focus_x 
 * @param {number} focus_y 
 * @returns {void}
 */
function setMapZoom(next_scale, focus_x = null, focus_y = null) {
    const map_area = document.getElementById("map-area");
    const surface = getMapSurface();
    if (!map_area || !surface) return;

    const scale = Math.min(map_camera.max_scale, Math.max(map_camera.min_scale, next_scale));
    if (scale === map_camera.scale) return;

    if (focus_x !== null && focus_y !== null) {
        const surface_x = (focus_x - map_camera.x) / map_camera.scale;
        const surface_y = (focus_y - map_camera.y) / map_camera.scale;
        map_camera.scale = scale;
        map_camera.x = focus_x - surface_x * scale;
        map_camera.y = focus_y - surface_y * scale;
    } else {
        map_camera.scale = scale;
    }

    applyMapCamera();
}


/**
 * Zooms the map in.
 */
function zoomMapIn() {
    setMapZoom(map_camera.scale * 1.2, ...getMapZoomFocus());
}


/**
 * Zooms the map out.
 */
function zoomMapOut() {
    setMapZoom(map_camera.scale / 1.2, ...getMapZoomFocus());
}


/**
 * Gets the focus point for zooming.
 * @returns {Array<number>} The x and y coordinates for the zoom focus.
 */
function getMapZoomFocus() {
    const map_area = document.getElementById("map-area");
    return [
        map_camera.zoom_focus_x ?? map_area.clientWidth / 2,
        map_camera.zoom_focus_y ?? map_area.clientHeight / 2
    ];
}


/**
 * Resets the map zoom to the default level.
 * @returns {void}
 */
function resetMapZoom() {
    map_camera.scale = 1;
    map_camera.x = 0;
    map_camera.y = 0;
    applyMapCamera();
}


/**
 * Checks if a form element is currently active.
 * @returns {boolean} True if a form element is active, false otherwise.
 */
function isFormElementActive() {
    const active_element = document.activeElement;
    return active_element?.matches("input, textarea, select, button, [contenteditable=\"true\"]") ?? false;
}


/**
 * Sets up the map camera.
 * @returns {void}
 */
function setupMapCamera() {
    const map_area = document.getElementById("map-area");
    if (!map_area) return;

    map_area.addEventListener("contextmenu", event => event.preventDefault());
    map_area.addEventListener("click", event => {
        if (event.target.closest(".hex")) return;
        if (app.current_tool !== tools.HEX_EDIT) return;
        activateTool(tools.NONE);
    });
    map_area.addEventListener("wheel", event => {
        event.preventDefault();
        const rectangle = map_area.getBoundingClientRect();
        const focus_x = event.clientX - rectangle.left;
        const focus_y = event.clientY - rectangle.top;
        map_camera.zoom_focus_x = focus_x;
        map_camera.zoom_focus_y = focus_y;
        setMapZoom(map_camera.scale * (event.deltaY < 0 ? 1.1 : 1 / 1.1), focus_x, focus_y);
    }, { passive: false });

    map_area.addEventListener("pointerdown", event => {
        if (event.button !== 2) return;
        map_camera.is_panning = true;
        map_camera.pointer_id = event.pointerId;
        map_camera.start_pointer_x = event.clientX;
        map_camera.start_pointer_y = event.clientY;
        map_camera.start_camera_x = map_camera.x;
        map_camera.start_camera_y = map_camera.y;
        map_area.setPointerCapture(event.pointerId);
        map_area.classList.add("map-panning");
        event.preventDefault();
    });

    map_area.addEventListener("pointermove", event => {
        const rectangle = map_area.getBoundingClientRect();
        map_camera.zoom_focus_x = event.clientX - rectangle.left;
        map_camera.zoom_focus_y = event.clientY - rectangle.top;
        if (!map_camera.is_panning || event.pointerId !== map_camera.pointer_id) return;
        map_camera.x = map_camera.start_camera_x + event.clientX - map_camera.start_pointer_x;
        map_camera.y = map_camera.start_camera_y + event.clientY - map_camera.start_pointer_y;
        applyMapCamera();
    });

    const end_pan = event => {
        if (!map_camera.is_panning || event.pointerId !== map_camera.pointer_id) return;
        map_camera.is_panning = false;
        map_camera.pointer_id = null;
        map_area.classList.remove("map-panning");
        if (map_area.hasPointerCapture(event.pointerId)) map_area.releasePointerCapture(event.pointerId);
    };
    map_area.addEventListener("pointerup", end_pan);
    map_area.addEventListener("pointercancel", end_pan);
    window.addEventListener("resize", applyMapCamera);
}


/**
 * Updates the hover state of a single hex.
 * @param {string|null} hex_key The hex to highlight, or null to remove the highlight.
 * @returns {void}
 */
function renderHexHover(hex_key) {
    // Remove the previous hover state.
    if (app.hovered_hex !== null) {
        const previous_hex = document.querySelector(`[data-hex-key="${app.hovered_hex}"]`);

        if (previous_hex) {
            previous_hex.classList.remove("hex-hovered");
        }
    }

    app.hovered_hex = hex_key;

    // Add the new hover state.
    if (hex_key !== null) {
        const hex = document.querySelector(`[data-hex-key="${hex_key}"]`);
        if (hex) hex.classList.add("hex-hovered");
    }
}



/**
 * Renders the selection border around a single hex.
 * @param {string|null} hex_key The selected hex, or null to remove the selection.
 * @returns {void}
 */
function renderHexSelection(hex_key) {
    // Remove previous selection state.
    document.querySelectorAll(".hex-selected").forEach(hex => hex.classList.remove("hex-selected"));
    // Remove previous selection borders.
    document.querySelectorAll(".hex-selection-border").forEach(border => border.remove());
    if (hex_key === null) return;

    const hex = document.querySelector(`[data-hex-key="${hex_key}"]`);
    if (!hex) return;

    // Raise the entire hex above its neighbors.
    hex.classList.add("hex-selected");

    const config = app.data.hex_configuration;
    const dimensions = getHexDimensions(config);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("hex-selection-border");
    svg.setAttribute("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);
    svg.setAttribute("width", dimensions.width);
    svg.setAttribute("height", dimensions.height);

    let points;
    switch (config.shape) {
        case "pointy-top":
            points = [
                [dimensions.width / 2, 0],
                [dimensions.width, dimensions.height * 0.25],
                [dimensions.width, dimensions.height * 0.75],
                [dimensions.width / 2, dimensions.height],
                [0, dimensions.height * 0.75],
                [0, dimensions.height * 0.25]
            ];
            break;

        case "flat-top":
            points = [
                [dimensions.width * 0.25, 0],
                [dimensions.width * 0.75, 0],
                [dimensions.width, dimensions.height / 2],
                [dimensions.width * 0.75, dimensions.height],
                [dimensions.width * 0.25, dimensions.height],
                [0, dimensions.height / 2]
            ];
            break;

        case "square":
            points = [
                [0, 0],
                [dimensions.width, 0],
                [dimensions.width, dimensions.height],
                [0, dimensions.height]
            ];
            break;

        default:
            return;
    }

    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", points.map(point => `${point[0]},${point[1]}`).join(" "));
    polygon.setAttribute("fill", "none");
    polygon.setAttribute("stroke", "white");
    polygon.setAttribute("stroke-width", 3);
    polygon.setAttribute("stroke-linejoin", "round");

    svg.appendChild(polygon);
    hex.appendChild(svg);
}

/**
 * Rendars the terrain of a single hex cell.
 * @param {string} hex_key The string containing the x and y map coordinates of the cell.
 * @returns {void}
 */
function renderHexTerrain(hex_key) {
    const hex = document.querySelector(`[data-hex-key="${hex_key}"]`);
    const hex_data = app.data.map[hex_key];
    const show_empty_cell_background = app.data.hex_configuration.show_empty_cell_background !== false;
    const show_geography_background_colors = app.data.hex_configuration.show_geography_background_colors !== false;

    if (!hex_data || hex_data.geography_id === null || hex_data.geography_id === undefined) {
        hex.style.backgroundColor = show_empty_cell_background && show_geography_background_colors ? "gray" : "transparent";
        return;
    }

    const geography = app.data.geography[hex_data.geography_id];

    if (!geography) {
        hex.style.backgroundColor = show_empty_cell_background ? "gray" : "transparent";
        return;
    }
    hex.style.backgroundColor = show_geography_background_colors ? geography.background_color : "transparent";
}

/**
 * Renders the geography icon of a single hex cell, or renders the icon of the city if the hex contains a city.
 * @param {string} hex_key The string containing the x and y map coordinates of the cell.
 * @returns {void}
 */
function renderHexIcon(hex_key) {
    const hex = document.querySelector(`[data-hex-key="${hex_key}"]`);
    const hex_data = app.data.map[hex_key];
    if (!hex) return;

    // choose proper image
    //set default image
    let image = "aaa_none";
    //set image to geography icon
    const has_geography = hex_data?.geography_id !== undefined && hex_data?.geography_id !== null;
    const geography = has_geography ? app.data.geography[hex_data.geography_id] : null;
    if (geography?.icon) {
        image = geography.icon;
    }
    //set image to first landmark with image
    const landmark = hex_data?.landmarks?.find(landmark => landmark.icon && landmark.icon !== "aaa_none");
    const has_landmark_icon = Boolean(landmark);
    if (landmark) {
        image = landmark.icon;
    }
    //overwrite image with city icon
    const city = hex_data?.cities?.[0];
    const has_city_icon = Boolean(city?.icon && city.icon !== "aaa_none");
    if (has_city_icon) {
        image = city.icon;
    }
    //set color
    const color = has_city_icon || has_landmark_icon ? "#000000" : (geography?.icon_color || "#000000");

    // cancel if no icon
    const icon_data = getIconPath(image);
    if (!icon_data || image === "aaa_none") return;

    //prep the icon area
    const shape_width = hex.offsetWidth;
    const shape_height = hex.offsetHeight;
    const icon_size = Math.max(shape_width, shape_height) * 0.5;

    //create the icon holder
    let icon = hex.querySelector(".hex-icon");
    if (!icon) {
        icon = document.createElement("span");
        icon.classList.add("hex-icon");
        hex.appendChild(icon);
    }
    icon.classList.add("geography-icon");
    icon.textContent = "";
    icon.style.backgroundColor = color;
    icon.style.mask = `url(${icon_data}) center / contain no-repeat`;
    icon.style.webkitMask = `url(${icon_data}) center / contain no-repeat`;
    icon.style.width = `${icon_size}px`;
    icon.style.height = `${icon_size}px`;
    icon.style.opacity = app.data.hex_configuration.icon_alpha;
}

/**
 * Renders the map coordinates of a single hex cell.
 * @param {string} hex_key The string containing the x and y map coordinates of the cell.
 * @returns {void}
 */
function renderHexCoordinates(hex_key) {
    const hex = document.querySelector(`[data-hex-key="${hex_key}"]`);
    const config = app.data.hex_configuration;
    let coordinate = hex.querySelector(".hex-coordinate");

    if (!config.show_coordinates) {
        if (coordinate) coordinate.remove();
        return;
    }

    if (!coordinate) {
        coordinate = document.createElement("span");
        coordinate.classList.add("hex-coordinate");
        hex.appendChild(coordinate);
    }

    coordinate.textContent = hex_key;
}


/**
 * Renders the faction borders of a single hex cell.
 *
 * Factions are drawn from highest presence to lowest presence. Each faction receives a border width proportional to its presence.
 * An edge is omitted when the neighboring cell contains that faction.
 *
 * The faction border is clipped to the actual shape of the cell so the stroke cannot visually extend outside the cell.
 * @param {string} hex_key The string containing the x and y map coordinates of the cell.
 * @returns {void}
 */
function refreshFactionBorderNeighbors(hex_key) {
    const [x, y] = hex_key.split(",").map(Number);
    const shape = app.data.hex_configuration.shape;
    let neighbors;

    if (shape === "pointy-top") {
        neighbors = y % 2 === 0 ? [
            `${x},${y - 1}`,
            `${x + 1},${y}`,
            `${x},${y + 1}`,
            `${x - 1},${y + 1}`,
            `${x - 1},${y}`,
            `${x - 1},${y - 1}`
        ] : [
            `${x + 1},${y - 1}`,
            `${x + 1},${y}`,
            `${x + 1},${y + 1}`,
            `${x},${y + 1}`,
            `${x - 1},${y}`,
            `${x},${y - 1}`
        ];

    } else if (shape === "flat-top") {
        neighbors = x % 2 === 0 ? [
            `${x},${y - 1}`,
            `${x + 1},${y - 1}`,
            `${x + 1},${y}`,
            `${x},${y + 1}`,
            `${x - 1},${y}`,
            `${x - 1},${y - 1}`
        ] : [
            `${x},${y - 1}`,
            `${x + 1},${y}`,
            `${x + 1},${y + 1}`,
            `${x},${y + 1}`,
            `${x - 1},${y + 1}`,
            `${x - 1},${y}`
        ];

    } else if (shape === "square") {
        neighbors = [
            `${x},${y - 1}`,
            `${x + 1},${y}`,
            `${x},${y + 1}`,
            `${x - 1},${y}`
        ];

    } else {
        return;
    }

    renderFactionBorders(hex_key);
    for (const neighbor_key of neighbors) {
        renderFactionBorders(neighbor_key);
    }
}


/**
 * 
 * @param {*} hex_key 
 * @returns 
 */
function renderFactionBorders(hex_key) {
    const hex = document.querySelector(`[data-hex-key="${hex_key}"]`);
    const hex_data = app.data.map[hex_key];
    const config = app.data.hex_configuration;
    if (!hex) return;

    let border_surface = hex.querySelector(".hex-faction-borders");
    const dimensions = getHexDimensions(config);

    // NO FACTION DATA
    if (!hex_data || !hex_data.factions || hex_data.factions.length === 0 || config.faction_border_width <= 0) {
        if (border_surface) border_surface.remove();
        return;
    }

    // CREATE SVG
    if (!border_surface) {
        border_surface = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        border_surface.classList.add("hex-faction-borders");
        hex.appendChild(border_surface);
    }
    border_surface.setAttribute("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);
    border_surface.setAttribute("width", dimensions.width);
    border_surface.setAttribute("height", dimensions.height);
    border_surface.replaceChildren(); // Remove anything rendered during the previous pass.

    // SORT FACTIONS
    const factions = [...hex_data.factions];
    factions.sort((a, b) => b.presence - a.presence);
    const strongest_presence = factions[0]?.presence ?? 0;
    if (strongest_presence <= 0) {
        if (border_surface <= 0) border_surface.remove();
        return;
    }

    // HEX GEOMETRY
    const [x, y] = hex_key.split(",").map(Number);
    let neighbors = [];
    let edges = [];
    let clip_points = [];

    if (config.shape === "pointy-top") { // POINTY-TOP
        const points = [
            [dimensions.width / 2, 0],                      // 0
            [dimensions.width, dimensions.height * 0.25], // 1
            [dimensions.width, dimensions.height * 0.75], // 2
            [dimensions.width / 2, dimensions.height],    // 3
            [0, dimensions.height * 0.75],                 // 4
            [0, dimensions.height * 0.25]                   // 5
        ];
        edges = [
            [points[0], points[1]], // 0 upper-right
            [points[1], points[2]], // 1 right
            [points[2], points[3]], // 2 lower-right
            [points[3], points[4]], // 3 lower-left
            [points[4], points[5]], // 4 left
            [points[5], points[0]]  // 5 upper-left
        ];
        clip_points = points;

        if (y % 2 === 0) {
            neighbors = [
                `${x},${y - 1}`,       // 0 upper-right
                `${x + 1},${y}`,       // 1 right
                `${x},${y + 1}`,       // 2 lower-right
                `${x - 1},${y + 1}`,   // 3 lower-left
                `${x - 1},${y}`,       // 4 left
                `${x - 1},${y - 1}`    // 5 upper-left
            ];
        } else {
            neighbors = [
                `${x + 1},${y - 1}`,   // 0 upper-right
                `${x + 1},${y}`,       // 1 right
                `${x + 1},${y + 1}`,   // 2 lower-right
                `${x},${y + 1}`,       // 3 lower-left
                `${x - 1},${y}`,       // 4 left
                `${x},${y - 1}`        // 5 upper-left
            ];
        }

    } else if (config.shape === "flat-top") { // FLAT-TOP
        const points = [
            [dimensions.width * 0.25, 0],                    // 0
            [dimensions.width * 0.75, 0],                    // 1
            [dimensions.width, dimensions.height / 2],      // 2
            [dimensions.width * 0.75, dimensions.height],   // 3
            [dimensions.width * 0.25, dimensions.height],   // 4
            [0, dimensions.height / 2]                       // 5
        ];
        edges = [
            [points[0], points[1]], // 0 top
            [points[1], points[2]], // 1 upper-right
            [points[2], points[3]], // 2 lower-right
            [points[3], points[4]], // 3 bottom
            [points[4], points[5]], // 4 lower-left
            [points[5], points[0]]  // 5 upper-left
        ];
        clip_points = points;

        if (x % 2 === 0) {
            neighbors = [
                `${x},${y - 1}`,       // 0 top
                `${x + 1},${y - 1}`,   // 1 upper-right
                `${x + 1},${y}`,       // 2 lower-right
                `${x},${y + 1}`,       // 3 bottom
                `${x - 1},${y}`,       // 4 lower-left
                `${x - 1},${y - 1}`    // 5 upper-left
            ];
        } else {
            neighbors = [
                `${x},${y - 1}`,       // 0 top
                `${x + 1},${y}`,       // 1 upper-right
                `${x + 1},${y + 1}`,   // 2 lower-right
                `${x},${y + 1}`,       // 3 bottom
                `${x - 1},${y + 1}`,   // 4 lower-left
                `${x - 1},${y}`        // 5 upper-left
            ];
        }

    } else if (config.shape === "square") { // SQUARE
        const points = [
            [0, 0],
            [dimensions.width, 0],
            [dimensions.width, dimensions.height],
            [0, dimensions.height]
        ];
        edges = [
            [points[0], points[1]], // 0 top
            [points[1], points[2]], // 1 right
            [points[2], points[3]], // 2 bottom
            [points[3], points[0]]  // 3 left
        ];
        clip_points = points;

        neighbors = [
            `${x},${y - 1}`, // 0 top
            `${x + 1},${y}`, // 1 right
            `${x},${y + 1}`, // 2 bottom
            `${x - 1},${y}`  // 3 left
        ];

    } else { // Unknown shape.
        return;
    }

    // CREATE CLIPPING PATH
    const clip_id = `faction-clip-${hex_key.replace(",", "-")}`;
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const clip_path = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clip_path.setAttribute("id", clip_id);
    clip_path.setAttribute("clipPathUnits", "userSpaceOnUse");

    const clip_polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    clip_polygon.setAttribute("points", clip_points.map(point => `${point[0]},${point[1]}`).join(" "));
    clip_path.appendChild(clip_polygon);
    defs.appendChild(clip_path);
    border_surface.appendChild(defs);

    // Everything drawn in this SVG is clipped to the cell.
    border_surface.setAttribute("clip-path", `url(#${clip_id})`);

    // DRAW FACTION BORDERS
    for (const faction of factions) {
        const faction_info = app.data.factions[faction.faction_id];
        if (!faction_info) continue;
        if (faction.presence <= 0) continue;
        const width_ratio = faction.presence / strongest_presence;
        const border_width = 2 * config.faction_border_width * width_ratio;

        // Check every possible edge.
        for (let edge_index = 0; edge_index < edges.length; edge_index++) {
            const neighbor_key = neighbors[edge_index];
            const [neighbor_x, neighbor_y] = neighbor_key.split(",").map(Number);
            const neighbor_is_in_bounds = neighbor_x >= 0 && neighbor_x < config.map_width &&
                neighbor_y >= 0 && neighbor_y < config.map_height;
            const neighbor_data = neighbor_is_in_bounds ? app.data.map[neighbor_key] : null;
            const faction_present = neighbor_data?.factions?.some(neighbor_faction => neighbor_faction.faction_id === faction.faction_id) ?? false;
            if (faction_present) continue;

            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            const [start, end] = edges[edge_index];

            const dx = end[0] - start[0];
            const dy = end[1] - start[1];
            const extended_start = [
                start[0] - dx * 0.2,
                start[1] - dy * 0.2
            ];
            const extended_end = [
                end[0] + dx * 0.2,
                end[1] + dy * 0.2
            ];

            line.setAttribute("x1", extended_start[0]);
            line.setAttribute("y1", extended_start[1]);

            line.setAttribute("x2", extended_end[0]);
            line.setAttribute("y2", extended_end[1]);

            line.setAttribute("stroke", faction_info.color);
            line.setAttribute("stroke-width", border_width);
            line.setAttribute("stroke-opacity", config.faction_border_alpha);
            line.setAttribute("stroke-linecap", "butt");

            border_surface.appendChild(line);
        }
    }
}

/**
 * Renders the normal grid outline of a single hex cell.
 * @param {string} hex_key The string containing the x and y map coordinates of the cell.
 * @returns {void}
 */
function renderHexOutlines(hex_key) {
    const hex = document.querySelector(`[data-hex-key="${hex_key}"]`);
    const config = app.data.hex_configuration;
    const dimensions = getHexDimensions(config);
    let outline = hex.querySelector(".hex-outline");

    if (config.border_width <= 0) {
        if (outline) outline.remove();
        return;
    }
    if (!outline) {
        outline = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );
        outline.classList.add("hex-outline");
        const polygon = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "polygon"
        );
        polygon.classList.add("hex-outline-polygon");
        outline.appendChild(polygon);
        hex.appendChild(outline);
    }

    const polygon = outline.querySelector(".hex-outline-polygon");
    outline.setAttribute("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);
    outline.setAttribute("width", dimensions.width);
    outline.setAttribute("height", dimensions.height);

    polygon.setAttribute(
        "points",
        getHexPolygonPoints(
            config.shape,
            dimensions.width,
            dimensions.height
        )
    );

    polygon.setAttribute("fill", "none");
    polygon.setAttribute("stroke", "#d1d5db");
    polygon.setAttribute("stroke-width", config.border_width);
}

/**
 * Renders a single hex cell.
 * Creates the hex element if it does not already exist,
 * then updates its position, dimensions, and shape.
 * @param {string} hex_key The string containing the x and y map coordinates of the cell.
 * @returns {void}
 */
function renderHex(hex_key) {
    const config = app.data.hex_configuration;
    const dimensions = getHexDimensions(config);
    const [x, y] = getHexXY(hex_key);
    let hex = document.getElementById(`hex-${hex_key.replace(",", "-")}`);

    if (!hex) {
        hex = document.createElement("div");
        hex.id = `hex-${hex_key.replace(",", "-")}`;
        hex.classList.add("hex");
        hex.dataset.hexKey = hex_key;
        hex.addEventListener("click", () => {
            if (!app.is_painting && app.current_tool !== tools.TERRAIN_PAINT && app.current_tool !== tools.FACTION_PAINT) {
                selectHex(hex_key);
            }
        });
        hex.addEventListener("mouseenter", () => { 
            renderHexHover(hex_key);
            if (app.is_painting && app.current_tool === tools.TERRAIN_PAINT) paintTerrain(hex_key);
            if (app.is_painting && app.current_tool === tools.FACTION_PAINT) paintFaction(hex_key);
        });
        hex.addEventListener("mouseleave", () => { renderHexHover(null); });
        hex.addEventListener("mousedown", () => {
            if (app.current_tool === tools.TERRAIN_PAINT) paintTerrain(hex_key);
            if (app.current_tool === tools.FACTION_PAINT) paintFaction(hex_key);
        });
        document.getElementById("hex-map-surface").appendChild(hex);
    }

    hex.style.left = `${x}px`;
    hex.style.top = `${y}px`;
    hex.style.width = `${dimensions.width}px`;
    hex.style.height = `${dimensions.height}px`;

    hex.classList.remove("hex-pointy-top", "hex-flat-top", "hex-square");
    hex.classList.add(`hex-${config.shape}`);
}

//========================================================================================================================================
//              Event Listeners
//========================================================================================================================================
document.addEventListener("keydown", event => {
    if (event.isComposing || isFormElementActive()) return;

    const command_key = event.ctrlKey || event.metaKey;
    if (command_key && event.key.toLowerCase() === "z") {
        const handled = event.shiftKey ? redo() : undo();
        if (handled) event.preventDefault();
        return;
    }
    if (command_key && event.key.toLowerCase() === "y") {
        if (redo()) event.preventDefault();
        return;
    }

    switch (event.key) {
        case "=":
            zoomMapIn();
            event.preventDefault();
            break;
        case "-":
            zoomMapOut();
            event.preventDefault();
            break;
        case "0":
            resetMapZoom();
            event.preventDefault();
            break;
        default:
            break;
    }
});

//========================================================================================================================================
//              Helper Functions
//========================================================================================================================================
/**
 * Calculates the dimensions of a hex cell based on its configuration.
 * @param {Object} config The configuration object for the hex cell.
 * @returns {Object} An object containing the width and height of the hex cell.
 */
function getHexDimensions(config) {
    const shape_key = config.shape.replace("-", "_");
    const default_dimensions = app.shape_sizes[shape_key];
    const width_percentage = Number(config.cell_width);
    const height_percentage = Number(config.cell_height);

    return {
        width: default_dimensions[0] * width_percentage / 100,
        height: default_dimensions[1] * height_percentage / 100
    };
}

/**
 * Calculates the points of the polygon for a hex cell based on its shape and dimensions.
 * @param {string} shape The shape of the hex cell.
 * @param {number} width The width of the hex cell.
 * @param {number} height The height of the hex cell.
 * @returns {string} A string containing the points for the hex cell's polygon.
 */
function getHexPolygonPoints(shape, width, height) {
    switch (shape) {
        case "pointy-top":
            return `
                ${width / 2},0
                ${width},${height * 0.25}
                ${width},${height * 0.75}
                ${width / 2},${height}
                0,${height * 0.75}
                0,${height * 0.25}
            `;

        case "flat-top":
            return `
                ${width * 0.25},0
                ${width * 0.75},0
                ${width},${height / 2}
                ${width * 0.75},${height}
                ${width * 0.25},${height}
                0,${height / 2}
            `;

        case "square":
            return `
                0,0
                ${width},0
                ${width},${height}
                0,${height}
            `;

        default:
            return "";
    }
}

/**
 * Calculates the top-left point of the bouning box of the hex.
 * @param {string} hex_key Thee string consaining the x and y map coordinates of the cell.
 * @returns {Array} An array containing the cell's x and y coordinate in pixels.
 */
function getHexXY(hex_key) {
    const [xString, yString] = hex_key.split(",").map(part => part.trim());
    const x = Number(xString);
    const y = Number(yString);
    const config = app.data.hex_configuration;
    const dimensions = getHexDimensions(config);

    switch (config.shape) {
        case "pointy-top": {
            const oddRowOffset = (y % 2 === 1) ? dimensions.width / 2 : 0;
            return [x * dimensions.width + oddRowOffset, y * (dimensions.height * 0.75)];
        }

        case "flat-top": {
            const oddColumnOffset = (x % 2 === 1) ? dimensions.height / 2 : 0;
            return [x * (dimensions.width * 0.75), y * dimensions.height + oddColumnOffset];
        }

        case "square":
            return [x * dimensions.width, y * dimensions.height];

        default:
            return [x, y];
    }
}