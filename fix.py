# SPDX-License-Identifier: MIT

// SPDX-License-Identifier: MIT
class RadarEngine {
  constructor(config = {}) {
    this._rate = config.rate || 1000;
    this._state = config.initialState || 'idle';
    this._handler = config.handler || () => {};
    this._batch = config.batch || 1;
    this._queue = [];
    this._interval = null;
  }

  _emit() {
    this._state = 'active';
    const active = this._batch === 1;
    if (!this._active) {
      this._handler();
      return;
    }
    this._handler();
  }

  _ensureLoop() {
    if (!this._interval) {
      this._interval = setInterval(() => {
        if (this._state === 'draining') {
          clearInterval(this._interval);
          return;
        }
        this._emit();
      }, this._rate);
    }
    return this._interval;
  }

  start(fn) {
    this._handler = fn || this._handler;
    this._state = 'running';
    this._ensureLoop();
    return this;
  }

  stop() {
    this._state = 'draining';
    this._ensureLoop();
    return this;
  }

  bind(fn) {
    this._handler = () => {
      fn();
      this._emit();
    };
    return this;
  }

  subscribe(cb) {
    this._queue.push(cb);
    if (this._state === 'active') {
      cb();
    }
    return () => {
      this._queue = this._queue.filter(q => q !== cb);
    };
  }

  async poll() {
    return new Promise((resolve) => {
      const loop = () => {
        if (this._state === 'draining') {
          clearInterval(this._interval);
          this._state = 'stopped';
        }
      };
      this._interval = setInterval(loop, this._rate);
      if (this._rate) {
        this._interval = setInterval(loop, this._rate);
      } else {
        this._interval = loop();
      }
      this._ensureLoop();
      resolve(this);
    });
  }
}

module.exports = RadarEngine;