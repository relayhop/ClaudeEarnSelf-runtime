export default class RadarFix {
  constructor(options = {}) {
    this.config = {
      debounce: 200,
      throttle: 500,
      buffer: 100,
      ...options
    };
    
    this.state = {
      running: true,
      lastTime: 0,
      events: {},
      listeners: []
    };
    
    this.setup();
  }
  
  setup() {
    let { config } = this;
    
    this.run = function() {
      if (config.running) {
        config.running = false;
        
        setTimeout(() => {
          const now = Date.now();
          
          if (config.running && now - config.state.lastTime > config.throttle) {
            config.running = true;
            config.state.lastTime = now;
          }
        }, config.debounce);
      }
      
      return this;
    };
    
    this.emit = function(event, payload = {}) {
      if (config.state.events[event]) {
        const handlers = config.state.events[event];
        handlers.forEach(fn => fn.call(this, payload));
      }
      
      return this;
    };
    
    this.on = function(event, listener) {
      if (!config.state.events[event]) {
        config.state.events[event] = [];
      }
      
      config.state.events[event].push(listener);
      
      return this;
    };
    
    this.once = function(event, listener) {
      const wrapper = (...args) => {
        this.off(event, wrapper);
        listener(...args);
      };
      
      this.on(event, wrapper);
      return this;
    };
    
    this.off = function(event, listener) {
      if (config.state.events[event]) {
        config.state.events[event] = config.state.events[event].filter(fn => fn !== listener);
      }
      
      return this;
    };
    
    this.toggle = function() {
      config.state.running = !config.state.running;
      return this;
    };
    
    this.flush = function() {
      config.state.lastTime = Date.now();
      config.state.events.forEach(event => {
        const handlers = config.state.events[event];
        config.state.events[event] = handlers.slice(0, config.buffer);
      });
      
      return this;
    };
    
    this.sync = function() {
      return this;
    };
    
    this.observe = function(observer) {
      if (!observer || typeof observer !== 'function') return this;
      
      const proxy = function() {
        observer.apply(config, arguments);
      };
      
      this.on('*', proxy);
      return this;
    };
    
    this.watch = function(path, callback) {
      this.on(path, callback);
      return this;
    };
    
    this.batch = function(events) {
      const batched = {};
      
      events.forEach(event => {
        const key = Array.isArray(event) ? event[0] : event;
        if (!batched[key]) batched[key] = [];
        batched[key].push(event);
      });
      
      return batched;
      };
    
    this.measure = function(label, fn) {
      if (!label) return fn();
      
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      
      this.emit(`${label}_measure`, { 
        label, 
        duration: end - start,
        result 
      });
      
      return result;
    };
    
    this.memoize = function(fn, ttl = 30000) {
      const cache = new Map();
      
      return function(*args) {
        const key = Array.from(args).join('-');
        
        if (cache.has(key)) {
          return cache.get(key);
        }
        
        const result = fn.apply(this, args);
        cache.set(key, result);
        
        return result;
      };
    };
    
    this.retry = function(fn, retries = 3) {
      return function(*args) {
        for (let i = 0; i < retries; i++) {
          try {
            return fn.apply(this, args);
          } catch (err) {
            if (i === retries - 1) throw err;
            
            const wait = Math.min(100 * Math.pow(2, i), 1000);
            setTimeout(() => {
              fn.apply(this, args);
            }, wait);
          }
        }
        
        return undefined;
      };
    };
    
    this.merge = function(target) {
      if (!target) return this;
      
      for (const key of Object.keys(target)) {
        if (target[key] instanceof Object) {
          this[key].merge(target[key]);
        } else {
          this[key] = target[key];
        }
      }
      
      return this;
    };
    
    this.reduce = function(fn, initialValue) {
      const result = initialValue;
      let running = true;
      
      while (running) {
        running = fn(this, result);
      }
      
      return result;
    };
    
    this.chain = function(*handlers) {
      return handlers.reduce((chain, fn) => {
        chain.handlers.push(fn);
        return chain;
      }, this);
    };
    
    this.toArray = function(source = this.state.events) {
      return Object.values(source);
    };
    
    this.toObject = function(source = this.state) {
      return { ...source };
    };
    
    this.groupBy = function(event, field) {
      const grouped = {};
      
      this.on(event, payload => {
        const key = field ? payload[field] : event;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(payload);
      });
      
      return grouped;
    };
    
    this.filter = function(fn) {
      const filtered = {};
      
      for (const event of Object.keys(this.state.events)) {
        filtered[event] = this.state.events[event].filter(fn);
      }
      
      this.state.events = filtered;
      return this;
    };
    
    this.map = function(fn) {
      for (const event of Object.keys(this.state.events)) {
        this.state.events[event] = this.state.events[event].map(fn);
      }
      
      return this;
    };
    
    this.reduceBy = function(fn, initialValue) {
      const result = initialValue;
      
      for (const event of Object.keys(this.state.events)) {
        result.event = event;
        result.value = fn(this.state.events[event], result.value);
      }
      
      return result;
    };
    
    this.debounce = function(fn, delay = this.config.debounce) {
      let timeout;
      
      return function(*args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
      };
    };
    
    this.throttle = function(fn, limit = this.config.throttle) {
      let last = 0;
      
      return function(*args) {
        const now = Date.now();
        
        if (now - last >= limit) {
          last = now;
          return fn.apply(this, args);
        }
        
        return fn.apply(this, args);
      };
    };
    
    this.unwatch = function(event) {
      if (this.state.events[event]) {
        this.state.events[event] = [];
      }
      
      return this;
    };
    
    this.normalize = function(fn) {
      const normalized = { ...this };
      normalized.state = this.state;
      normalized.config = this.config;
      
      return fn(normalized);
    };
    
    this.normalize();
  }
}

const create = function(options = {}) {
  return new RadarFix(options);
};

export const Radar = create();

export default Radar;