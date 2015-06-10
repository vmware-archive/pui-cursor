//(c) Copyright 2015 Pivotal Software, Inc. All Rights Reserved.
'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var Cursor = require('../cursor');

function isNotEqual(next, current, ignore) {
  return function (p) {
    if (ignore.includes(p)) return false;
    if (next[p] instanceof Cursor && current[p] instanceof Cursor) {
      return !next[p].isEqual(current[p]);
    }
    return next[p] !== current[p];
  };
}

var PureRenderMixin = {
  shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState, nextContext) {
    return [{ next: nextProps, current: this.props, type: 'Props' }, { next: nextState, current: this.state, type: 'State' }, { next: nextContext, current: this.context, type: 'Context' }].some(function (_ref) {
      var next = _ref.next;
      var current = _ref.current;
      var type = _ref.type;

      var ignore = 'ignorePureRender' + type;
      return next && _Object$keys(next).some(isNotEqual(next, current, this[ignore] || []));
    }, this);
  }
};

module.exports = PureRenderMixin;