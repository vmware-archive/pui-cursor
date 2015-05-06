'use strict';

var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var React = require('react/addons');

var privates = new WeakMap();

var Cursor = (function () {
  function Cursor(data, callback) {
    var path = arguments[2] === undefined ? [] : arguments[2];

    _classCallCheck(this, Cursor);

    privates.set(this, { data: data, path: path, callback: callback });
  }

  _createClass(Cursor, [{
    key: 'refine',
    value: function refine() {
      var _this = this;

      for (var _len = arguments.length, query = Array(_len), _key = 0; _key < _len; _key++) {
        query[_key] = arguments[_key];
      }

      var _privates$get = privates.get(this);

      var callback = _privates$get.callback;
      var data = _privates$get.data;
      var path = _privates$get.path;

      if (query.some(function (p) {
        return typeof p === 'object';
      })) {
        query = query.map(function (p, i) {
          return typeof p !== 'object' ? p : (!i ? _this.get() : _this.get(query[i - 1])).indexOf(p);
        });
        return new Cursor(data, callback, path.concat(query));
      }
      return new Cursor(data, callback, path.concat(query));
    }
  }, {
    key: 'get',
    value: function get() {
      for (var _len2 = arguments.length, morePath = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        morePath[_key2] = arguments[_key2];
      }

      var _privates$get2 = privates.get(this);

      var data = _privates$get2.data;
      var path = _privates$get2.path;

      return path.concat(morePath).reduce(function (memo, step) {
        return memo[step];
      }, data);
    }
  }, {
    key: 'isEqual',
    value: function isEqual(otherCursor) {
      return this.get() === otherCursor.get();
    }
  }, {
    key: 'apply',
    value: function apply(options) {
      return this.update({ $apply: options });
    }
  }, {
    key: 'merge',
    value: function merge(options) {
      return this.update({ $merge: options });
    }
  }, {
    key: 'set',
    value: function set(options) {
      return this.update({ $set: options });
    }
  }, {
    key: 'push',
    value: function push() {
      for (var _len3 = arguments.length, options = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        options[_key3] = arguments[_key3];
      }

      return this.update({ $push: options });
    }
  }, {
    key: 'remove',
    value: function remove(object) {
      return this.splice([this.get().indexOf(object), 1]);
    }
  }, {
    key: 'splice',
    value: function splice() {
      for (var _len4 = arguments.length, options = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        options[_key4] = arguments[_key4];
      }

      return this.update({ $splice: options });
    }
  }, {
    key: 'unshift',
    value: function unshift() {
      for (var _len5 = arguments.length, options = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        options[_key5] = arguments[_key5];
      }

      return this.update({ $unshift: options });
    }
  }, {
    key: 'update',
    value: function update(options) {
      var _privates$get3 = privates.get(this);

      var callback = _privates$get3.callback;
      var data = _privates$get3.data;
      var path = _privates$get3.path;

      var query = path.reduceRight(function (memo, step) {
        return _defineProperty({}, step, Object.assign({}, memo));
      }, options);
      callback(React.addons.update(data, query));
      return this;
    }
  }]);

  return Cursor;
})();

module.exports = Cursor;