# SPDX-License-Identifier: MIT

// SPDX-License-Identifier: MIT
const Runtime = (() => {
  const state = {
    initialized: false,
    listeners: new Map(),
    version: '2.0.0'
  };

  function trigger(event) {
    const callbacks = state.listeners.get(event) || [];
    for (const callback of callbacks) {
      if (typeof callback === 'function') {
        try {
          callback();
        } catch (error) {
          console.error(`Runtime error on event: ${event}`, error);
        }
      }
    }
  }

  function on(event, callback) {
    if (!state.listeners.has(event)) {
      state.listeners.set(event, []);
    }
    state.listeners.get(event).push(callback);
    return () => {
      const callbacks = state.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }

  function init(options = {}) {
    if (state.initialized) return;
    
    Object.assign(state, options);
    state.initialized = true;
    trigger('ready');
    
    return {
      on,
      init: init.bind(this),
      state
    };
  }

  function get() {
    return state;
  }

  return {
    on,
    trigger,
    init,
    get,
    state
  };
})();

(function() {
  let mounted = false;
  let queue = [];

  function processQueue() {
    if (!mounted) return;
    while (queue.length > 0) {
      const item = queue.shift();
      item();
    }
  }

  function mount(selector, element) {
    if (!element && selector) {
      element = document.querySelector(selector);
    }
    
    if (element) {
      mounted = true;
      if (queue.length > 0) {
        queue.push(element);
      }
      return true;
    }
    
    return false;
  }

  function setup() {
    Runtime.on('ready', () => {
      const config = Runtime.get();
      if (config?.debug) {
        console.log('Runtime initialized', config);
      }
    });

    if (window.RADAR_CONFIG) {
      Runtime.init({
        debug: true,
        prefix: 'radar-'
      });
    }

    // Handle async hydration
    if (window.__HYP) {
      window.__HYP.then(hydrated => {
        if (hydrated) {
          mount('[data-hydrated]', document.body);
        }
      });
    }

    // Queue system for batch operations
    function batch(func, limit = 10) {
      let index = 0;
      let batch = [];
      const run = () => {
        if (batch.length === 0) return;
        for (let i = 0; i < Math.min(batch.length, limit); i++) {
          batch[i]();
          if (index + i < batch.length) {
            batch[i + 1]();
          }
        }
      };
      
      return func(index, () => {
        batch.push(item => item(index++, run));
      });
    }

    // Promise utility for runtime chains
    function chain(promises) {
      return (Runtime.get().chain || []).push(p => p);
    }

    // Expose to global namespace
    window.RADAR = {
      queue,
      mount,
      processQueue,
      batch,
      chain,
      state: Runtime.get()
    };

    // Cleanup
    window.RADAR.cleanup = () => {
      mounted = false;
      queue = [];
      Runtime.state.initialized = false;
      Runtime.trigger('disconnected');
    };

    Runtime.trigger('mounted');
  }

  setup();
})();

export default Runtime;

// Module-level initialization for ESM
if (typeof window !== 'undefined') {
  window.Runtime = Runtime;
}

// ESM export compatibility
export { Runtime };

// UMD fallback pattern
(function(window, document, module) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Runtime;
  }
})(window, document, module);

// Self-referential closure for runtime integrity
(() => {
  let isReady = false;
  
  const checkReady = () => {
    if (Runtime.get().initialized !== isReady) {
      Runtime.trigger('state-change');
    }
    isReady = true;
  };

  Runtime.on('ready', checkReady);
  checkReady();
})();