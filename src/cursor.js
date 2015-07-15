var flow = require('lodash.flow');
var {findIndex, isObject} = require('./helpers/cursor_helper');
var reactUpdate = require('react/lib/update');

var async = true;
var privates = new WeakMap();

class Cursor {
  static get async() { return async; }

  static set async(bool) { async = bool; }

  constructor(data, callback, {path = [], state = {updates: [], data}} = {}) {
    privates.set(this, {data, callback, path, state});
  }

  refine(...query) {
    var {callback, data, path, state} = privates.get(this);
    if (!query.some(isObject)) return new Cursor(data, callback, {path: path.concat(query), state});
    query = query.map(findIndex.bind(this, query));
    return new Cursor(data, callback, {path: path.concat(query), state});
  }

  get(...morePath) {
    var {data, path} = privates.get(this);
    return path.concat(morePath).reduce((memo, step) => memo[step], data);
  }

  isEqual(otherCursor) {
    return this.get() === otherCursor.get();
  }

  apply(options) {
    return this.update({$apply: options});
  }

  merge(options) {
    return this.update({$merge: options});
  }

  set(options) {
    return this.update({$set: options});
  }

  push(...options) {
    return this.update({$push: options});
  }

  remove(object) {
    return this.splice([this.get().indexOf(object), 1]);
  }

  splice(...options) {
    return this.update({$splice: options});
  }

  unshift(...options) {
    return this.update({$unshift: options});
  }

  nextTick(fn) {
    setImmediate(fn);
  }

  flush() {
    var {callback, state} = privates.get(this);
    if (!state.updates.length) return this;
    var fn = flow(...state.updates);
    state.updates = [];
    state.data = fn.call(this, state.data);
    callback(state.data);
    return this;
  }

  update(options) {
    var {path, state: {updates}} = privates.get(this);
    var query = path.reduceRight((memo, step) => ({[step]: {...memo}}), options);
    updates.push(data => reactUpdate(data, query));
    if (!Cursor.async) return this.flush();
    if (updates.length === 1) this.nextTick(this.flush.bind(this));
    return this;
  }
}

module.exports = Cursor;
