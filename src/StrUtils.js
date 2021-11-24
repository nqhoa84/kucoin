
/**
 * Return new String with: Remove all specials, keep a-zA-Z0-9 only.
 * @param {string} tokenAddr any string 
 */
module.exports.removeAllSpecial = function removeAllSpecial(tokenAddr) { 
	 
	if (tokenAddr) { 
		return tokenAddr.trim().replace(/[^a-zA-Z0-9]/g, ""); 
	} else {
		return '';
	}
}

/**
 * 
 * @param {string} tokenAddr 
 * @returns true: not empty, otherwise false 
 */
 module.exports.isNullUndefinedEmpty = function isNullUndefinedEmpty(tokenAddr) { 
	 return tokenAddr && tokenAddr.length > 0; 
}
