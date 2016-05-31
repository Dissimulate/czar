'use strict'

const fs = require('fs')
const path = require('path')
const gulp = require('gulp')
const sass = require('gulp-sass')
const webpack = require('webpack')
const prefix = require('gulp-autoprefixer')
const webpackStream = require('webpack-stream')

const BUILD_DIR = path.resolve(__dirname, 'public')
const APP_DIR = path.resolve(__dirname, 'app')

const production = new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: JSON.stringify('production')
  }
})

let nodeModules = {}

fs.readdirSync('node_modules')
  .filter((x) => {
    return ['.bin'].indexOf(x) === -1
  })
  .forEach((mod) => {
    nodeModules[mod] = 'commonjs ' + mod
  })

gulp.task('styles', () => {
  gulp.src(APP_DIR + '/styles/cms.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(prefix('last 10 versions'))
    .pipe(gulp.dest(BUILD_DIR))
})

gulp.task('transpile', () => {
  gulp.src(APP_DIR + '/client/index.js')
    .pipe(webpackStream({
      output: {
        path: BUILD_DIR,
        filename: 'client.js'
      },
      module: {
        loaders: [{
          test: /\.jsx?/,
          include: APP_DIR,
          loader: 'babel',
          query: {
            presets: ['es2015', 'stage-0', 'react']
          }
        }]
      },
      plugins: [production]
    }))
    .pipe(gulp.dest(BUILD_DIR))

  gulp.src(APP_DIR + '/client/login.js')
    .pipe(webpackStream({
      output: {
        path: BUILD_DIR,
        filename: 'login.js'
      },
      module: {
        loaders: [{
          test: /\.jsx?/,
          include: APP_DIR,
          loader: 'babel',
          query: {
            presets: ['es2015', 'stage-0', 'react']
          }
        }]
      },
      plugins: [production]
    }))
    .pipe(gulp.dest(BUILD_DIR))
})

gulp.task('move', () => {
  gulp.src([APP_DIR + '/fonts/*']).pipe(gulp.dest(BUILD_DIR + '/fonts'))
})

gulp.task('build', ['styles', 'transpile', 'move'])

gulp.task('default', ['styles', 'transpile', 'move'], function () {
  gulp.watch(APP_DIR + '/styles/**/*.scss', ['styles'])
  gulp.watch(APP_DIR + '/**/*.js', ['transpile'])
})
