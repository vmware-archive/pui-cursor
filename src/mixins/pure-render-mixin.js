const Cursor = require('../cursor');

function isNotEqual(next, current, ignore) {
  return function(p) {
    if (ignore.includes(p)) return false;
    if (next[p] instanceof Cursor && current[p] instanceof Cursor) {
      return !next[p].isEqual(current[p]);
    }
    return next[p] !== current[p];
  };
}

const PureRenderMixin = {
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return [
      {next: nextProps, current: this.props, type: 'Props'},
      {next: nextState, current: this.state, type: 'State'},
      {next: nextContext, current: this.context, type: 'Context'}].some(({next, current, type}) => {
        const ignore = `ignorePureRender${type}`;
        return next && Object.keys(next).some(isNotEqual(next, current, this[ignore] || []));
      });
  }
};

module.exports = PureRenderMixin;