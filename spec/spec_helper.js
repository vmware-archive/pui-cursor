require('babel/polyfill');

var React = require('react/addons');
var jQuery = require('jquery');
Object.assign(global, {
  jQuery,
  $: jQuery,
  React
});

beforeEach(function() {
  $('body').find('#root').remove().end().append('<main id="root"/>');
});
