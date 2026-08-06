/*
    This file contains the framework for manipulating data within the app.
*/

let edit_timer = null;

//========================================================================================================================================
//              Main Functions
//========================================================================================================================================
function commitToHistory(action_name, undo_method, redo_method) {
    //Parameters: 
    //Functionality: Commits the action to the history stack
    //Example: commitToHistory("ACTION", remove hexes 3,2 and 3,4, add hexes 3,2 and 3,4);
    app.history.undo.push({
        name: action_name,
        undo: undo_method,
        redo: redo_method
    });
    console.log(action_name);
    //clear the redo stack
    app.history.redo = [];
}

function saveEditChanges(element_id) {
    //saves the changes taken in a form element
}

// ========== Roll tables ==========
function createRollTable(terrain_id) {
    //Creates a new blank roll table and appends it to the provided array.
    //set data
    const roll_table = {
        name: "New Roll Table",
        rows: [
            ["Roll", "Result"],
            ["", ""]
        ]
    };

    //create actions
    const do_action = () => app.data.geography[terrain_id].roll_tables.push(structuredClone(roll_table));
    const undo_action = () => app.data.geography[terrain_id].roll_tables.pop();

    //execute actions
    do_action();
    commitToHistory(`Added roll table to ${app.data.geography[terrain_id].name}`, undo_action, do_action);
    renderTerrainList();
}

function addRollTableRow(table) {
    //Parameters: table - A single roll table object.
    //Functionality: Adds a new blank row to the bottom of the table.
    //Example: addRollTableRow(app.data.terrain.roll_table_object[0]);

    table.rows.push(new Array(table.rows[0].length).fill(""));
}

function deleteRollTable(roll_table_object, table_index) {
    // Deletes the provided roll table from its roll_table_object object
    //set data
    const deleted_table = structuredClone(roll_table_object[table_index]);

    //create actions
    const do_action = () => roll_table_object.splice(table_index, 1);
    const undo_action = () => roll_table_object.splice(table_index, 0, deleted_table);

    //execute actions
    do_action();
    commitToHistory(`Deleted roll table ${deleted_table.name}`, undo_action, do_action);
}

function deleteRollTableRow(roll_table_object, table_index, row_index) {
    // Deletes a row. If only the header remains afterwards, deletes the entire roll table.
    //set data
    const table = roll_table_object[table_index];
    const deletedRow = structuredClone(table.rows[row_index]);

    // If deleting this row would leave only the header, delete the whole table instead.
    if (table.rows.length === 2) {
        deleteRollTable(roll_table_object, table_index);
        return;
    }

    //create actions
    const do_action = () => {
        table.rows.splice(row_index, 1);
    };
    const undo_action = () => {
        table.rows.splice(row_index, 0, deletedRow);
    };

    //execute actions
    do_action();
    commitToHistory(`Deleted row ${row_index} from ${table.name}`, undo_action, do_action);
}

function setRollTableCell(table, row, column, value) {
    //Functionality: Updates the contents of one cell.
    //todo: commit changes
    table.rows[row][column] = value;
}

function setRollTableName(table, value) {
    // Changes the table's display name.
    // TODO: commit changes
    table.name = value;
}


//========================================================================================================================================
//              HTML render Functions
//========================================================================================================================================
function renderRollTables(div_id, roll_table_holder, read_only = false) {
    // Renders every roll table into the supplied div.
    const container = document.getElementById(div_id);
    if (!container) return;

    container.innerHTML = "";

    const num_tables = roll_table_holder.length;
    let html = "";
    if (num_tables === 0) {
        html += `<p><i>No roll tables.</i></p>`;
    } else {
        for (let table = 0; table < num_tables; table++) {
            html += renderRollTableHTML(roll_table_holder, table, read_only);
        }
    }

    container.innerHTML = html;
}

/*
tables = [
    {
        name: "",
        rows: [
            ["", ""],
            ["", ""]
        ];
    }
];
*/

function renderRollTableHTML(roll_table_object, roll_table_index, read_only = false) {
    // Renders a roll table as an HTML string. FIXME: it hurts
    const table = roll_table_object[roll_table_index];
    const num_rows = table.rows.length;
    const read = (read_only ? "readonly" : "");

    let html = `<table class="terrain-roll-table">`;
    html += `<th colspan="${read_only ? 2 : 3}"><input type="text" value="${table.name}" oninput="setRollTableName(${table.name}, this.value)"></input></th>`
    for (let row = 0; row < num_rows; row++) {
        //FIXME: delete button does not work
        html += `<tr> 
            <td><input type="text" value="${table.rows[row][0]}" oninput="setRollTableCell(${table}, ${row}, 0, this.value)" ${read}></input></td>
            <td><input type="text" value="${table.rows[row][1]}" oninput="setRollTableCell(${table}, ${row}, 1, this.value)" ${read}></input></td>
            ${read_only ? "" : `<td><button class="bad-button" onclick="deleteRollTableRow(${roll_table_object}, ${roll_table_index}, ${row})"> - </button></td>`}
        </tr>`;
    }
    html += `</table>`;

    return html;
}

//========================================================================================================================================
//              Helper Functions
//========================================================================================================================================

///show message in the message bar