/* ==================================================================================================================
    APPLICATION STATES
   ================================================================================================================== */
const APP_STATES = Object.freeze({
    NONE: "NONE",
    HEX_INFO: "HEX_INFO",
    HEX_GRID: "HEX_GRID",
    FACTIONS: "FACTIONS",
    GEOGRAPHY: "GEOGRAPHY"
});

/* ==================================================================================================================
   APPLICATION
   ================================================================================================================== */
const app = {
    state: {
        currentState: APP_STATES.NONE,
        selectedHex: null,
        tool: null,
        selectedTerrain: null
    },
    data: {
        map: {
            grid: {
                type: "hex-vertical",
                width: 10,
                height: 10,
                backgroundImage: null,
                backgroundWidth: 100,
                backgroundHeight: 100,
                showTerrainIcons: true,
                showTerrainColors: true
            },
            geography: {
                plains: {
                    name: "Plains",
                    backgroundColor: "#5c6b3c",
                    icon: "🌾",
                    iconColor: "#ffffff",
                    rollTable: null
                },
                forest: {
                    name: "Forest",
                    backgroundColor: "#285943",
                    icon: "🌲",
                    iconColor: "#ffffff",
                    rollTable: null
                },
                mountain: {
                    name: "Mountain",
                    backgroundColor: "#555555",
                    icon: "▲",
                    iconColor: "#ffffff",
                    rollTable: null
                }
            },
            factions: {
                ironwood: {
                    name: "Ironwood Clan",
                    color: "#3b82f6",
                    icon: "◆"
                },
                redBanner: {
                    name: "Red Banner",
                    color: "#c0392b",
                    icon: "●"
                }
            },
            hexes: {
                "2,2": {
                    terrain: "forest",
                    faction: "ironwood"
                },
                "4,3": {
                    terrain: "mountain",
                    faction: "redBanner"
                },
                "6,6": {
                    terrain: "plains",
                    faction: null
                }
            }
        }
    }
};

/* ==================================================================================================================
   INITIALIZATION
   ================================================================================================================== */
function initialize() {
    console.log("Initializing Debreut's Hexcrawl Manager...");
    setupPropertiesEvents();
    setupMenus();
    render();
    showMessage("App Initialized");
}

function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = value ?? "";
    return element.innerHTML;
}

/* ==================================================================================================================
   MESSAGES
   ================================================================================================================== */
function showMessage(text, type = "success") {
    const messages = document.getElementById("messages");
    const message = document.createElement("div");
    message.classList.add("message", type);
    message.textContent = text;
    messages.appendChild(message);
    setTimeout(() => {
        message.classList.add("fade-out");
        setTimeout(() => {
            message.remove();
        }, 500);
    }, 3000);
}

/* ==================================================================================================================
   PROPERTIES WINDOW
   ================================================================================================================== */
function renderProperties() {
    const propertyStates = document.querySelectorAll(".property-state");
    propertyStates.forEach(stateElement => {
        stateElement.classList.remove("active");
    });
    const activeState = document.querySelector(`.property-state[data-state="${app.state.currentState}"]`);
    if (activeState) {
        activeState.classList.add("active");
    }
    // State-specific content
    renderNoneProperties();
    renderHexInfoProperties();
    renderHexGridProperties();
    renderFactionProperties();
    renderGeographyProperties();
}

/* ==================================================================================================================
   NONE PROPERTIES
   ================================================================================================================== */
function renderNoneProperties() {
    const element = document.getElementById("properties-none");
    element.innerHTML = `
        <h2>Nothing Selected</h2>
        <p><i>Select something on the map to view its properties.</i></p>
    `;
}

/* ==================================================================================================================
   MAP RENDERER
   ================================================================================================================== */
function renderMap() {
    const mapArea = document.getElementById("map-area");
    mapArea.onclick = (event) => {
        // Only clear selection if the user clicked the map itself rather than a hex.
        if (app.state.tool !== null) return;
        if (event.target === mapArea) {
            clearSelection();
        }
    };
    mapArea.innerHTML = "";
    const grid = app.data.map.grid;
    const width = grid.width;
    const height = grid.height;
    /*
        Temporary map sizing.

        We will replace this with the actual
        configurable grid geometry later.
    */
    const hexWidth = 70;
    const hexHeight = 80;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const hexId = `${x},${y}`;
            const hexData = app.data.map.hexes[hexId] || {
                terrain: null,
                faction: null
            };
            const terrain = app.data.map.geography[hexData.terrain];
            const faction = hexData.faction ? app.data.map.factions[hexData.faction] : null;
            const hex = document.createElement("div");
            hex.classList.add("hex");
            /*
                Temporary pointy-top hex positioning.
            */
            const xPosition = x * hexWidth * 0.75;
            const yPosition = y * hexHeight + (x % 2) * (hexHeight / 2);
            hex.style.left = `${xPosition}px`;
            hex.style.top = `${yPosition}px`;
            /*
                Terrain appearance
            */
            if (terrain && grid.showTerrainColors) {
                hex.style.backgroundColor = terrain.backgroundColor;
            }
            /*
                Selected state
            */
            if (app.state.selectedHex === hexId) {
                hex.classList.add("selected");
            }
            /*
                Faction indicator
            */
            if (faction) {
                const factionMarker = document.createElement("span");
                factionMarker.classList.add("faction-marker");
                factionMarker.textContent = faction.icon;
                factionMarker.style.color = faction.color;
                hex.appendChild(factionMarker);
            }
            /*
                Terrain icon
            */
            if (terrain && grid.showTerrainIcons) {
                const terrainIcon = document.createElement("span");
                terrainIcon.classList.add("terrain-icon");
                terrainIcon.textContent = terrain.icon;
                terrainIcon.style.color = terrain.iconColor;
                hex.appendChild(terrainIcon);
            }
            /*
                Coordinate label
                Temporary and useful for testing.
            */
            const coordinate = document.createElement("span");
            coordinate.classList.add("hex-coordinate");
            coordinate.textContent = hexId;
            hex.appendChild(coordinate);
            /*
                Selection
            */
            hex.addEventListener("click", (event) => {
                event.stopPropagation();
                if (app.state.tool !== null) return;
                selectHex(hexId);
            });
            mapArea.appendChild(hex);
        }
    }
}

/* ==================================================================================================================
   START
   ================================================================================================================== */
initialize();