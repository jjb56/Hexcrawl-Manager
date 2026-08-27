/*
    This file contains all related functionality for the faction paint tool.
*/

document.addEventListener("mouseup", () => { endFactionPaint(); });

function paintFaction(hex_key) {
    if (app.current_tool !== tools.FACTION_PAINT) return;
    if (!app.is_painting) {
        app.is_painting = true;
        app.faction_painting_affected = [];
    }
    if (app.faction_painting_affected.some(hex => hex.hex_id === hex_key)) return;

    const amount = Number(app.faction_paint_amount);
    if (app.faction_painting !== null && (!Number.isFinite(amount) || amount <= 0)) return;

    const previous_map_data = app.data.map[hex_key] === undefined
        ? undefined
        : structuredClone(app.data.map[hex_key]);
    const hex = app.data.map[hex_key];

    if (app.faction_painting === null) {
        if (!hex?.factions?.length) return;
        delete hex.factions;
    } else {
        const target_hex = hex ?? { geography_id: null, description: "" };
        if (!hex) app.data.map[hex_key] = target_hex;
        target_hex.factions ??= [];
        const faction = target_hex.factions.find(item => item.faction_id === app.faction_painting);
        if (faction) faction.presence += amount;
        else target_hex.factions.push({ faction_id: app.faction_painting, presence: amount });
    }

    app.faction_painting_affected.push({
        hex_id: hex_key,
        previous_map_data,
        painted_map_data: structuredClone(app.data.map[hex_key])
    });
    renderHex(hex_key);
    refreshFactionBorderNeighbors(hex_key);
}

function endFactionPaint() {
    if (!app.is_painting || app.current_tool !== tools.FACTION_PAINT) return;
    app.is_painting = false;
    const affected_hexes = app.faction_painting_affected;
    if (affected_hexes.length === 0) return;

    const faction_name = app.data.factions[app.faction_painting]?.name || "faction";
    const amount = app.faction_paint_amount;
    const description = app.faction_painting === null
        ? `Erased factions from ${affected_hexes.length} cell${affected_hexes.length > 1 ? "s" : ""}`
        : `Added ${amount} ${faction_name} presence to ${affected_hexes.length} cell${affected_hexes.length > 1 ? "s" : ""}`;
    const restore = (hex_data) => {
        if (hex_data.previous_map_data === undefined) {
            delete app.data.map[hex_data.hex_id];
        } else {
            app.data.map[hex_data.hex_id] = structuredClone(hex_data.previous_map_data);
        }
        renderHex(hex_data.hex_id);
        refreshFactionBorderNeighbors(hex_data.hex_id);
    };
    const apply = () => {
        for (const hex_data of affected_hexes) {
            app.data.map[hex_data.hex_id] = structuredClone(hex_data.painted_map_data);
            renderHex(hex_data.hex_id);
            refreshFactionBorderNeighbors(hex_data.hex_id);
        }
    };

    commitToHistory(description,
        () => affected_hexes.forEach(restore), apply);
    app.faction_painting_affected = [];
}

function darkenFactionColor(color) {
    const value = color.replace("#", "");
    const channels = value.length === 3
        ? value.split("").map(channel => parseInt(channel + channel, 16))
        : [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16));
    return `rgb(${channels.map(channel => Math.max(0, Math.round(channel * 0.7))).join(", ")})`;
}

function renderFactionPaintList() {
    const amount_input = document.getElementById("faction-paint-amount");
    amount_input.value = app.faction_paint_amount;
    amount_input.onchange = () => {
        app.faction_paint_amount = Math.max(0, Number(amount_input.value) || 0);
        amount_input.value = app.faction_paint_amount;
    };

    const paint_div = document.getElementById("faction-paint-list");
    paint_div.replaceChildren();
    const factions = Object.entries(app.data.factions || {});
    if (factions.length === 0) {
        paint_div.innerHTML = "<p><i>No factions exist to paint. Create one using the Factions tool.</i></p>";
        return;
    }

    for (const [key, faction] of factions) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "faction-paint-button";
        button.style.backgroundColor = darkenFactionColor(faction.color);
        button.title = faction.name;
        const flag = document.createElement("span");
        flag.className = "hex-faction-flag";
        flag.textContent = faction.icon;
        flag.style.backgroundColor = faction.color;
        button.appendChild(flag);
        button.appendChild(document.createTextNode(faction.name));
        if (app.faction_painting === Number(key)) button.classList.add("selected");
        button.onclick = () => {
            app.faction_painting = app.faction_painting === Number(key) ? null : Number(key);
            paint_div.querySelectorAll(".selected").forEach(item => item.classList.remove("selected"));
            if (app.faction_painting !== null) button.classList.add("selected");
        };
        paint_div.appendChild(button);
    }
}