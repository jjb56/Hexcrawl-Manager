/*
    This file contains code related to the hex drawing and selecting surface.
*/

//========================================================================================================================================
//              Main Functions
//========================================================================================================================================

//this file contains information related to the hex grid and its rendering.
//if a hex is clicked, we use open the hex edit tool. if an empty space is clicked (outside the map), we close all tools.
//the scroll wheel will be useed to scroll down in the map surface, or if shift is held, horizontally
//we will override browser ctrl+/- functionality to zoom in and out, as well as ctrl+scroll. with ctrl+scroll, we will scroll in on the hovered cell.
//the user cannot scroll too far outside the determined size of the hex grid
//each hex will display based on the selections in the hex configuration tool.
//the div holding the render area will act like a viewport to the map, never spilling out to other web elements

//========================================================================================================================================
//              Render Functions
//========================================================================================================================================
/* format of data in app.data.map = {
    "4,5": {
        geography_id: 0,
        description: "",
        factions: [ //optional, drawn as border around faction owned area, with thicker border for higher ratio of presence.
            {faction_id:1,presence:400},
            {faction_id:4, presence:300}
        ], 
        landmarks: ["", ""], //optional, not drawn on hex
        roll_tables: [4], //optional, but always displays the geography and faction-related tables below the hex tables
    }
} */

function renderHexes() {
    const config = app.data.hex_configuration;

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
}
renderHexes();

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
 * Selects a hex and opens the HEX editing tool.
 * @param {string} hex_key The string containing the x and y map coordinates of the cell.
 * @returns {void}
 */
function selectHex(hex_key) {
    if (app.current_tool === tools.TERRAIN_PAINT || app.is_painting) return;

    app.selected_hex = hex_key;
    renderHexSelection(hex_key);
    app.current_tool = "HEX_EDIT";
    activateTool("HEX_EDIT");
}

/**
 * Renders the selection border around a single hex.
 * @param {string|null} hex_key The selected hex, or null to remove the selection.
 * @returns {void}
 */
function renderHexSelection(hex_key) {
    // Remove previous selection state.
    document
        .querySelectorAll(".hex-selected")
        .forEach(hex => hex.classList.remove("hex-selected"));

    // Remove previous selection borders.
    document
        .querySelectorAll(".hex-selection-border")
        .forEach(border => border.remove());

    if (hex_key === null) {
        return;
    }

    const hex = document.querySelector(
        `[data-hex-key="${hex_key}"]`
    );

    if (!hex) {
        return;
    }

    // Raise the entire hex above its neighbors.
    hex.classList.add("hex-selected");

    const config = app.data.hex_configuration;

    const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );

    svg.classList.add("hex-selection-border");

    svg.setAttribute(
        "viewBox",
        `0 0 ${config.cell_width} ${config.cell_height}`
    );

    svg.setAttribute("width", config.cell_width);
    svg.setAttribute("height", config.cell_height);

    let points;

    switch (config.shape) {

        case "pointy-top":
            points = [
                [config.cell_width / 2, 0],
                [config.cell_width, config.cell_height * 0.25],
                [config.cell_width, config.cell_height * 0.75],
                [config.cell_width / 2, config.cell_height],
                [0, config.cell_height * 0.75],
                [0, config.cell_height * 0.25]
            ];
            break;

        case "flat-top":
            points = [
                [config.cell_width * 0.25, 0],
                [config.cell_width * 0.75, 0],
                [config.cell_width, config.cell_height / 2],
                [config.cell_width * 0.75, config.cell_height],
                [config.cell_width * 0.25, config.cell_height],
                [0, config.cell_height / 2]
            ];
            break;

        case "square":
            points = [
                [0, 0],
                [config.cell_width, 0],
                [config.cell_width, config.cell_height],
                [0, config.cell_height]
            ];
            break;

        default:
            return;
    }

    const polygon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "polygon"
    );

    polygon.setAttribute(
        "points",
        points.map(point => `${point[0]},${point[1]}`).join(" ")
    );

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

    if (!hex_data || hex_data.geography_id === undefined) {
        hex.style.backgroundColor = "";
        return;
    }

    const geography = app.data.geography[hex_data.geography_id];

    if (!geography) {
        hex.style.backgroundColor = "";
        return;
    }
    hex.style.backgroundColor = geography.background_color;
}

/**
 * Renders the geography icon of a single hex cell.
 * @param {string} hex_key The string containing the x and y map coordinates of the cell.
 * @returns {void}
 */
function renderHexIcon(hex_key) {
    const hex = document.querySelector(`[data-hex-key="${hex_key}"]`);
    const hex_data = app.data.map[hex_key];
    let icon = hex.querySelector(".hex-icon");

    if (!hex_data || hex_data.geography_id === undefined) {
        if (icon) icon.remove();
        return;
    }

    const geography = app.data.geography[hex_data.geography_id];

    if (!geography || !geography.icon) {
        if (icon) icon.remove();
        return;
    }

    if (!icon) {
        icon = document.createElement("span");
        icon.classList.add("hex-icon");
        hex.appendChild(icon);
    }

    icon.textContent = geography.icon;
    icon.style.color = geography.icon_color;
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
 * Factions are drawn from highest presence to lowest presence.
 * Each faction receives a border width proportional to its presence.
 * An edge is omitted when the neighboring cell contains that faction.
 *
 * The faction border is clipped to the actual shape of the cell so
 * the stroke cannot visually extend outside the cell.
 *
 * @param {string} hex_key The string containing the x and y map coordinates of the cell.
 * @returns {void}
 */
function renderFactionBorders(hex_key) {
    const hex = document.querySelector(`[data-hex-key="${hex_key}"]`);
    const hex_data = app.data.map[hex_key];
    const config = app.data.hex_configuration;

    if (!hex) return;

    let border_surface = hex.querySelector(".hex-faction-borders");

    // ============================================================
    // NO FACTION DATA
    // ============================================================

    if (
        !hex_data ||
        !hex_data.factions ||
        hex_data.factions.length === 0 ||
        config.faction_border_width <= 0
    ) {
        if (border_surface) {
            border_surface.remove();
        }

        return;
    }

    // ============================================================
    // CREATE SVG
    // ============================================================

    if (!border_surface) {
        border_surface = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );

        border_surface.classList.add("hex-faction-borders");

        hex.appendChild(border_surface);
    }

    border_surface.setAttribute(
        "viewBox",
        `0 0 ${config.cell_width} ${config.cell_height}`
    );

    border_surface.setAttribute("width", config.cell_width);
    border_surface.setAttribute("height", config.cell_height);

    // Remove anything rendered during the previous pass.
    border_surface.replaceChildren();

    // ============================================================
    // SORT FACTIONS
    // ============================================================

    // Copy the array so rendering never modifies the map data.
    const factions = [...hex_data.factions];

    // Strongest faction is drawn first.
    factions.sort((a, b) => b.presence - a.presence);

    const strongest_presence = factions[0].presence;

    if (strongest_presence <= 0) {
        return;
    }

    // ============================================================
    // HEX GEOMETRY
    // ============================================================

    const [x, y] = hex_key.split(",").map(Number);

    let neighbors = [];
    let edges = [];
    let clip_points = [];

    // ------------------------------------------------------------
    // POINTY-TOP
    // ------------------------------------------------------------

    if (config.shape === "pointy-top") {

        /*
            Physical edges:

                   0
                 /───\
              5 /     \ 1
               |       |
              4 \     / 2
                 \───/
                   3
        */

        const points = [
            [config.cell_width / 2, 0],                      // 0
            [config.cell_width, config.cell_height * 0.25], // 1
            [config.cell_width, config.cell_height * 0.75], // 2
            [config.cell_width / 2, config.cell_height],    // 3
            [0, config.cell_height * 0.75],                 // 4
            [0, config.cell_height * 0.25]                   // 5
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

        /*
            Your getHexXY() uses odd rows shifted right.

            Even row:
                  NW = x-1,y-1
                  NE = x,y-1

            Odd row:
                  NW = x,y-1
                  NE = x+1,y-1
        */

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
    }

    // ------------------------------------------------------------
    // FLAT-TOP
    // ------------------------------------------------------------

    else if (config.shape === "flat-top") {

        /*
                   0 ───── 1
                  /         \
                5             2
                  \         /
                   4 ───── 3
        */

        const points = [
            [config.cell_width * 0.25, 0],                    // 0
            [config.cell_width * 0.75, 0],                    // 1
            [config.cell_width, config.cell_height / 2],      // 2
            [config.cell_width * 0.75, config.cell_height],   // 3
            [config.cell_width * 0.25, config.cell_height],   // 4
            [0, config.cell_height / 2]                       // 5
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

        /*
            Your getHexXY() uses odd columns shifted DOWN.

            Even column:
                  upper-right = x+1,y-1
                  lower-right = x+1,y

            Odd column:
                  upper-right = x+1,y
                  lower-right = x+1,y+1
        */

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
    }

    // ------------------------------------------------------------
    // SQUARE
    // ------------------------------------------------------------

    else if (config.shape === "square") {

        /*
              0
           ───────
         3 │     │ 1
           ───────
              2
        */

        const points = [
            [0, 0],
            [config.cell_width, 0],
            [config.cell_width, config.cell_height],
            [0, config.cell_height]
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
    }

    // Unknown shape.
    else {
        return;
    }

    // ============================================================
    // CREATE CLIPPING PATH
    // ============================================================

    /*
        SVG strokes are centered on their path.

        For example, a 5px line drawn directly on an edge extends
        2.5px outside that edge.

        The clip path prevents that outside half from appearing.
    */

    const clip_id = `faction-clip-${hex_key.replace(",", "-")}`;

    const defs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs"
    );

    const clip_path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "clipPath"
    );

    clip_path.setAttribute("id", clip_id);
    clip_path.setAttribute("clipPathUnits", "userSpaceOnUse");

    const clip_polygon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "polygon"
    );

    clip_polygon.setAttribute(
        "points",
        clip_points.map(point => `${point[0]},${point[1]}`).join(" ")
    );

    clip_path.appendChild(clip_polygon);
    defs.appendChild(clip_path);
    border_surface.appendChild(defs);

    // Everything drawn in this SVG is clipped to the cell.
    border_surface.setAttribute(
        "clip-path",
        `url(#${clip_id})`
    );

    // ============================================================
    // DRAW FACTION BORDERS
    // ============================================================

    for (const faction of factions) {

        const faction_info =
            app.data.factions[faction.faction_id];

        if (!faction_info) continue;
        if (faction.presence <= 0) continue;

        // Strongest faction gets the full configured width.
        const width_ratio =
            faction.presence / strongest_presence;

        const border_width =
            config.faction_border_width * width_ratio;

        // --------------------------------------------------------
        // Check every possible edge.
        // --------------------------------------------------------

        for (
            let edge_index = 0;
            edge_index < edges.length;
            edge_index++
        ) {

            const neighbor_data =
                app.data.map[neighbors[edge_index]];

            const faction_present =
                neighbor_data?.factions?.some(
                    neighbor_faction =>
                        neighbor_faction.faction_id ===
                        faction.faction_id
                ) ?? false;

            // Same faction exists on the other side.
            // Therefore this is an internal edge.
            if (faction_present) {
                continue;
            }

            const line =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "line"
                );

            const [start, end] =
                edges[edge_index];

            // Extend the line by 20% of its length past both endpoints.
            // The clipping path keeps the extension inside the hex shape.
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

            line.setAttribute(
                "stroke",
                faction_info.color
            );

            line.setAttribute(
                "stroke-width",
                border_width
            );

            line.setAttribute(
                "stroke-opacity",
                config.faction_border_alpha
            );

            /*
                Butt caps prevent the line from extending past
                either endpoint.

                The clipping path additionally prevents the
                stroke from appearing outside the cell.
            */
            line.setAttribute(
                "stroke-linecap",
                "butt"
            );

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
    outline.setAttribute("viewBox", `0 0 ${config.cell_width} ${config.cell_height}`);
    outline.setAttribute("width", config.cell_width);
    outline.setAttribute("height", config.cell_height);

    polygon.setAttribute(
        "points",
        getHexPolygonPoints(
            config.shape,
            config.cell_width,
            config.cell_height
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
    const [x, y] = getHexXY(hex_key);
    let hex = document.getElementById(`hex-${hex_key.replace(",", "-")}`);

    if (!hex) {
        hex = document.createElement("div");
        hex.id = `hex-${hex_key.replace(",", "-")}`;
        hex.classList.add("hex");
        hex.dataset.hexKey = hex_key;
        hex.addEventListener("click", () => { if (!app.is_painting) selectHex(hex_key); });
        hex.addEventListener("mouseenter", () => { 
            renderHexHover(hex_key);
            if (app.is_painting) paintTerrain(hex_key);
        });
        hex.addEventListener("mouseleave", () => { renderHexHover(null); });
        hex.addEventListener("mousedown", () => { if (app.current_tool === tools.TERRAIN_PAINT) paintTerrain(hex_key); });
        document.getElementById("hex-map-surface").appendChild(hex);
    }

    hex.style.left = `${x}px`;
    hex.style.top = `${y}px`;
    hex.style.width = `${config.cell_width}px`;
    hex.style.height = `${config.cell_height}px`;

    hex.classList.remove("hex-pointy-top", "hex-flat-top", "hex-square");
    hex.classList.add(`hex-${config.shape}`);
}

//========================================================================================================================================
//              Helper Functions
//========================================================================================================================================

/**
 * 
 * @param {*} hex_key 
 * @returns {Array} an array or arrays of x, y coordinates
 */
function getHexVertices(hex_key) {

}

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

    switch (config.shape) {
        case "pointy-top": {
            const oddRowOffset = (y % 2 === 1) ? config.cell_width / 2 : 0;
            return [x * config.cell_width + oddRowOffset, y * (config.cell_height * 0.75)];
        }

        case "flat-top": {
            const oddColumnOffset = (x % 2 === 1) ? config.cell_height / 2 : 0;
            return [x * (config.cell_width * 0.75), y * config.cell_height + oddColumnOffset];
        }

        case "square":
            return [x * config.cell_width, y * config.cell_height];

        default:
            return [x, y];
    }
}