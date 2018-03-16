// Module Loading
var each        = require('gulp-each');
var through     = require('through2');
var PluginError = require('plugin-error');
var path        = require('path');
var gtxParser   = require("gettext-parser");
var File        = require('vinyl');
var Concat      = require('concat-with-sourcemaps');
var utils       = require('./src/helpers.js');

// Consts
const PLUGIN_NAME = 'gulp-gettext-php-tpl';

// Iterates each file and passes over a list of IDs for the GetText methods
function parseAsStringList() {

	// Creating a stream through which each file will pass
	return each(function (content, file, callback) {

		// Get the extension - .TPL are Smarty Templates, .PHP are classes
		var ext = file.path.split('.').pop().toLowerCase();

		// Check that the file is .php or .tpl
		if (ext === "php" || ext === "tpl") {
			// All translatable strings holder
			var holder = "";

			// Switch PHP and TPL
			var regex = null;
			if (ext === "tpl") {
				// Regex for Smarty TPL Matching
				regex = new RegExp('(?:{t)(?:.*?})(.*?)(?={\\/t})', 'g');
			}
			else {
				// Regex for PHP Gettext Matching
				regex = new RegExp('(?:_\\(\')(.*?)(?:\'\\)(?:;|,))', 'g');
			}

			// Iterate the matches
			while ((match = regex.exec(content)) != null) {

				// Get the string and make some string fixes to match original style
				var string = match[1];
				string = utils.stripslashes(string);
				string = string.replace(/[\r\n]+/g, "");
				string = string.replace(/\\([\s\S])|(")/g, "\\$1$2");

				// Put into holder
				holder += string + "\n";
			}

			// Remove last \n
			holder = holder.substr(0, holder.length - 1);

			// Pass the holder back and move to next file
			callback(null, holder);
		}
		else {
			// File is not a .tpl or .php - Ignore!
			callback();
		}

	});

}

// Takes a (concatenated) list of ID Strings from the GetText Parser and pushes over a complete POT File
function stringListToPOT() {
	return through.obj(function (file, enc, cb) {

		// Translate in array and sort alphabetically
		var tradArray = file.contents.toString().split("\n").sort();

		// Remove duplicates and empty ones
		var uniques = {};
		uniques = tradArray.filter(function (item) {
			if (item === undefined) return false;
			if (item === '') return false;
			return uniques.hasOwnProperty(item) ? false : (uniques[item] = true);
		});

		// Build the POT File
		var pot = utils.generatePotHeader() + '\nmsgid "' +
				uniques.join('"\nmsgstr ""\n\nmsgid "')
				+ '"\nmsgstr ""\n';

		// Push the new file to the buffer, callback empty
		var f = path.parse(file.path);
		var newFile = file.clone();
		newFile.contents = new Buffer(pot);
		newFile.path = path.join(f.dir, f.name + f.ext);
		this.push(newFile);
		cb();

	})
}

// Takes a potFile from the stream in and creates a .po file
// Passes over the potFile to the stream
function msgmerge(targetFile) {

	if (!targetFile) {
		throw new PluginError(PLUGIN_NAME, 'Target file path is required');
	}

	return through.obj(function (file, enc, callback) {

		// Load the potFile from the stream
		var potFile = gtxParser.po.parse(file.contents.toString());

		// Makes PO and MO files from old PO and the new POT
		utils.makePoMo(targetFile, potFile);

		// Callback and passes over the original file
		callback(null, file);

	})
}

// Exporting the plugin main functions
module.exports = {
	parseAsStringList: parseAsStringList,
	stringListToPOT: stringListToPOT,
	msgmerge: msgmerge,
	generatePOT: generatePOT
}



// Test
function generatePOT(file) {
	if (!file) {
		throw new Error(PLUGIN_NAME+': Missing file option');
	}

	var latestFile;
	var latestMod;
	var fileName;
	var concat;

	if (typeof file === 'string') {
		fileName = file;
	} else if (typeof file.path === 'string') {
		fileName = path.basename(file.path);
	} else {
		throw new Error(PLUGIN_NAME+': Missing path in file options');
	}

	function bufferContents(file, enc, cb) {
		// ignore empty files
		if (file.isNull()) {
			cb();
			return;
		}

		// Remove streams
		if (file.isStream()) {
			this.emit('error', new Error(PLUGIN_NAME+': Streaming not supported'));
			cb();
			return;
		}

		// set latest file if not already set,
		// or if the current file was modified more recently.
		if (!latestMod || file.stat && file.stat.mtime > latestMod) {
			latestFile = file;
			latestMod = file.stat && file.stat.mtime;
		}

		// construct concat instance
		if (!concat) {
			concat = new Concat(false, fileName, '\n');
		}

		// Get the extension - .TPL are Smarty Templates, .PHP are classes
		var ext = file.path.split('.').pop().toLowerCase();

		// Check that the file is .php or .tpl
		if (ext === "php" || ext === "tpl") {
			// All translatable strings holder
			var holder = "";

			// Switch PHP and TPL
			var regex = null;
			if (ext === "tpl") {
				// Regex for Smarty TPL Matching
				regex = new RegExp('(?:{t)(?:.*?})(.*?)(?={\\/t})', 'g');
			}
			else {
				// Regex for PHP Gettext Matching
				regex = new RegExp('(?:_\\(\')(.*?)(?:\'\\)(?:;|,))', 'g');
			}

			// Iterate the matches
			while ((match = regex.exec(file.contents.toString())) != null) {

				// Get the string and make some string fixes to match original style
				var string = match[1];
				string = utils.stripslashes(string);
				string = string.replace(/[\r\n]+/g, "");
				string = string.replace(/\\([\s\S])|(")/g, "\\$1$2");

				// Put into holder
				holder += string + "\n";
			}

			// Remove last \n
			holder = holder.substr(0, holder.length - 1);

			// add file to concat instance
			concat.add(file.relative, new Buffer(holder), file.sourceMap);

			// Callback
			cb();

		}
		else {
			// File is not a .tpl or .php - Ignore!
			cb();
		}
	}

	function endStream(cb) {
		// no files passed in, no file goes out
		if (!latestFile || !concat) {
			cb();
			return;
		}

		var joinedFile;

		// if file opt was a file path
		// clone everything from the latest file
		if (typeof file === 'string') {
			joinedFile = latestFile.clone({contents: false});
			joinedFile.path = path.join(latestFile.base, file);
		} else {
			joinedFile = new File(file);
		}

		// Parse the content
		// Translate in array and sort alphabetically
		var tradArray = concat.content.toString().split("\n").sort();

		// Remove duplicates and empty ones
		var uniques = {};
		uniques = tradArray.filter(function (item) {
			if (item === undefined) return false;
			if (item === '') return false;
			return uniques.hasOwnProperty(item) ? false : (uniques[item] = true);
		});

		// Build the POT File
		var pot = utils.generatePotHeader() + '\nmsgid "' +
				uniques.join('"\nmsgstr ""\n\nmsgid "')
				+ '"\nmsgstr ""\n';

		// Push the joined file new content
		joinedFile.contents = new Buffer(pot);
		this.push(joinedFile);
		cb();
	}

	return through.obj(bufferContents, endStream);
};
