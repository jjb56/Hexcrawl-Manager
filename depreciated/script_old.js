
// ========== VARIABLES ==========
const grid = document.getElementById("grid");
const STORAGE_KEY = "hexcrawl-manager-state";
const statusElement = document.getElementById("status");
let selectedHex = null;
const map = [];
const terrainInput = document.getElementById("terrain");
const ownerInput = document.getElementById("owner");
const cellX = document.getElementById("cell-x");
const cellY = document.getElementById("cell-y");
const cellInfoPanel = document.getElementById("cell-info-panel");
const campaignPanel = document.getElementById("campaign-panel");
const selectionState = document.getElementById("selection-state");
const selectionDetails = document.getElementById("selection-details");
const terrainListElement = document.getElementById("terrain-list");
const factionListElement = document.getElementById("faction-list");
const newTerrainInput = document.getElementById("new-terrain");
const newFactionInput = document.getElementById("new-faction");
const squareRatioInput = document.getElementById("square-ratio");
const gridModeInputs = document.querySelectorAll('input[name="grid-mode"]');
let currentCell = null;
let currentCellPosition = null;
let gridMode = "hex-horizontal";
let squareRatio = 1;
let terrainOptions = ["Forest", "Mountain", "River", "Desert", "Swamp"];
let factionOptions = ["None", "The Guild", "The Empire", "The Wilds"];

// ========== SETUP ==========
buildGrid(10, 10);
setupMenuButtons();
setupSidebarInputs();
setupCampaignControls();
document.addEventListener("keydown", handleGlobalKeydown);
restoreSavedState();
showNoSelection();
// Initialize sidebar state machine
const sidebarState = createSidebarStateMachine();
sidebarState.setState('cell');

// ========== EVENT FUNCTIONS ==========
function hexClicked(event) {
	const hex = event.target;
	const x = Number(hex.dataset.x);
	const y = Number(hex.dataset.y);
	const cell = map[y][x];
	currentCell = cell;
	currentCellPosition = { x, y };

	if (selectedHex) {
		selectedHex.classList.remove("selected");
	}
	selectedHex = hex;
	selectedHex.classList.add("selected");

	cellX.textContent = x;
	cellY.textContent = y;
	setSelectValue(terrainInput, cell.terrain);
	setSelectValue(ownerInput, cell.owner);
	showSelectionDetails();
}

function terrainChanged(event) {
	if (!currentCell) {
		return;
	}
	currentCell.terrain = event.target.value;
}

function ownerChanged(event) {
	if (!currentCell) {
		return;
	}
	currentCell.owner = event.target.value;
}

function handleGlobalKeydown(event) {
	if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
		event.preventDefault();
		saveState();
		return;
	}

	if (event.key === "Escape") {
		closeAllMenus();
	}
}

function setupMenuButtons() {
	const menuButtons = document.querySelectorAll(".menu-button");

	menuButtons.forEach((button) => {
		button.addEventListener("click", (event) => {
			event.stopPropagation();
			const menu = button.closest(".menu");
			const isOpen = menu.classList.contains("open");

			closeAllMenus();
			if (!isOpen) {
				menu.classList.add("open");
			}
		});
	});

	document.querySelectorAll(".menu-content a[data-action]").forEach((item) => {
		item.addEventListener("click", (event) => {
			event.preventDefault();
			const action = item.dataset.action;

			switch (action) {
				case "save":
					saveState();
					break;
				case "new":
					resetMap();
					break;
				case "open":
					restoreSavedState();
					break;
				case "undo":
					showStatus("Undo is not implemented yet.");
					break;
				case "redo":
					showStatus("Redo is not implemented yet.");
					break;
				case "zoom-in":
					showStatus("Zoom controls are not implemented yet.");
					break;
				case "zoom-out":
					showStatus("Zoom controls are not implemented yet.");
					break;
				case "campaign-grid":
					sidebarState.setState('grid-type');
					break;
				case "campaign-geography":
					sidebarState.setState('geography');
					break;
				case "campaign-factions":
					sidebarState.setState('factions');
					break;
				case "about":
					showStatus("Hexcrawl Manager by Debreut.");
					break;
				default:
					showStatus("That action is not available yet.");
			}

			closeAllMenus();
		});
	});

	document.addEventListener("click", closeAllMenus);
}

function setupSidebarInputs() {
	terrainInput.addEventListener("change", terrainChanged);
	ownerInput.addEventListener("change", ownerChanged);
	populateDropdowns();
}

function setupCampaignControls() {
	document.querySelectorAll(".campaign-tab").forEach((button) => {
		button.addEventListener("click", () => {
			const panel = button.dataset.panel;
			if (panel === 'grid') sidebarState.setState('grid-type');
			else if (panel === 'geography') sidebarState.setState('geography');
			else if (panel === 'factions') sidebarState.setState('factions');
		});
	});

	gridModeInputs.forEach((input) => {
		input.addEventListener("change", () => {
			gridMode = input.value;
		});
	});

	document.getElementById("apply-square-grid").addEventListener("click", () => {
		squareRatio = Number(squareRatioInput.value) || 1;
		redrawGrid();
		showStatus("Grid settings updated.");
	});

	document.getElementById("add-terrain").addEventListener("click", () => {
		const value = newTerrainInput.value.trim();
		if (!value) {
			showStatus("Enter a geography name first.");
			return;
		}
		if (!terrainOptions.includes(value)) {
			terrainOptions.push(value);
			populateDropdowns();
			renderCampaignEntries();
			newTerrainInput.value = "";
			showStatus(`Added terrain option: ${value}`);
		}
	});

	document.getElementById("add-faction").addEventListener("click", () => {
		const value = newFactionInput.value.trim();
		if (!value) {
			showStatus("Enter a faction name first.");
			return;
		}
		if (!factionOptions.includes(value)) {
			factionOptions.push(value);
			populateDropdowns();
			renderCampaignEntries();
			newFactionInput.value = "";
			showStatus(`Added faction option: ${value}`);
		}
	});

	renderCampaignEntries();
	updateCampaignControls();
}

function showCampaignPanel(panelName) {
	// Deprecated: replaced by sidebar state machine.
}

function showSidebarPanel(panelName) {
	// Deprecated: replaced by sidebar state machine.
}

function createSidebarStateMachine() {
	let state = 'cell';

	function render(s) {
		switch (s) {
			case 'cell':
				if (cellInfoPanel) cellInfoPanel.hidden = false;
				if (campaignPanel) campaignPanel.hidden = true;
				if (currentCell) showSelectionDetails(); else showNoSelection();
				document.querySelectorAll('.campaign-tab').forEach(t => t.classList.remove('active'));
				document.querySelectorAll('.campaign-section').forEach(sec => sec.classList.remove('active'));
				break;
			case 'grid-type':
				if (cellInfoPanel) cellInfoPanel.hidden = true;
				if (campaignPanel) campaignPanel.hidden = false;
				activateCampaignPanel('grid');
				break;
			case 'geography':
				if (cellInfoPanel) cellInfoPanel.hidden = true;
				if (campaignPanel) campaignPanel.hidden = false;
				activateCampaignPanel('geography');
				break;
			case 'factions':
				if (cellInfoPanel) cellInfoPanel.hidden = true;
				if (campaignPanel) campaignPanel.hidden = false;
				activateCampaignPanel('factions');
				break;
			default:
				console.warn('Unknown sidebar state', s);
		}
	}

	function activateCampaignPanel(name) {
		document.querySelectorAll('.campaign-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.panel === name));
		document.querySelectorAll('.campaign-section').forEach((section) => section.classList.toggle('active', section.id === `campaign-${name}`));
	}

	return {
		getState() { return state; },
		setState(s) {
			if (state === s) return;
			state = s;
			render(state);
			if (statusElement) statusElement.textContent = `Sidebar: ${state}`;
		}
	};
}

function closeAllMenus() {
	document.querySelectorAll(".menu").forEach((menu) => {
		menu.classList.remove("open");
	});
}

function saveState() {
	const state = {
		cells: map.map((row) => row.map((cell) => ({
			terrain: cell.terrain,
			owner: cell.owner
		}))),
		selectedCell: currentCellPosition,
		terrainOptions,
		factionOptions,
		gridMode,
		squareRatio
	};

	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	showStatus("Map saved to browser storage.");
}

function restoreSavedState() {
	const savedState = localStorage.getItem(STORAGE_KEY);
	if (!savedState) {
		showStatus("No saved map found.");
		return;
	}

	try {
		const parsed = JSON.parse(savedState);
		if (!Array.isArray(parsed.cells)) {
			showStatus("Saved map is invalid.");
			return;
		}

		parsed.cells.forEach((row, y) => {
			row.forEach((cell, x) => {
				if (map[y] && map[y][x]) {
					map[y][x].terrain = cell.terrain || "Forest";
					map[y][x].owner = cell.owner || "None";
				}
			});
		});

		if (Array.isArray(parsed.terrainOptions) && parsed.terrainOptions.length) {
			terrainOptions = parsed.terrainOptions;
		}
		if (Array.isArray(parsed.factionOptions) && parsed.factionOptions.length) {
			factionOptions = parsed.factionOptions;
		}
		if (parsed.gridMode) {
			gridMode = parsed.gridMode;
		}
		if (typeof parsed.squareRatio === "number") {
			squareRatio = parsed.squareRatio;
		}
		populateDropdowns();
		renderCampaignEntries();
		updateCampaignControls();
		applyGridMode();

		if (parsed.selectedCell) {
			const targetHex = Array.from(grid.querySelectorAll("polygon")).find((hex) => {
				return hex.dataset.x === String(parsed.selectedCell.x) && hex.dataset.y === String(parsed.selectedCell.y);
			});
			if (targetHex) {
				currentCellPosition = parsed.selectedCell;
				currentCell = map[parsed.selectedCell.y][parsed.selectedCell.x];
				if (selectedHex) {
					selectedHex.classList.remove("selected");
				}
				selectedHex = targetHex;
				selectedHex.classList.add("selected");
				cellX.textContent = parsed.selectedCell.x;
				cellY.textContent = parsed.selectedCell.y;
				setSelectValue(terrainInput, currentCell.terrain);
				setSelectValue(ownerInput, currentCell.owner);
			}
		}

		showStatus("Saved map restored.");
	} catch (error) {
		console.error("Unable to restore saved map.", error);
		showStatus("Unable to restore saved map.");
	}
}

function resetMap() {
	for (let y = 0; y < map.length; y += 1) {
		for (let x = 0; x < map[y].length; x += 1) {
			map[y][x].terrain = "Forest";
			map[y][x].owner = "None";
		}
	}

	currentCell = null;
	currentCellPosition = null;
	cellX.textContent = "-";
	cellY.textContent = "-";
	setSelectValue(terrainInput, "");
	setSelectValue(ownerInput, "");
	showNoSelection();
	if (selectedHex) {
		selectedHex.classList.remove("selected");
		selectedHex = null;
	}

	saveState();
}

function showStatus(message) {
	if (statusElement) {
		statusElement.textContent = message;
	}
}

// ========== HELPER FUNCTIONS ==========
function buildGrid(width, height) {
	const radius = 28;
	const horizontalSpacing = radius * 1.75;
	const verticalSpacing = radius * 1.5;
	const totalWidth = width * horizontalSpacing + radius * 2;
	const totalHeight = height * verticalSpacing + radius * 2;

	grid.setAttribute("viewBox", `0 0 ${totalWidth} ${totalHeight}`);
	grid.setAttribute("width", totalWidth);
	grid.setAttribute("height", totalHeight);

	for (let y = 0; y < height; y += 1) {
		map[y] = [];
		for (let x = 0; x < width; x += 1) {
			map[y][x] = {
				terrain: "Forest",
				owner: "None"
			};

			const hex = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
			hex.setAttribute("class", "hex");
			hex.dataset.x = x;
			hex.dataset.y = y;
			hex.onclick = hexClicked;
			grid.appendChild(hex);
		}
	}

	applyGridMode();
}

function applyGridMode() {
	const width = map[0]?.length || 10;
	const height = map.length || 10;
	const radius = 28;
	const horizontalSpacing = radius * 1.75;
	const verticalSpacing = radius * 1.5;
	const totalWidth = width * horizontalSpacing + radius * 2;
	const totalHeight = height * verticalSpacing + radius * 2;

	grid.setAttribute("viewBox", `0 0 ${totalWidth} ${totalHeight}`);
	grid.setAttribute("width", totalWidth);
	grid.setAttribute("height", totalHeight);

	let offsetX = 0;
	let offsetY = 0;
	let useHex = true;
	if (gridMode === "square") {
		useHex = false;
	}
	if (gridMode === "hex-vertical") {
		offsetX = horizontalSpacing / 2;
	}

	Array.from(grid.querySelectorAll("polygon")).forEach((hex) => {
		const x = Number(hex.dataset.x);
		const y = Number(hex.dataset.y);
		if (useHex) {
			const centerX = x * horizontalSpacing + (y % 2) * (horizontalSpacing / 2) + radius + (gridMode === "hex-vertical" ? horizontalSpacing / 2 : 0);
			const centerY = y * verticalSpacing + radius;
			const points = getHexPoints(centerX, centerY, radius);
			hex.setAttribute("points", points);
		} else {
			const cellWidth = radius * 1.6 * squareRatio;
			const cellHeight = radius * 1.6;
			const centerX = x * cellWidth + radius + offsetX;
			const centerY = y * cellHeight + radius + offsetY;
			const points = getSquarePoints(centerX, centerY, cellWidth / 2, cellHeight / 2);
			hex.setAttribute("points", points);
		}
	});
}

function redrawGrid() {
	const width = map[0]?.length || 10;
	const height = map.length || 10;
	while (grid.firstChild) {
		grid.removeChild(grid.firstChild);
	}
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const hex = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
			hex.setAttribute("class", "hex");
			hex.dataset.x = x;
			hex.dataset.y = y;
			hex.onclick = hexClicked;
			grid.appendChild(hex);
		}
	}
	applyGridMode();
}

function getHexPoints(centerX, centerY, radius) {
	const angles = [0, 60, 120, 180, 240, 300].map(angle => (angle - 30) * (Math.PI / 180));
	return angles.map(angle => {
		const x = centerX + radius * Math.cos(angle);
		const y = centerY + radius * Math.sin(angle);
		return `${x.toFixed(2)},${y.toFixed(2)}`;
	}).join(" ");
}

function getSquarePoints(centerX, centerY, halfWidth, halfHeight) {
	return [
		`${centerX - halfWidth},${centerY - halfHeight}`,
		`${centerX + halfWidth},${centerY - halfHeight}`,
		`${centerX + halfWidth},${centerY + halfHeight}`,
		`${centerX - halfWidth},${centerY + halfHeight}`
	].join(" ");
}

function populateDropdowns() {
	const terrainOptionsMarkup = terrainOptions.map((option) => `<option value="${option}">${option}</option>`).join("");
	const factionOptionsMarkup = factionOptions.map((option) => `<option value="${option}">${option}</option>`).join("");
	terrainInput.innerHTML = terrainOptionsMarkup;
	ownerInput.innerHTML = factionOptionsMarkup;
	if (currentCell) {
		setSelectValue(terrainInput, currentCell.terrain);
		setSelectValue(ownerInput, currentCell.owner);
	} else {
		setSelectValue(terrainInput, "");
		setSelectValue(ownerInput, "");
	}
}

function showNoSelection() {
	if (selectionState) {
		selectionState.hidden = false;
	}
	if (selectionDetails) {
		selectionDetails.hidden = true;
	}
}

function showSelectionDetails() {
	if (selectionState) {
		selectionState.hidden = true;
	}
	if (selectionDetails) {
		selectionDetails.hidden = false;
	}
}

function renderCampaignEntries() {
	if (terrainListElement) {
		terrainListElement.innerHTML = terrainOptions.map((option) => `<li>${option}</li>`).join("");
	}
	if (factionListElement) {
		factionListElement.innerHTML = factionOptions.map((option) => `<li>${option}</li>`).join("");
	}
}

function updateCampaignControls() {
	gridModeInputs.forEach((input) => {
		input.checked = input.value === gridMode;
	});
	squareRatioInput.value = squareRatio;
}

function setSelectValue(selectElement, value) {
	if (!selectElement) {
		return;
	}
	const normalizedValue = value || "";
	const exists = Array.from(selectElement.options).some((option) => option.value === normalizedValue);
	if (!exists && normalizedValue) {
		const option = new Option(normalizedValue, normalizedValue);
		selectElement.add(option);
	}
	selectElement.value = normalizedValue;
}


