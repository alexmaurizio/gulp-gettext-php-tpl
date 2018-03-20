/**
 * Test GulpFile
 * @author Alessandro Maurizio <alessandro.maurizio@mondadori.it>
 */

// Module Loading
var gulp      = require('gulp');
var log       = require('fancy-log');
var del       = require('del');
var phpParser = require("../index.js");

// Paths Setup
var paths = {
	locale: {
		templates: 'templates/**/*.tpl',
		classes: 'classes/**/*.php',
		dest: 'locale',
		potName: '/portal.pot',
		poMoNames: {
			it: '/it_IT/portal',
			en: '/en_US/portal'
		}
	}
};

/**
 * Gulp Tasks
 * New tasks are defined as clean functions instead of old method
 */

// Cleanup Task
function clean() {
	return del([paths.locale.dest + paths.locale.potName]);
}

// Watch Task
function watch() {
	gulp.watch([paths.locale.classes, paths.locale.templates], parseTemplates);
}

// Parse .TPL and .PHP files
function parseTemplates() {
	// Load paths in array containing PHP and TPL Files via src
	return gulp.src([paths.locale.classes, paths.locale.templates])

			// Pipe all files in generator (concat)
			.pipe(phpParser.generatePOT(paths.locale.potName, {project: 'TestProject', company: 'BestCompany' }))

			// Save the POT to the destination
			.pipe(gulp.dest(paths.locale.dest))
			.on('end', function(){ log('[Locale] Recompiling .POT, .PO and .MO files from sources'); })

			// For each language, pick the original .PO file and update it against the POT
			// Also automatically regenerates .MO machine files
			.pipe(phpParser.mergeAndMake(paths.locale.dest + paths.locale.poMoNames.it))
			.pipe(phpParser.mergeAndMake(paths.locale.dest + paths.locale.poMoNames.en))

}

// Gulp 3 Style Declaration for tasks
gulp.task('clean', clean);
gulp.task('watch', watch);
gulp.task('parseTemplates', parseTemplates);

// Build & Default task
gulp.task('build', [ 'clean', 'parseTemplates']);
gulp.task('default', ['build']);