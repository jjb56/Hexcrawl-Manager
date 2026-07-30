/* ==================================================================================================================
   FACTION PROPERTIES
   ================================================================================================================== */
function renderFactionProperties() {
    const element = document.getElementById("properties-factions");
    const factions = Object.values(app.data.map.factions);
    element.innerHTML = `
        <h2>Factions</h2>
        <p>${factions.length} faction(s)</p>
    `;
}

