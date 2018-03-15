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

// Consts
const PLUGIN_NAME = 'gulp-gettext-php-smarty-parser';

// Plugin level function
function gulpGettextPHPParser() {

  if (!prefixText) {
    throw new PluginError(PLUGIN_NAME, 'Missing prefix text!');
  }
  prefixText = new Buffer(prefixText); // allocate ahead of time

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
				string = stripslashes(string);
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

// Exporting the plugin main function
module.exports = gulpGettextPHPParser;



