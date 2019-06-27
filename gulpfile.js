'use strict';

const gulp        = require('gulp');
const browserSync = require('browser-sync');
const sass        = require('gulp-sass');
const rename      = require('gulp-rename');
const gulpTheo    = require('gulp-theo');
const theo        = require("theo");
const camelCase = require("lodash/camelCase");
const path = require("path");
const tinycolor = require('tinycolor2');

const { getToken } = require('./figma_tokens/util');

const publicFolder = './public';


theo.registerFormat("ios.swift", result => {
  // "result" is an Immutable.Map
  // https://facebook.github.io/immutable-js/
  return `
import UIKit

struct Styles {${result
  .get("props")
  .map(
    prop => `
    static let ${camelCase(prop.get("name"))} = ${prop.get("value")}`)
  .toJS()
  .join('')}
}
  `;
});



theo.registerValueTransform(
  // Name to be used with registerTransform()
  "color/ios",
  // Determine if the value transform
  // should be run on the specified prop
  prop => prop.get("type") === "color",
  // Return the new value
  prop => {
    const {r, g, b, a} = tinycolor(prop.get("value")).toRgb();
    return `UIColor(red: ${r/255}, green: ${g/255}, blue: ${b/255}, alpha: ${a})`;
  }
);

theo.registerValueTransform(
  // Name to be used with registerTransform()
  "sizeValue/ios",
  // Determine if the value transform
  // should be run on the specified prop
  prop => {
    const type = prop.get("type");

    if (type === "size") return true;
  },
  // Return the new value
  prop => {
    const value = prop.get('value');

    if (value.includes('rem')) {
      return `CGFloat(${value.replace('rem', '')*16})`;
    } else {
      return `CGFloat(${prop.get('value').replace('px', '')})`;
    }
  }
);

theo.registerValueTransform(
  // Name to be used with registerTransform()
  "sizeValue/android",
  // Determine if the value transform
  // should be run on the specified prop
  prop => {
    const type = prop.get("type");

    if (type === "size") return true;
  },
  // Return the new value
  prop => {
    const value = prop.get('value');

    if (value.includes('rem')) {
      return `${value.replace('rem', '')*16}sp`;
    } else if (value.includes('px')) {
      return `${prop.get('value').replace('px', '')}dp`;
    } else {
      return `${prop.get('value')}`;
    }
  }
);

theo.registerValueTransform(
  // Name to be used with registerTransform()
  "string/string",
  // Determine if the value transform
  // should be run on the specified prop
  prop => {
    const type = prop.get("type");

    if (type === "string") return true;
  },
  // Return the new value
  prop => {
    return `"${prop.get('value')}"`;
  }
);

// Override the default "web" transform
theo.registerTransform("ios", ['color/ios', 'sizeValue/ios', 'percentage/float', 'string/string']);

theo.registerTransform("android", ['color/hex8argb', 'sizeValue/android', 'percentage/float', 'string/string']);


function scss() {
  return gulp
    .src(publicFolder + '/sass/import.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(rename('layout.css'))
    .pipe(gulp.dest(publicFolder + '/build'))
    .pipe(browserSync.stream());
}

function start() {
  browserSync.init({
    server: './public'
  });

  gulp.watch(publicFolder + '/sass/**/*.scss', scss);
}


function tokensScss() {
  return gulp
    .src('./figma_tokens/styles.json')
    .pipe(gulpTheo({
      transform: { type: 'web' },
      format: { type: 'scss' }
    }))
    .pipe(gulp.dest(publicFolder + '/sass/tokens'));
}

function tokensAndroid() {
  return gulp
    .src('./figma_tokens/styles.json')
    .pipe(gulpTheo({
      transform: { type: 'android' },
      format: { type: 'android.xml' }
    }))
    .pipe(gulp.dest('./droid/app/src/main/res/values'));
}



function tokensIosSwift() {
  return gulp
    .src('./figma_tokens/styles.json')
    .pipe(gulpTheo({
      transform: { type: 'ios' },
      format: { type: 'ios.swift' }
    }))
    .pipe(gulp.dest('./Esprit RFP/Esprit RFP/tokens'));
}

async function updateStyles() {
  await getToken();

  tokensScss();
  tokensAndroid();
  tokensIosSwift();
}

exports.default = start;
exports.updateStyles = updateStyles;
