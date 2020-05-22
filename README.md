# H5P.ARScavener
Let learners find a clue on a website and answer related questions.

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
