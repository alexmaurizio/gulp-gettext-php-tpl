# gulp-gettext-php-tpl

A module that allows you to parse .PHP and .TPL [(Smarty)](https://github.com/smarty-php/smarty) files natively in Node / Gulp tasks.

Allows various .POT/.PO/.MO manipulations without the need of GNU Gettext on your system, making it cross-platform and independent from the original tools. 

Can also be used in watch tasks to automatically update the .POT translation template to match current gettext usage in .php and .tpl files

### Installation
This library is still in development to make it more robust and generic, so it's still not available on NPM.

To install it in your project anyway, run
```
npm install --save-dev alexmaurizio/gulp-gettext-php-tpl
```

### Usage
Here's an example task in your Gulpfile.js you can use.

As of now, you have to chain the methods and the concat to generate the .POT, then you need to pass the .POT down to the msgmerges. See next section for future improvals!

All the paths are customizable in the paths config object

```javascript
/**
 * Gulp PHP-TPL Gettext Example Gulpfile
 * @author Alessandro Maurizio <info@alexmaurizio.com>
 */
 
// Module Loading
var gulp      = require('gulp');
var del       = require('del');
var concat    = require('gulp-concat');
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
  del(['public/css/style.css']);
  return del([paths.locale.dest + paths.locale.potName]);
}
 
// Watch Task
function watch() {
  gulp.watch([paths.locale.classes, paths.locale.templates], parseTemplates);
  gulp.watch(paths.styles.src, styles);
}
 
// Parse .TPL and .PHP files Task
function parseTemplates() {
  // Load paths in array containing PHP and TPL Files via src
  return gulp.src([paths.locale.classes, paths.locale.templates])
  
      // Parse each file as a simple list of GetText strings
      .pipe(phpParser.parseAsStringList())
      
      // Concatenate all the files in a .POT
      .pipe(concat(paths.locale.potName))
      
      // Convert this list into a working POT
      .pipe(phpParser.stringListToPOT())
      
      // Save the POT to the destination
      .pipe(gulp.dest(paths.locale.dest))
      
      // For each language, pick the original .PO file and update it against the POT
      // Also automatically regenerates .MO machine files
      .pipe(phpParser.msgmerge(paths.locale.dest + paths.locale.poMoNames.it))
      .pipe(phpParser.msgmerge(paths.locale.dest + paths.locale.poMoNames.en));
}

 
// Gulp 3 Style Declaration for tasks
gulp.task('clean', clean);
gulp.task('watch', watch);
gulp.task('parseTemplates', parseTemplates);
 
// Build & Default task
gulp.task('build', [ 'clean', 'parseTemplates']);
gulp.task('default', ['build']); 
```

#### Support, Limitations and TODOs
Support is actually implemented only for very specific usage cases.

I'm working in making it more flexible and usable for generic use cases.

PRs are welcome!

##### Actual support:
- *Smarty*: `{t}**{/t}` and `{t params} ** {/t}` formats
- *PHP*: only `_('string')` is supported now

##### TODO:
- More robust extraction from templates
- Passing data down the stream in a more structured way (simple lines as of now)
- Keyword custom configuration
- Independent functions and not chained
- Multiline Gettext support
- Parametrized Gettext support