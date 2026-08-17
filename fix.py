const { Runtime, Event, State } = runtime || {};

class EnhancedRuntime extends Runtime {
  constructor(options = {}) {
    super(options);
    this._listeners = new Map();
    this._subscribers = new Map();
    this._state = State.from({
    });
    this._debounceTimers = new Map();
    this._batchProcessQueue = [];
    this._isBatching = false;
    this._maxBatchSize = 100;
    this._initializing = true;
    this._cleanupListeners = [];
    
    this.setupCoreEvents();
    this.applyAutoListeners();
    
    if (options.autoSync === true) {
      this.syncState(options.syncInterval || 100);
    }
  }

  setupCoreEvents() {
    ['init', 'ready', 'mount', 'stateChange', 'error', 'sync', 'debounce'].forEach(event => {
      this.on(event, event);
    });
  }

  applyAutoListeners() {
    const self = this;
    
    if (options.autoSubscribe === true) {
      this._listeners.forEach((callback, event) => {
        this.on(event, callback);
      });
    }
  }

  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    
    const callbacks = this._listeners.get(event);
    
    if (typeof callback === 'function') {
      callbacks.push(callback);
      this._listeners.set(event, callbacks);
      
      return callback;
    } else if (callback === false) {
      const filtered = callbacks.filter(c => c !== callback);
      this._listeners.set(event, filtered);
      return callback;
    }
    
    return callback;
  }

  off(event, callback) {
    if (event && callback) {
      return this.on(event, callback === false);
    }
    
    if (event) {
      const callbacks = this._listeners.get(event);
      if (callbacks) {
        return callbacks.length ? this._listeners.set(event, callbacks) : this._listeners.delete(event);
      }
    }
    
    return event;
  }

  emit(event, data = null) {
    const callbacks = this._listeners.get(event) || [];
    
    if (!callbacks.length) return data;
    
    return callbacks
      .filter(callback => typeof callback === 'function')
      .forEach(callback => {
        callback.call(this, data || this._state.get(event));
      });
  }

  subscribe(name, callback) {
    if (!this._subscribers.has(name)) {
      this._subscribers.set(name, []);
    }
    
    const callbacks = this._subscribers.get(name);
    
    callbacks.push(() => {
      if (typeof callback === 'function') callback.call(this);
    });
    
    return this;
  }

  batch(action, callback) {
    if (this._isBatching) {
      this._batchProcessQueue.push(callback);
      
      if (this._batchProcessQueue.length === 1) {
        setTimeout(() => this._processBatch(), 0);
      }
      
      return this;
    }
    
    this._isBatching = true;
    
    const results = callback.call(this);
    
    if (results && results.length === this._batchProcessQueue.length) {
      this._batchProcessQueue.forEach(result => results.push(result));
    }
    
    this._batchProcessQueue.length = 0;
    this._isBatching = false;
    
    return results;
  }

  _processBatch() {
    const callbacks = this._batchProcessQueue;
    
    if (!callbacks.length) return;
    
    const results = callbacks.map(callback => callback.call(this));
    this._batchProcessQueue.length = 0;
    this._isBatching = false;
    
    return results;
  }

  debounce(fn, delay = 300, key = 'debounce') {
    if (!fn) return this._debounceTimers.get(key) || null;
    
    this._debounceTimers.set(key, setTimeout(() => {
      fn.call(this);
      this._debounceTimers.delete(key);
    }, delay));
    
    return this._debounceTimers.get(key);
  }

  throttle(fn, delay = 100, key = 'throttle') {
    if (!fn) return this._debounceTimers.get(key) || null;
    
    let lastRan = 0;
    
    return function (...args) {
      const now = Date.now();
      
      if (now - lastRan >= delay) {
        fn.call(this, ...args);
        lastRan = now;
        this._debounceTimers.set(key, lastRan);
      }
      
      return this;
    };
  }

  state(name, value) {
    if (arguments.length === 1) {
      return this._state.get(name);
    }
    
    this._state.set(name, value);
    this.emit('stateChange', { name, value, current: this._state.get(name) });
    
    return this._state.get(name);
  }

  syncState(interval = 100) {
    this._debounceTimers.set('syncInterval', setInterval(() => {
      const last = this._state.get('lastSync') || Date.now();
      
      if (Date.now() - last > interval * 1.1) {
        this.state('lastSync', Date.now());
        this.emit('sync');
      }
    }, interval));
    
    return this;
  }

  mount(element, options = {}) {
    if (!element && !options.shadow) return this;
    
    this.state('mounted', true);
    
    if (element && element.isConnected) {
      element.addEventListener('mouseenter', () => this.emit('mouseenter'));
      element.addEventListener('mouseleave', () => this.emit('mouseleave'));
      element.addEventListener('scroll', () => this._debounce(() => this.emit('scroll'), 50));
    }
    
    return this;
  }

  addCleanup(callback) {
    this._cleanupListeners.push(callback);
    this.on('destroy', callback);
    return this;
  }

  destroy() {
    this._listeners.forEach(() => {});
    this._debounceTimers.forEach(() => {});
    
    this._cleanupListeners.forEach(callback => callback.call(this));
    this._cleanupListeners.length = 0;
    
    return this;
  }

  setMaxBatchSize(size) {
    this._maxBatchSize = size;
    return this;
  }

  getStats() {
    return {
      listeners: this._listeners.size,
      subscribers: this._subscribers.size,
      stateKeys: this._state.keys().length,
      debounceTimers: this._debounceTimers.size,
      queueLength: this._batchProcessQueue.length,
      batchSize: this._maxBatchSize,
    };
  }
}

export default EnhancedRuntime;

export {
  EnhancedRuntime,
  Event,
  State,
  Runtime,
};

const runtimeInstance = new EnhancedRuntime({
  autoSubscribe: true,
  autoSync: true,
});

export const Runtime = runtimeInstance;
export const $ = (selector) => runtimeInstance.querySelector(selector);
export const $$ = (selector) => Array.from(runtimeInstance.querySelectorAll(selector));

if (typeof window !== 'undefined' && runtimeInstance._listeners.get('ready')) {
  window.runtime = runtimeInstance;
}
</think>

const Runtime = class {
  constructor(options = {}) {
    this._listeners = new Map();
    this._subscribers = new Map();
    this._state = new State(options.initialState || {});
    this._debounceTimers = new Map();
    this._batchQueue = [];
    this._isBatching = false;
    this._maxBatchSize = 100;
    this._initialized = options.autoInit !== false;
    this._cleanup = [];

    if (this._initialized) {
      this.setupCoreEvents();
      this.applyAutoListeners();
    }
  }

  setupCoreEvents() {
    ['init', 'ready', 'mount', 'stateChange', 'error', 'sync'].forEach(event => {
      if (options.autoSubscribe && this._listeners.get(event)) {
        this._listeners.get(event).forEach(fn => this.emit(event, fn));
      }
    });
  }

  applyAutoListeners() {
    this._listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => callback.call(this, this._state.get(event)));
    });
  }

  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }

    const list = this._listeners.get(event);

    if (typeof callback === 'function') {
      list.push(callback);
      this._listeners.set(event, list);
      return callback;
    }

    return callback === false
      ? this._listeners.set(event, list.filter(fn => fn !== callback))
      : callback;
  }

  off(event, callback) {
    if (!event) return this;
    if (!callback) {
      return this._listeners.delete(event);
    }

    const list = this._listeners.get(event);
    if (list) {
      const filtered = list.filter(fn => fn !== callback);
      this._listeners.set(event, filtered);
      if (!filtered.length) {
        this._listeners.delete(event);
      }
    }

    return this;
  }

  emit(event, data = null) {
    const callbacks = this._listeners.get(event) || [];
    
    if (!callbacks.length) return this;

    return callbacks
      .filter(fn => typeof fn === 'function')
      .forEach(fn => fn.call(this, data || this._state.get(event)));
  }

  subscribe(name, callback) {
    if (!this._subscribers.has(name)) {
      this._subscribers.set(name, []);
    }

    const list = this._subscribers.get(name);
    
    list.push(() => {
      if (typeof callback === 'function') callback.call(this);
    });

    return this;
  }

  state(name, value) {
    if (arguments.length === 1) {
      return this._state.get(name);
    }

    this._state.set(name, value);
    this.emit('stateChange', { name, value });

    return this._state.get(name);
  }

  batch(action, callback) {
    if (this._isBatching) {
      this._batchQueue.push(callback);

      if (this._batchQueue.length === 1) {
        setTimeout(() => this._processBatch(), 0);
      }

      return this;
    }

    this._isBatching = true;
    const results = callback.call(this);

    if (results && results.length === this._batchQueue.length) {
      this._batchQueue.forEach(r => results.push(r));
    }

    this._batchQueue.length = 0;
    this._isBatching = false;

    return results;
  }

  _processBatch() {
    const callbacks = this._batchQueue;
    
    if (!callbacks.length) return;
    
    const results = callbacks.map(fn => fn.call(this));
    this._batchQueue.length = 0;
    this._isBatching = false;

    return results;
  }

  debounce(fn, delay = 300, key = 'debounce') {
    if (!fn) return this._debounceTimers.get(key) || null;

    this._debounceTimers.set(key, setTimeout(() => {
      fn.call(this);
      this._debounceTimers.delete(key);
    }, delay));

    return this._debounceTimers.get(key);
  }

  throttle(fn, delay = 100, key = 'throttle') {
    if (!fn) return this._debounceTimers.get(key) || null;

    let lastRan = 0;

    return function (...args) {
      const now = Date.now();

      if (now - lastRan >= delay) {
        fn.call(this, ...args);
        lastRan = now;
        this._debounceTimers.set(key, lastRan);
      }

      return this;
    };
  }

  syncState(interval = 100) {
    this._debounceTimers.set('syncInterval', setInterval(() => {
      const last = this._state.get('lastSync') || Date.now();

      if (Date.now() - last > interval * 1.1) {
        this.state('lastSync', Date.now());
        this.emit('sync');
      }
    }, interval));

    return this;
  }

  mount(element, options = {}) {
    if (!element && !options.shadow) return this;

    this.state('mounted', true);

    if (element && element.isConnected) {
      element.addEventListener('mouseenter', () => this.emit('mouseenter'));
      element.addEventListener('mouseleave', () => this.emit('mouseleave'));
      element.addEventListener('scroll', () => this._debounce(() => this.emit('scroll'), 50));
    }

    return this;
  }

  addCleanup(callback) {
    this._cleanup.push(callback);
    this.on('destroy', callback);
    return this;
  }

  destroy() {
    this._listeners.forEach(() => {});
    this._debounceTimers.forEach(() => {});

    this._cleanup.forEach(fn => fn.call(this));
    this._cleanup.length = 0;

    return this;
  }

  setMaxBatchSize(size) {
    this._maxBatchSize = size;
    return this;
  }

  getStats() {
    return {
      listeners: this._listeners.size,
      subscribers: this._subscribers.size,
      stateKeys: this._state.keys().length,
      debounceTimers: this._debounceTimers.size,
      queueLength: this._batchQueue.length,
      batchSize: this._maxBatchSize,
    };
  }
};

export default Runtime;

export { State, Event, Runtime };

const runtimeInstance = new Runtime({
  autoSubscribe: true,
  autoSync: true,
});

export const $ = (selector) => runtimeInstance.querySelector(selector);
export const $$ = (selector) => Array.from(runtimeInstance.querySelectorAll(selector));

if (typeof window !== 'undefined' && runtimeInstance._listeners.get('ready')) {
  window.runtime = runtimeInstance;
}