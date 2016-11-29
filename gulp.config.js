'use strict';
// paths
var src = './src/',
    dist = './dist/',
    srcNodeModules = './node_modules/',
    //Project Name
    projectName = 'project';

// scripts to validate
var jsScriptsValidate = [
  src + 'scripts/**/*.js',
  '!' + src + 'scripts/libs/**/*.js'
];

// Scss files to validate
var stylesValidate = [
  src + 'scss/base/**/*.{scss, sass}',
  src + 'scss/components/**/*.{scss, sass}',
  src + 'scss/layout/**/*.{scss, sass}',
  src + 'scss/utilities/**/*.{scss, sass}',
  src + 'scss/variables/**/*.{scss, sass}',
  '!' + src + 'scss/base/_reset.scss',
  '!' + src + 'scss/abstractions/_icomoon.scss',
  '!' + src + 'scss/abstractions/**/*.{scss,sass}'
];

module.exports = {
  src: src,
  dist: dist,
  projectName: projectName,

  paths: {

    nodemodules: {
      source: srcNodeModules
    },

    scripts: {
      filename: projectName + '.scripts.js',
      destination: dist + 'scripts/',
      source: src + 'scripts/**/*.js',
      scriptsValidate: jsScriptsValidate
    },

    styles: {
      filename: projectName + '.styles.css',
      source: src + 'scss/',
      destination: dist + 'styles/',
      abstractions: src + 'scss/abstractions/',
      stylesValidate: stylesValidate
    },

    images: {
      source: src + 'images/',
      destination: dist + 'images/'
    },

    sprite: {
      source: src + 'images/sprite/',
      destination: dist + 'images/generated/'
    },

    fonts: {
      source: src + 'fonts/',
      destination: dist + 'fonts/'
    },

    reportFolder: './.qualityReports/',
  },

  /*Sprites Configuration*/
  spriteConfig: {
    imgName: 'sprite.png',
    retinaImgName: 'sprite@2x.png',
    cssName: '_sprite.scss',
  },

  /*Browser Sync configurations*/
  sync: {
    httpAddress: 'http://localhost:/',
    browserReloadDelay: 1000,
    defaultPort: 3000
  }
};
