// Module Imports
var fs        = require("fs");
var gtxParser = require("gettext-parser");

/**
 * Helper Functions Declaration
 */

// PHP StripSlash equivalent
function stripslashes(str) {
	return (str + '')
			.replace(/\\(.?)/g, function (s, n1) {
				switch (n1) {
					case '\\':
						return '\\'
					case '0':
						return '\u0000'
					case '':
						return ''
					default:
						return n1
				}
			})
}

// The .POT Header block
function generatePotHeader() {
	var d = new Date();
	var now = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + ' ' +
			+('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + "+0000";

	return '# POT Base Template for PROJECT Translation\n' +
			'# Copyright (C) 2018 COMPANY\n' +
			'# This file is distributed under the same license as the PACKAGE package.\n' +
			'# FIRST AUTHOR <EMAIL@ADDRESS>, YEAR.\n' +
			'#\n' +
			'#, fuzzy\n' +
			'msgid ""\n' +
			'msgstr ""\n' +
			'"Project-Id-Version: PACKAGE VERSION\\n"\n' +
			'"Report-Msgid-Bugs-To: \\n"\n' +
			'"POT-Creation-Date: ' + now + '\\n"\n' +
			'"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n"\n' +
			'"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"\n' +
			'"Language-Team: LANGUAGE <LL@li.org>\\n"\n' +
			'"Language: \\n"\n' +
			'"MIME-Version: 1.0\\n"\n' +
			'"Content-Type: text/plain; charset=UTF-8\\n"\n' +
			'"Content-Transfer-Encoding: 8bit\\n"\n';
}

// Merge and generate the PO and the MO to the specified directory
// Overrides the original file
function makePoMo(path, potFile) {
	// Load the PO translation file
	var poFile = fs.readFileSync(path + ".po", "UTF-8");
	poFile = gtxParser.po.parse(poFile);
	poFile = mergeGettextArrays(poFile, potFile);

	// Write the PO and the MO
	var output = gtxParser.po.compile(poFile, {foldLength: false});
	fs.writeFileSync(path + ".po", output);
	output = gtxParser.mo.compile(poFile);
	fs.writeFileSync(path + ".mo", output);
}

// Merge the POT translation array into the PO array
// Simulates "msgmerge" UNIX Gettext for translation arrays
function mergeGettextArrays(po, pot) {
	// Holder array for valid strings
	var filteredPo = {};

	// Iterate POT translations (only valid ones)
	Object.keys(pot.translations[""]).forEach(function (key) {
		// If translation is found..
		if (po.translations[""].hasOwnProperty(key)) {
			// Copy it back
			filteredPo[key] = po.translations[""][key];
		} else {
			// ..else, copy the pot (untranslated) version
			filteredPo[key] = pot.translations[""][key];
		}
	});
	// Replace the translations with the filtered ones and return
	po.translations[""] = filteredPo;
	return po;
}

// Export helper functions
module.exports = {
	stripslashes: stripslashes,
	generatePotHeader: generatePotHeader,
	makePoMo: makePoMo,
	mergeGettextArrays: mergeGettextArrays
};







