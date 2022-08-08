const gulp = require('gulp');
const path = require('path');
var fs = require('fs')
const del = require('del');
const ts = require('gulp-typescript');
const sm = require('gulp-sourcemaps');
const zip = require('gulp-zip');
const rename = require('gulp-rename');
const minify = require('gulp-minify');
const tabify = require('gulp-tabify');
const stringify = require('json-stringify-pretty-compact');

const GLOB = '**/*';
const DIST = 'dist/';
const BUNDLE = 'bundle/';
const SOURCE = 'src/';
const LANG = 'app/lang/';
const TEMPLATES = 'app/templates/';
const CSS = 'app/css/';
const PACKS = 'app/packs/';
const GRAPHICS = 'app/graphics/';

const METAFILES = ['LICENSE.txt', 'README.md', 'CHANGELOG.md'];

var PACKAGE = JSON.parse(fs.readFileSync('package.json'));
var DEV_ENV = JSON.parse(fs.readFileSync('devEnv.json'))

function reloadPackage(cb) { PACKAGE = JSON.parse(fs.readFileSync('package.json')); cb(); }
function DEV_DIST() { return path.join(DEV_ENV.devDir, PACKAGE.name) + '/'; }

String.prototype.replaceAll = function (pattern, replace) { return this.split(pattern).join(replace); }
function pdel(patterns, options) { return () => { return del(patterns, options); }; }
function plog(message) { return (cb) => { console.log(message); cb() }; }


/**
 * Compile the source code into the distribution directory
 * @param {Boolean} keepSources Include the TypeScript SourceMaps
 */
function buildSource(keepSources, minifySources = false, output = null) {
	return () => {
		var stream = gulp.src(SOURCE + GLOB);
		if (keepSources) stream = stream.pipe(sm.init())
		stream = stream.pipe(ts.createProject("tsconfig.json")())
		if (keepSources) stream = stream.pipe(sm.write())
		if (minifySources) stream = stream.pipe(minify({
			ext: { min: '.js' },
			mangle: false,
			noSource: true
		}));
		else stream = stream.pipe(tabify(4, false));
		return stream.pipe(gulp.dest((output || DIST) + SOURCE));
	}
}
exports.step_buildSourceDev = buildSource(true);
exports.step_buildSource = buildSource(false);
exports.step_buildSourceMin = buildSource(false, true);

/**
 * Builds the module manifest based on the package, sources, and css.
 */
function buildManifest(output = null) {
	const files = []; // Collector for all the file paths
	return (cb) => gulp.src(SOURCE + GLOB) // collect the source files
		.pipe(gulp.src(CSS + GLOB)) // grab all the CSS files
		.on('data', file => files.push(path.relative(file.cwd, file.path))) // Collect all the file paths
		.on('end', () => { // output the filepaths to the module.json
			if (files.length == 0)
				throw Error('No files found in ' + SOURCE + GLOB + " or " + CSS + GLOB);
			const js = files.filter(e => e.endsWith('js')); // split the CSS and JS files
			const css = files.filter(e => e.endsWith('css'));

			let sources = stringify(js, {indent: 0});
			sources = sources.substring(1, sources.length - 1);
			sources = sources.replaceAll(', ', ',\n\t\t').replaceAll('\\\\', '/');

			fs.readFile('module.json', (err, data) => {
				const module = data.toString() // Inject the data into the module.json
					.replaceAll('{{name}}', PACKAGE.name)
					.replaceAll('{{title}}', PACKAGE.title)
					.replaceAll('{{version}}', PACKAGE.version)
					.replaceAll('{{description}}', PACKAGE.description)
					.replace('"{{sources}}"', sources)
					.replace('"{{css}}"', stringify(css, null, '\t').replaceAll('\n', '\n\t'));
				fs.writeFile((output || DIST) + 'module.json', module, cb); // save the module to the distribution directory
			});
		});
}
exports.step_buildManifest = buildManifest();

function outputFolder(output = null, folder) { return () => gulp.src(folder + GLOB).pipe(gulp.dest((output || DIST) + folder)); }

function outputLanguages(output = null) { return outputFolder(output, LANG); }
function outputTemplates(output = null) { return outputFolder(output, TEMPLATES); }
function outputStylesCSS(output = null) { return outputFolder(output, CSS); }
function outputPacks(output = null) { return outputFolder(output, PACKS); }
function outputGraphics(output = null) { return outputFolder(output, GRAPHICS); }

function outputMetaFiles(output = null) { return () => gulp.src(METAFILES).pipe(gulp.dest((output || DIST))); }



/**
 * Copy files to module named directory and then compress that folder into a zip
 */
function compressDistribution() {
	return gulp.series(
		// Copy files to folder with module's name
		() => gulp.src(DIST + GLOB)
			.pipe(gulp.dest(DIST + `${PACKAGE.name}/${PACKAGE.name}`))
		// Compress the new folder into a ZIP and save it to the `bundle` folder
		, () => gulp.src(DIST + PACKAGE.name + '/' + GLOB)
			.pipe(zip(PACKAGE.name + '.zip'))
			.pipe(gulp.dest(BUNDLE))
		// Copy the module.json to the bundle directory
		, () => gulp.src(DIST + '/module.json')
			.pipe(gulp.dest(BUNDLE))
		// Cleanup by deleting the intermediate module named folder
		, pdel(DIST + PACKAGE.name)
	);
}
exports.step_compressDistribution = compressDistribution();

/**
 * Simple clean command
 */
exports.clean = pdel([DIST, BUNDLE]);
exports.devClean = pdel([DEV_DIST()]);
/**
 * Default Build operation
 */
exports.default = gulp.series(
	pdel([DIST])
	, gulp.parallel(
		buildSource(true, false)
		, buildManifest()
		, outputLanguages()
		, outputTemplates()
		, outputStylesCSS()
		, outputMetaFiles()
		, outputPacks()
		, outputGraphics()
	)
);
/**
 * Extends the default build task by copying the result to the Development Environment
 */
exports.dev = gulp.series(
	pdel([DEV_DIST() + GLOB], { force: true }),
	gulp.parallel(
		buildSource(true, false, DEV_DIST())
		, buildManifest(DEV_DIST())
		, outputLanguages(DEV_DIST())
		, outputTemplates(DEV_DIST())
		, outputStylesCSS(DEV_DIST())
		, outputMetaFiles(DEV_DIST())
		, outputPacks(DEV_DIST())
		, outputGraphics(DEV_DIST())
	)
);
/**
 * Performs a default build and then zips the result into a bundle
 */
exports.zip = gulp.series(
	pdel([DIST])
	, gulp.parallel(
		buildSource(false, false)
		, buildManifest()
		, outputLanguages()
		, outputTemplates()
		, outputStylesCSS()
		, outputMetaFiles()
		, outputPacks()
		, outputGraphics()
	)
	, compressDistribution()
	, pdel([DIST])
);

function watchFolder(folder) {
	gulp.watch(folder + GLOB, gulp.series(pdel(DIST + folder), outputFolder(folder)));
}

/**
 * Sets up a file watch on the project to detect any file changes and automatically rebuild those components.
 */
exports.watch = function () {
	exports.default();
	gulp.watch(SOURCE + GLOB, gulp.series(pdel(DIST + SOURCE), buildSource(true, false)));
	gulp.watch([CSS + GLOB, SOURCE + GLOB, 'module.json', 'package.json'], buildManifest());
	watchFolder(LANG);
	watchFolder(TEMPLATES);
	watchFolder(CSS);
	watchFolder(PACKS);
	watchFolder(GRAPHICS);
	gulp.watch(METAFILES, outputMetaFiles());
}

function devWatchFolder(folder) {
	gulp.watch(folder + GLOB, gulp.series(pdel(devDist + folder + GLOB, { force: true }), outputFolder(devDist), plog(folder + ' done.')));
}

/**
 * Sets up a file watch on the project to detect any file changes and automatically rebuild those components, and then copy them to the Development Environment.
 */
exports.devWatch = function () {
	const devDist = DEV_DIST();
	exports.dev();
	gulp.watch(SOURCE + GLOB, gulp.series(plog('deleting: ' + devDist + SOURCE + GLOB), pdel(devDist + SOURCE + GLOB, { force: true }), buildSource(true, false, devDist), plog('sources done.')));
	gulp.watch([CSS + GLOB, SOURCE + GLOB, 'module.json', 'package.json'], gulp.series(reloadPackage, buildManifest(devDist), plog('manifest done.')));
	devWatchFolder(LANG);
	devWatchFolder(TEMPLATES);
	devWatchFolder(CSS);
	devWatchFolder(PACKS);
	devWatchFolder(GRAPHICS);
	gulp.watch(METAFILES, gulp.series(outputMetaFiles(devDist), plog('metas done.')));
}
