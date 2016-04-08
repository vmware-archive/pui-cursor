require('babel-polyfill');
require('./support/bluebird');

const React = require('react');
const jQuery = require('jquery');
const MockPromises = require('mock-promises');

const globals = {$: jQuery, jQuery, MockPromises , React};

Object.assign(global, globals);

beforeEach(() => {
  $('body').find('#root').remove().end().append('<main id="root"/>');
  jasmine.clock().install();
  MockPromises.install(Promise);
});

afterEach(() => {
  jasmine.clock().uninstall();
  MockPromises.contracts.reset();
});

afterAll(() => {
  Object.keys(globals).forEach(key => delete global[key]);
});