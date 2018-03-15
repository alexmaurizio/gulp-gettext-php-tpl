// Module Loading
var fs 			 	= require("fs");
var sass		 	= require('gulp-sass');
var concat		= require('gulp-concat');
var cleanCSS	= require('gulp-clean-css');
var through 	= require('through2');
var PluginError = require('plugin-error');
var del				= require('del');
var each		 	= require('gulp-each');
var path			= require('path');
var gtxParser = require("gettext-parser");
var utils     = require('src/helpers.js');

// Consts
const PLUGIN_NAME = 'gulp-gettext-php-tpl';

// Iterates each file and passes over a list of IDs for the GetText methods
function parseAsStringList() {

  // Creating a stream through which each file will pass
  return each(function (content, file, callback) {

		// Get the extension - .TPL are Smarty Templates, .PHP are classes
		var ext = file.path.split('.').pop().toLowerCase();

		// Check that the file is .php or .tpl
		if (ext === "php" || ext === "tpl")
		{
			// All translatable strings holder
			var holder = "";

			// Switch PHP and TPL
			var regex = null;
			if (ext === "tpl")
			{
				// Regex for Smarty TPL Matching
				regex = new RegExp('(?:{t)(?:.*?})(.*?)(?={\\/t})', 'g');
			}
			else
			{
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
				holder += string+"\n";
			}

			// Remove last \n
			holder = holder.substr(0, holder.length-1);

			// Pass the holder back and move to next file
			callback(null, holder);
		}
		else
		{
			// File is not a .tpl or .php - Ignore!
			callback();
		}

	});

}

// Takes a (concatenated) list of ID Strings from the GetText Parser and pushes over a complete POT File
function stringListToPOT()
{
	return through.obj(function (file, enc, cb) {

		// Translate in array and sort alphabetically
		var tradArray = file.contents.toString().split("\n").sort();

		// Remove duplicates and empty ones
		var uniques = {};
		uniques = tradArray.filter(function(item) {
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

// Exporting the plugin main functions
module.exports = {
	parseAsStringList: parseAsStringList,
	stringListToPOT: stringListToPOT,
}


