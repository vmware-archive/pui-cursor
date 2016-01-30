/* eslint-disable no-undef */
global.document = require('jsdom').jsdom('<!doctype html><html><body></body></html>');
global.window = document.defaultView;
global.navigator = global.window.navigator;
/* eslint-enable no-undef */
