import "core-js/stable";
import "regenerator-runtime/runtime";
require('./support/bluebird');

const jQuery = require('jquery');
const MockPromises = require('mock-promises');

const globals = {$: jQuery, jQuery, MockPromises};

Object.assign(global, globals);

beforeEach(() => {
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