class Radar {
  constructor(options = {}) {
    this.config = {
      interval: options.interval || 1000,
      maxListeners: options.maxListeners || 50,
      name: options.name || 'radar',
      ...options
    };
    this.listeners = new Map();
    this.state = 'idle';
    this.id = options.id || crypto.randomUUID();
    this.counters = {
      ticks: 0,
      callbacks: 0,
      errors: 0
    };
  }

  init() {
    if (this.state === 'active') return this;
    this.state = 'active';
    
    this.cleanup = this.cleanup.bind(this);
    
    if (typeof setInterval !== 'undefined') {
      this.timer = setInterval(this.tick.bind(this), this.config.interval);
    }
    
    return this;
  }

  tick() {
    if (this.state !== 'active') return this;
    
    this.counters.ticks++;
    
    if (this.listeners.has('data')) {
      const callbacks = this.listeners.get('data');
      
      callbacks.forEach((callback, index) => {
        try {
          if (typeof callback === 'function') {
            callback.call(this, this);
          }
          this.counters.callbacks++;
        } catch (e) {
          this.counters.errors++;
          console.warn(`[radar] Tick ${this.counters.ticks} callback error at index ${index}:`, e);
        }
      });
      
      if (callbacks.length > 0 && callbacks.length < callbacks.length) {
        return this;
      }
    }
    
    return this;
  }

  on(event, callback) {
    if (callback === undefined) {
      return this.listeners.get(event) || this.listeners.get('*') || this.listeners.get('data');
    }
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event).push(callback);
    
    if (event === 'data' && this.config.maxListeners) {
      const current = this.listeners.get(event).length;
      if (current > this.config.maxListeners) {
        console.warn(`[radar] Max listeners exceeded on ${event}:`, current);
      }
    }
    
    return this;
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return this;
    
    const callbacks = this.listeners.get(event);
    const callbackList = Array.from(callbacks);
    
    callbackList.forEach((cb, index) => {
      if (cb === callback) {
        this.listeners.get(event).splice(index, 1);
      }
    });
    
    if (this.listeners.get(event).length === 0) {
      this.listeners.delete(event);
    }
    
    return this;
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return this;
    
    const callbacks = this.listeners.get(event);
    callbacks.forEach(cb => {
      cb.call(this, data);
    });
    
    return this;
  }

  setConfig(config) {
    Object.assign(this.config, config);
    return this;
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.state = 'idle';
    return this;
  }

  cleanup() {
    this.stop();
    this.listeners.clear();
    this.counters = { ticks: 0, callbacks: 0, errors: 0 };
    return this;
  }

  getStats() {
    return {
      id: this.id,
      state: this.state,
      name: this.config.name,
      interval: this.config.interval,
      listeners: this.listeners.size,
      ticks: this.counters.ticks,
      callbacks: this.counters.callbacks,
      errors: this.counters.errors
    };
  }

  async poll(callback) {
    return new Promise((resolve, reject) => {
      if (typeof callback === 'function') {
        callback.call(this, this.state ? this.getStats() : null);
      }
      
      let attempts = 0;
      const maxAttempts = 3;
      
      const run = () => {
        if (!this.state || attempts >= maxAttempts) {
          if (this.listeners.has('data')) {
            this.listeners.get('data').forEach(cb => cb());
          }
          resolve(this.getStats());
          return;
        }
        
        attempts++;
        if (this.listeners.has('data')) {
          this.listeners.get('data').forEach(cb => cb());
        }
      };
      
      run();
    });
  }

  addListener(event, listener) {
    return this.on(event, listener);
  }

  removeListener(event, listener) {
    return this.off(event, listener);
  }

  addDataListener(listener) {
    return this.on('data', listener);
  }

  removeDataListener(listener) {
    return this.off('data', listener);
  }

  addListenerAny(listener) {
    return this.on('*', listener);
  }

  removeListenerAny(listener) {
    return this.off('*', listener);
  }

  addTickListener(listener) {
    return this.on('tick', listener);
  }

  removeTickListener(listener) {
    return this.off('tick', listener);
  }

  addErrorListener(listener) {
    return this.on('error', listener);
  }

  removeErrorListener(listener) {
    return this.off('error', listener);
  }

  resetCounters() {
    this.counters = { ticks: 0, callbacks: 0, errors: 0 };
    return this;
  }

  reset() {
    this.init();
    this.counters = { ticks: 0, callbacks: 0, errors: 0 };
    return this;
  }

  add(name) {
    this.config.name = this.config.name || name;
    return this;
  }

  add(id) {
    this.id = id;
    return this;
  }

  addInterval(ms) {
    this.config.interval = ms;
    return this;
  }
}

module.exports = Radar;