var reactUpdate = require('react/lib/update');
var compose = require('lodash.flowright');
var privates = new WeakMap();

class Cursor {
  constructor(data, callback, path = [], updates = []) {
    privates.set(this, {data, path, callback, updates});
  }

  refine(...query) {
    var {callback, data, path, updates} = privates.get(this);
    if (query.some(p => typeof p === 'object')) {
      query = query.map((p, i) => typeof p !== 'object' ? p : (!i ? this.get() : this.get(query[i - 1])).indexOf(p));
      return new Cursor(data, callback, path.concat(query), updates);
    }
    return new Cursor(data, callback, path.concat(query), updates);
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
    var {updates} = privates.get(this);
    if (!updates.length) {
      this.nextTick(() => {
        var {callback, data, updates} = privates.get(this);
        var fn = compose(...updates);
        updates.splice(0, updates.length);
        callback(fn.call(this, data));
      });
    }
    updates.unshift((data) => {
      var {path} = privates.get(this);
      var query = path.reduceRight((memo, step) => ({[step]: Object.assign({}, memo)}), options);
      return reactUpdate(data, query);
    });

    return this;
  }
}

module.exports = Cursor;