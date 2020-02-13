import 'core-js';
import 'regenerator-runtime';
import requireDir from 'require-dir';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
requireDir('./tasks');