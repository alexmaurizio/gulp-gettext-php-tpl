// Module Loading
var path        = require('path');
var through     = require('through2');
var gtxParser   = require("gettext-parser");
var File        = require('vinyl');
var Concat      = require('concat-with-sourcemaps');
var PluginError = require('plugin-error');
var utils       = require('./src/helpers.js');

// Const
const PLUGIN_NAME = 'gulp-gettext-php-tpl';

// Main method to generate a POT file from a lot of files
// Uses modified concatenation logic from gulp-concat
function generatePOT(file) {
	if (!file) {
		throw new PluginError(PLUGIN_NAME, 'Missing file option');
	}

	// Concat declaration
	var latestFile;
	var latestMod;
	var fileName;
	var concat;

	// Switch filename
	if (typeof file === 'string') {
		fileName = file;
	} else if (typeof file.path === 'string') {
		fileName = path.basename(file.path);
	} else {
		throw new PluginError(PLUGIN_NAME, 'Missing path in file options');
	}

	// Buffering function
	function bufferContents(file, enc, cb) {
		// Ignore empty files
		if (file.isNull()) {
			cb();
			return;
		}

		// Remove streams
		if (file.isStream()) {
			this.emit('error', new PluginError(PLUGIN_NAME, 'Streaming not supported'));
			cb();
			return;
		}

		// Set latest file if not already set,
		// or if the current file was modified more recently.
		if (!latestMod || file.stat && file.stat.mtime > latestMod) {
			latestFile = file;
			latestMod = file.stat && file.stat.mtime;
		}

		// Construct concat instance
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

			// Make new buffer from holder content and send it to concat instance
			concat.add(file.relative, new Buffer(holder), file.sourceMap);

			// Callback
			cb();

		}
		else {
			// File is not a .tpl or .php - Ignore!
			cb();
		}
	}

	// Ending method, wrap the POT
	function endStream(cb) {
		// No files passed in, no file goes out
		if (!latestFile || !concat) {
			cb();
			return;
		}

		// Declare the final POT file
		var potFile;

		// If file opt was a file path
		// clone everything from the latest file
		if (typeof file === 'string') {
			potFile = latestFile.clone({contents: false});
			potFile.path = path.join(latestFile.base, file);
		} else {
			potFile = new File(file);
		}

		// Translate the concat in array and sort alphabetically
		var tradArray = concat.content.toString().split("\n").sort();

		// Remove duplicates and empty ones
		var uniques = {};
		uniques = tradArray.filter(function (item) {
			if (item === undefined) return false;
			if (item === '') return false;
			return uniques.hasOwnProperty(item) ? false : (uniques[item] = true);
		});

		// Build the POT File content
		var potContent = utils.generatePotHeader() + '\nmsgid "' +
				uniques.join('"\nmsgstr ""\n\nmsgid "')
				+ '"\nmsgstr ""\n';

		// Set the POT file new content and push it downstream
		potFile.contents = new Buffer(potContent);
		this.push(potFile);
		cb();
	}

	// Initialize the pipe
	return through.obj(bufferContents, endStream);
}

// Takes a potFile from the stream in and creates a .po file
// Passes over the potFile to the stream
function mergeAndMake(targetFile) {

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
	mergeAndMake: mergeAndMake,
	generatePOT: generatePOT
}
