/*
    This file contains all related functionality for the hex configuration tool.
*/

//========================================================================================================================================
//              Main Functions
//========================================================================================================================================



//========================================================================================================================================
//              Render Functions
//========================================================================================================================================

function renderHexConfiguration() {
    const container = document.getElementById("hex-configuration-content");
    container.innerHTML = "";
    const config = app.data.hex_configuration;
    const html = `
        <div class="config-map-size">
            <h3>Map Size</h3>
            <div class="config-row"><label for="map-width">Cells Wide</label><input type="number" value="${config.map_width}" id="map-width" data-history-path="hex_configuration.map_width"></div>
            <div class="config-row"><label for="map-height">Cells High</label><input type="number" value="${config.map_height}" id="map-height" data-history-path="hex_configuration.map_height"></div>
        </div>
        <hr>
        <div id="config-hex-shape">
            <h3>Grid Cell Shape</h3>
            <div class="config-row"><label for="hex-type-pointy-top">Pointy-Top Hex</label><input type="radio" id="hex-type-pointy-top" name="grid-cell-shape" value="pointy-top" ${config.shape === "pointy-top" ? "checked" : ""} data-history-path="hex_configuration.shape"></div>
            <div class="config-row"><label for="hex-type-flat-top">Flat-Top Hex</label><input type="radio" id="hex-type-flat-top" name="grid-cell-shape" value="flat-top" ${config.shape === "flat-top" ? "checked" : ""} data-history-path="hex_configuration.shape"></div>
            <div class="config-row"><label for="hex-type-square">Square</label><input type="radio" id="hex-type-square" name="grid-cell-shape" value="square" ${config.shape === "square" ? "checked" : ""} data-history-path="hex_configuration.shape"></div>
        </div>
        <hr>
        <div id="config-grid-size">
            <h3>Grid Size</h3>
            <div class="config-row"><label for="grid-size-width">Cell Width</label><input type="number" value="${config.cell_width}" id="grid-size-width" data-history-path="hex_configuration.cell_width"></div>
            <div class="config-row"><label for="grid-size-height">Cell Height</label><input type="number" value="${config.cell_height}" id="grid-size-height" data-history-path="hex_configuration.cell_height"></div>
        </div>
        <hr>
        <div class="config-bg-image">
            <h3>Background Image</h3>
            <div class="config-row"><label for="bg-image-url">Image URL</label><input type="url" value="${config.bg_image || ""}" id="bg-image-url" placeholder="URL" data-history-path="hex_configuration.bg_image"></div>
            <div class="config-row"><span id="or-selection"><i>OR</i></span></div>
            <div class="config-row"><input type="file" id="bg-image-file" data-history-path="hex_configuration.bg_image"></div>
            <br>
            <div class="config-row"><label for="bg-xscale">Stretch Width</label><input type="number" class="percent-input" value="${config.bg_stretch_x}" id="bg-xscale" min="0" data-history-path="hex_configuration.bg_stretch_x"></div>
            <div class="config-row"><label for="bg-yscale">Stretch Height</label><input type="number" class="percent-input" value="${config.bg_stretch_y}" id="bg-yscale" min="0" data-history-path="hex_configuration.bg_stretch_y"></div>
            <div class="config-row"><label for="bg-xoffset">X Offset</label><input type="number" value="${config.bg_offset_x}" id="bg-xoffset" data-history-path="hex_configuration.bg_offset_x"></div>
            <div class="config-row"><label for="bg-yoffset">Y Offset</label><input type="number" value="${config.bg_offset_y}" id="bg-yoffset" data-history-path="hex_configuration.bg_offset_y"></div>
            <div class="config-row"><label for="bg-alpha">Image Alpha</label><input type="number" class="percent-input" value="${config.bg_alpha}" id="bg-alpha" min="0" data-history-path="hex_configuration.bg_alpha"></div>
        </div>
        <hr>
        <div id="config-show-features">
            <h3>Grid Display</h3>
            <div class="config-row"><label for="show-coordinates">Show Coordinates</label><input type="checkbox" id="show-coordinates" ${config.show_coordinates ? "checked" : ""} data-history-path="hex_configuration.show_coordinates"></div>
            <div class="config-row"><label for="show-empty-cell-background">Show Empty Cell Background</label><input type="checkbox" id="show-empty-cell-background" ${config.show_empty_cell_background !== false ? "checked" : ""} data-history-path="hex_configuration.show_empty_cell_background"></div>
            <div class="config-row"><label for="show-geography-background-colors">Show Geography Background Colors</label><input type="checkbox" id="show-geography-background-colors" ${config.show_geography_background_colors !== false ? "checked" : ""} data-history-path="hex_configuration.show_geography_background_colors"></div>
            <div class="config-row"><label for="show-icons">Icon Alpha</label><input type="number" class="percent-input" value="${config.icon_alpha}" id="show-icons" min="0" max="100" data-history-path="hex_configuration.icon_alpha"></div>
            <div class="config-row"><label for="border-size">Border Size</label><input type="number" value="${config.border_width}" id="border-size" min="0" data-history-path="hex_configuration.border_width"></div>
            <div class="config-row"><label for="faction-border-size">Faction Border Size</label><input type="number" value="${config.faction_border_width}" id="faction-border-size" min="0" data-history-path="hex_configuration.faction_border_width"></div>
            <div class="config-row"><label for="faction-border-alpha">Faction Border Alpha</label><input type="number" class="percent-input" value="${config.faction_border_alpha}" id="faction-border-alpha" min="0" max="100" data-history-path="hex_configuration.faction_border_alpha"></div>
        </div>
    `;
    container.innerHTML = html;
}

let bg_image_object_url = null;

function renderBackground() {
    const surface = document.getElementById("hex-map-surface");
    const config = app.data.hex_configuration;
    if (!surface) return;

    let background = surface.querySelector(".hex-map-background");
    if (!background) {
        background = document.createElement("div");
        background.className = "hex-map-background";
        surface.prepend(background);
    }

    const image_source = config.bg_image || bg_image_object_url;
    let image = background.querySelector("img");
    if (!image_source) {
        background.replaceChildren();
        background.style.width = "0px";
        background.style.height = "0px";
        return;
    }

    if (!image || image.dataset.source !== image_source) {
        background.replaceChildren();
        image = document.createElement("img");
        image.dataset.source = image_source;
        image.alt = "";
        image.draggable = false;
        image.addEventListener("load", () => renderBackground());
        background.appendChild(image);
        image.src = image_source;
    }

    const stretch_x = Math.max(0, Number(config.bg_stretch_x)) / 100;
    const stretch_y = Math.max(0, Number(config.bg_stretch_y)) / 100;
    background.style.width = `${Math.max(1, image.naturalWidth * stretch_x)}px`;
    background.style.height = `${Math.max(1, image.naturalHeight * stretch_y)}px`;
    background.style.left = `${Number(config.bg_offset_x) || 0}px`;
    background.style.top = `${Number(config.bg_offset_y) || 0}px`;
    background.style.opacity = Math.min(100, Math.max(0, Number(config.bg_alpha))) / 100;
}

document.addEventListener("change", event => {
    const element = event.target;
    if (element.id === "bg-image-file" && element.files?.[0]) {
        const old_object_url = bg_image_object_url;
        const file = element.files[0];
        const apply_object_url = object_url => {
            bg_image_object_url = object_url;
            renderBackground();
        };
        const do_action = () => apply_object_url(URL.createObjectURL(file));
        const undo_action = () => {
            if (bg_image_object_url) URL.revokeObjectURL(bg_image_object_url);
            apply_object_url(old_object_url);
        };

        do_action();
        commitToHistory("Changed background image file", undo_action, do_action);
    }

    if (element.id === "bg-image-url") {
        if (bg_image_object_url) {
            URL.revokeObjectURL(bg_image_object_url);
            bg_image_object_url = null;
        }
        renderBackground();
    }
});

renderBackground();