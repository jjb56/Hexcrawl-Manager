/*
    Icon Library for Tool SelectionIn this tool, the user pastees URLs or Unicode characters into the icon list in app.data.icon_list. 
    The tool then populates all dropdowns of class "icon-picker" with the icons in the list.
    This allows the user to select an icon for a landmark from a pre-defined list of icons.
*/

//========================================================================================================================================
//              Main Functions
//========================================================================================================================================

/**
 * Sets all dropdowns of class icon-picker to contain the icons in app.data.icon_list
 */
function populateIconPickers() {
	const icon_array = app.data.icon_list;
    let dropdown_html ="";
    const icon_pickers = document.getElementsByClassName("icon-picker");

    for (const icon of icon_array) {
        if (isImageURL(icon)) {
            // Clean up the text for native dropdowns (native options only display text)
            const filename = icon.split('/').pop().split('?')[0] || "Image Link";
            dropdown_html += `<option value="${icon}">[Image]${filename}</option>`;
            continue;
        }
        dropdown_html += `<option value="${icon}">${icon}</option>`;
    }
    for (const picker of icon_pickers) {
        picker.innerHTML = dropdown_html;
    }
}

//========================================================================================================================================
//              Render Functions
//========================================================================================================================================
