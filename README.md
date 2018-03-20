# gulp-gettext-php-tpl

A module that allows you to parse .PHP and .TPL [(Smarty)](https://github.com/smarty-php/smarty) files natively in Node / Gulp tasks.

Allows various .POT/.PO/.MO manipulations without the need of GNU Gettext on your system, making it cross-platform and independent from the original tools. 

Can also be used in watch tasks to automatically update the .POT translation template to match current gettext usage in .php and .tpl files

## Installation
This library is still in development to make it more robust and generic. Keep this in mind.

To install, run
```
npm install gulp-gettext-php-tpl --save-dev 
```
in your project directory. Make sure to have Gulp to use this plugin.

## Usage
Here's an example task in your Gulpfile.js you can use.

You can get your files with `gulp.src()`, even from multiple paths, then you can pipe them into the generatePOT() method, it will take care of generating a single, functional .POT files from all your classes and templates. 

Read the next section about limitations and usage detections.

All the paths are customizable in the paths config object

```javascript
/**
 * Gulp PHP-TPL Gettext Example Gulpfile
 * @author Alessandro Maurizio <info@alexmaurizio.com>
 */
 
// Module Loading
var gulp      = require('gulp');
var del       = require('del');
var phpParser = require("gulp-gettext-php-tpl");
 
// Paths Setup
var paths = {
  locale: {
    templates: 'templates/**/*.tpl',
    classes: 'classes/**/*.php',
    dest: 'locale',
    potName: '/translations.pot',
    poMoNames: {
      it: '/it_IT/translations',
      en: '/en_US/translations'
    }
  }
};
 
/**
 * Gulp Tasks
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
    .pipe(phpParser.generatePOT(paths.locale.potName))
    
    // Save the POT to the destination
    .pipe(gulp.dest(paths.locale.dest))
    
    // For each language, pick the original .PO file and update it against the POT
    // Also automatically regenerates .MO machine files
    .pipe(phpParser.mergeAndMake(paths.locale.dest + paths.locale.poMoNames.it))
    .pipe(phpParser.mergeAndMake(paths.locale.dest + paths.locale.poMoNames.en));
}

 
// Gulp 3 Style Declaration for tasks
gulp.task('clean', clean);
gulp.task('watch', watch);
gulp.task('parseTemplates', parseTemplates);
 
// Build & Default task
gulp.task('build', [ 'clean', 'parseTemplates']);
gulp.task('default', ['build']); 
```

## API

### `generatePOT(name [, options])`

Generates a working POT template file.

Concatenates all files piped in via `gulp.src()` (any number), parses the .PHP and .TPL files to find gettext usages, and finalizes the .POT. Use `gulp.dest()` to save the file, if needed. 

This .POT files must be streamed down to the mergeAndMake functions.

These are the optional opts you can pass to the method, that will customize the header of the .POT
```javascript
{
  'project' : 'Your Project Name',
  'company' : 'Your Company Name'
};
```

### `mergeAndMake(path)`

Takes a piped in .POT file (made by generatePOT) and updates the original .PO files

Still does not allow to create a brand new .PO file. Prepare one beforehand by renaming the .POT file.



### Support, Limitations and TODOs
Support is actually implemented only for very specific usage cases.

I'm working in making it more flexible and usable for generic use cases.

PRs are welcome!

#### Actual support:
- *Smarty*: `{t}**{/t}` and `{t params} ** {/t}` formats
- *PHP*: only `_('string')` is supported now

#### TODO:
- ~~Customizable header~~
- ~~Passing data down the stream in a more structured way~~
- ~~Add tests~~
- Allow creation of new .PO files if original ones are not present
- More robust extraction from templates
- Keyword custom configuration
- Independent functions and not chained
- Multiline Gettext support
- Parametrized Gettext support