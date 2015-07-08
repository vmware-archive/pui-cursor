var Helper = {
  isObject(obj) {
    return typeof obj === 'object';
  },

  findIndex(query, p, i) {
    return !Helper.isObject(p) ? p : (this.get(...i ? [query[i - 1]] : [])).indexOf(p);
  }
};

module.exports = Helper;