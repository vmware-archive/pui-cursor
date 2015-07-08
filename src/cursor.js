var compose = require('lodash.flowright');
var {findIndex, isObject} = require('./helpers/cursor_helper');
var reactUpdate = require('react/lib/update');

var async = true;
var privates = new WeakMap();

var updater = {
  sync(query) {
    var {callback, state} = privates.get(this);
    state.data = reactUpdate(state.data, query);
    callback(state.data);
  },

  async(query) {
    var {callback, data, state} = privates.get(this);
    state.updates.unshift(data => reactUpdate(data, query));
    if (state.updates.length !== 1) return;
    this.nextTick(() => {
      var fn = compose(...state.updates);
      state.updates = [];
      callback(fn.call(this, data));
    });
  }
};

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

  update(options) {
    var {path} = privates.get(this);
    var query = path.reduceRight((memo, step) => ({[step]: {...memo}}), options);
    updater[Cursor.async ? 'async' : 'sync'].call(this, query);
    return this;
  }
}

module.exports = Cursor;