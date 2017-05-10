/* eslint-disable no-undef */
global.document = new (require('jsdom')).JSDOM('<!doctype html><html><body></body></html>');
global.window = document.window;
global.navigator = global.window.navigator;
/* eslint-enable no-undef */
