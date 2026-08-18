# SPDX-License-Identifier: MIT

// SPDX-License-Identifier: MIT

export class RadarRuntime {
  constructor(config = {}) {
    this.id = `radar-${Date.now()}`;
    this.config = config;
    this.root = config.root || 'root';
    this.store = {};
    this.listeners = new Map();
    this.version = '2.0';

    this.init();
  }

  init() {
    this.listeners.set('all', new Set());

    // Setup root state from config
    if (this.config.initialState) {
      this.store[this.root] = this.config.initialState;
      this.notify('BOOT', this.store[this.root]);
    } else if (!this.store[this.root]) {
      this.store[this.root] = {};
    }

    this.listeners.get('all').forEach(cb => {
      if (typeof cb === 'function') cb({ type: 'INIT', payload: this.store });
    });

    // Bind methods for chaining
    this.set = this.set.bind(this);
    this.get = this.get.bind(this);
    this.notify = this.notify.bind(this);
  }

  get(path) {
    const target = this.store[this.root] || {};
    if (!path) return target;
    
    const segments = path.split('.');
    let current = target;
    
    for (let i = 0; i < segments.length; i++) {
      if (current && current[segments[i]] !== undefined) {
        current = current[segments[i]];
      } else {
        break;
      }
    }
    return current;
  }

  set(path, value, opts = {}) {
    const immediate = opts.immediate !== false;
    const segments = path.split('.');
    
    if (!this.store[this.root]) {
      this.store[this.root] = {};
    }

    if (segments.length === 1) {
      this.store[this.root][segments[0]] = value;
    } else {
      let current = this.store[this.root];
      
      for (let i = 0; i < segments.length - 1; i++) {
        if (!current[segments[i]]) current[segments[i]] = {};
        current = current[segments[i]];
      }
      
      current[segments[segments.length - 1]] = value;
    }

    if (immediate) {
      this.notify('UPDATE', this.store[this.root]);
    }
    
    return this;
  }

  notify(type, state) {
    const bucket = this.listeners.get(type) || this.listeners.get('all');
    
    if (bucket) {
      bucket.forEach(callback => {
        if (typeof callback === 'function') {
          try {
            callback({ type, state, key: this.root });
          } catch (e) {
            console.warn(`[Radar] Listener error on ${type}:`, e);
          }
        }
      });
    }
    
    return state;
  }

  subscribe(event, callback) {
    const bucket = this.listeners.get(event) || new Set();
    
    if (event === 'all') {
      this.listeners.set(event, bucket);
    } else {
      this.listeners.set(event, bucket);
    }
    
    // Add listener
    const sub = () => bucket.add(callback);
    sub();
    
    // Cleanup wrapper
    return () => {
      const current = this.listeners.get(event);
      if (current && callback) {
        current.delete(callback);
        if (current.size === 0) this.listeners.delete(event);
      }
    };
  }
}

export default RadarRuntime;