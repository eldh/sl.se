function replaceExt(value, oldChar, newChar) {
    if (typeof (value) == "string") {
        value = value.replace(oldChar, newChar);
        if (value.indexOf(oldChar) > -1) {
            value = replaceExt(value, oldChar, newChar);
        }
    }

    return value;
};

//Ment to url safe words like S:t Eriksgatan/Fleminggatan (Stockholm)
//The char : cannot be in url, and / would refer to a subcategory..
function createUrlSafeWord(value) {
    if (typeof (value) == "string") {
        value = replaceExt(value, '\:', ';');
        value = replaceExt(value, '/', '_');
    }

    return value;
};

function revertUrlSafeWord(value) {
    if (typeof (value) == "string") {
        value = replaceExt(value, ';', '\:');
        value = replaceExt(value, '_', '/');
    }

    return value;
};