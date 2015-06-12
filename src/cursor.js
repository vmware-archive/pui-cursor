var reactUpdate = require('react/lib/update');
var compose = require('lodash.flowright');
var privates = new WeakMap();
var async = true;

var updater = {
  sync(query) {
    var {callback, state} = privates.get(this);
    var {updatedData} = state;
    state.updatedData = reactUpdate(updatedData, query);
    callback(state.updatedData);
  },

  async(query) {
    var {callback, data, state} = privates.get(this);
    state.updates.unshift((data) => {
      return reactUpdate(data, query);
    });
    if (state.updates.length === 1) {
      this.nextTick(() => {
        var fn = compose(...state.updates);
        state.updates = [];
        callback(fn.call(this, data));
      });
    }
  }
};

class Cursor {
  get async() { return async; }

  set async(bool) { async = bool; }

  constructor(data, callback, path = [], state = null) {
    state = state || {updates: [], updatedData: data};
    privates.set(this, {data, callback, path, state});
  }

  refine(...query) {
    var {callback, data, path, state} = privates.get(this);
    if (query.some(p => typeof p === 'object')) {
      query = query.map((p, i) => typeof p !== 'object' ? p : (!i ? this.get() : this.get(query[i - 1])).indexOf(p));
      return new Cursor(data, callback, path.concat(query), state);
    }
    return new Cursor(data, callback, path.concat(query), state);
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
    var query = path.reduceRight((memo, step) => ({[step]: Object.assign({}, memo)}), options);
    updater[Cursor.async ? 'async' : 'sync'].call(this, query);
    return this;
  }
}

module.exports = Cursor;