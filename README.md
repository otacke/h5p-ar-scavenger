# H5P.ARScavenger
Let learners explore an augmented reality

## PLEASE NOTE
When writing these lines, this content type will not work out of the box,
because there are some small changes required to the core of H5P and those may
not have been released yet! You'll have to patch your host system before the
content type will work fully. Please keep in mind that unless the H5P core team
includes those changes, whenever you update the H5P core (usually when updating
your plugin), then all changes will be overwritten. You will then have to add
them again.

### Allow gltf and glb file extensions
H5P currently doesn’t allow to include files with the extension gltf or glb that are
required for the 3D models, but the H5P core team will change this shortly. Until
then, without some modification, you will only be able to use AR Scavenger for
H5P content types.

On Drupal you can amend the list of allowed extensions in the H5P settings,
but not in other plugins. So, here’s the pull request for that:
https://github.com/h5p/h5p-php-library/pull/85. The changes will point you
to what you'd have to patch if you're not running H5P on Drupal.

If you want to do this manually:

1. _Know what you are doing._ You cannot really break anything here, but if
you're new to this and make a mistake, you might get some sweat ;-)
2. _Find h5p.classes.php._ On WordPress, it should be located at
`your-wordpress-path/wp-content/plugins/h5p/h5p-php-library/h5p.classes.php`.
On moodle it should be located at
`your-moodle-path/mod/hvp/library/h5p.classes.php`.
If you're using moodle 3.9 and above including moodle's H5P integration, it
should be located at `your-moodle-path/h5p/h5p/lib/joubel/core/h5p.classes.php`.
3. _Make the changes._ Add gltf and glb as shown at https://github.com/h5p/h5p-php-library/pull/85/files

### Support HTTP Feature Policies
Relevance of this patch may differ based on the server settings and the browser
used. Browsers are becoming more and more strict when accessing browser features such
as video or microphones and expect HTTP Feature Policies to be in place (also
potentially causing trouble for Audio Recorder). There's a discussion about this
topic related to H5P at https://h5p.org/comment/35346. I am proposing a code
change (for WordPress to be adapted to Drupal and moodle) that will allow to use
browsers' features within the H5P iframe (unless the server is even more strict
and doesn't allow them).

The suggestion can be found at https://github.com/h5p/h5p-wordpress-plugin/pull/114.
The changes will point you to what you'd have to patch on WordPress. There's no
suggestion yet for Drupal or moodle.

## Sponsor
_Die initiale Fassung dieses Vorhaben wurde gefördert durch die HOOU und die Behörde für Wissenschaft, Forschung und Gleichstellung der Freien und Hansestadt Hamburg._

_The initial release of this project was funded by the HOOU and the Ministry of Science, Research and Equality of the Free and Hanseatic City of Hamburg._

## Getting started
Clone this repository with git and check out the branch that you are interested
in (or choose the branch first and then download the archive, but learning
how to use git really makes sense).

Change to the repository directory and run
```bash
npm install
```

to install required modules. Afterwards, you can build the project using
```bash
npm run build
```

or, if you want to let everything be built continuously while you are making
changes to the code, run
```bash
npm run watch
```
Before putting the code in production, you should always run `npm run build`.

The build process will transpile ES6 to earlier versions in order to improve
compatibility to older browsers. If you want to use particular functions that
some browsers don't support, you'll have to add a polyfill.

The build process will also move the source files into one distribution file and
minify the code.

Lastly, you need to create the required H5P library. Get
[h5p-cli](https://github.com/h5p/h5p-cli) and run it according to the scheme
```
h5p pack [-r] <library> [<library2>...] [my.h5p]
```
