require('babel/polyfill');

var Cursor = require('../src/cursor');
var React = require('react/addons');
var jQuery = require('jquery');

Object.assign(global, {
  $: jQuery,
  jQuery,
  React
});

beforeEach(function() {
  $('body').find('#root').remove().end().append('<main id="root"/>');
  jasmine.clock().install();
});

afterEach(function() {
  jasmine.clock().uninstall();
});