process.env.NODE_ENV = process.env.NODE_ENV || 'development';

require('./lib/jsdom');

require('babel-core/register');
require('babel-polyfill');
(require('require-dir'))('./tasks');