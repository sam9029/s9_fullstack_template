!(function (t) {
  function e() {
    var e = this || self;
    (e.globalThis = e), delete t.prototype._T_;
  }
  'object' != typeof globalThis &&
    (this
      ? e()
      : (t.defineProperty(t.prototype, '_T_', {
          configurable: !0,
          get: e,
        }),
        _T_));
})(Object);
