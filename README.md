# H5P.ARScavenger
Let learners explore an augmented reality

## PLEASE NOTE
When writing these lines, this content type will not work out of the box,
because there are some small changes required to the core of H5P and those may
not have been released yet! You'll have to patch your host system before the
content type will work.

### Allow steps smaller than 1 in editor number fields
This one is crucial - or I'd have to (unneccessarily) rework the editor and make
it more clumsy. There’s a bug (or lack of feature) in the editor widget for
numbers. While HTML5 allows steps smaller than 1, the editor widget for numbers
in H5P doesn’t and won't validate entries with steps smaller than 1 (although
accepting decimal values in general).

The pull requests for this one are https://github.com/h5p/h5p-editor-php-library/pull/115
and https://github.com/h5p/h5p-php-library/pull/86. The changes will point
you to what you'd have to patch.

### Allow gltf and glb file extensions
H5P doesn’t allow to include files with the extension gltf or glb that are
required for the 3D models. In Drupal you can amend the list of allowed
extensions, but not in other plugins. So, here’s the pull request for
that: https://github.com/h5p/h5p-php-library/pull/85. The changes will point
you to what you'd have to patch if you're not running H5P on Drupal.

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
The changes will point you to what you'd have to patch.

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
