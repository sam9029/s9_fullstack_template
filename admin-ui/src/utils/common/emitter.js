export default class EventEmitter {
  static errorMonitor = 'error';

  _events = Object.create(null);

  on(event, listener) {
    if (!event) {
      console.warn('eventEmitter on warn: param event is nil');
      return this;
    }
    if (!listener) {
      console.warn('eventEmitter on warn: param listener is nil');
      return this;
    }
    this._events[event] = this._events[event] || [];
    this._events[event].push(listener);
    return this;
  }

  once(event, listener) {
    if (!event) {
      console.warn('eventEmitter once warn: param event is nil');
      return this;
    }
    if (!listener) {
      console.warn('eventEmitter once warn: param listener is nil');
      return this;
    }
    listener.once = true;
    this.on(event, listener);
    return this;
  }

  prependListener(event, listener) {
    if (!event) {
      console.warn('eventEmitter prependListener warn: param event is nil');
      return this;
    }
    if (!listener) {
      console.warn('eventEmitter prependListener warn: param listener is nil');
      return this;
    }

    this._events[event] = this._events[event] || [];
    this._events[event].unshift(listener);
    return this;
  }

  prependOnceListener(event, listener) {
    if (!event) {
      console.warn('eventEmitter prependListener warn: param event is nil');
      return this;
    }
    if (!listener) {
      console.warn('eventEmitter prependListener warn: param listener is nil');
      return this;
    }
    listener.once = true;
    this._events[event] = this._events[event] || [];
    this._events[event].unshift(listener);
    return this;
  }

  off(event, listener) {
    if (!event) {
      console.warn('eventEmitter off warn: param event is nil');
      return this;
    }
    const listeners = this._events[event];
    if (!listeners) return this;

    if (!listener) {
      console.warn('eventEmitter off warn: param listener is nil');
      return this;
    }

    for (let i = 0; i < listeners.length; i++) {
      if (listeners[i] === listener) {
        listeners.splice(i, 1);
        break;
      }
    }

    if (listeners.length === 0) {
      delete this._events[event];
    }

    return this;
  }

  removeAllListeners(event) {
    if (!event) {
      console.warn('eventEmitter removeAllListeners warn: param event is nil');
      return this;
    }
    delete this._events[event];
    return this;
  }

  emit(event, ...args) {
    if (!event) {
      console.warn('eventEmitter emit warn: param event is nil');
      return false;
    }
    const listeners = this._events[event];
    if (!listeners?.length) return false;

    const offListeners = [];

    for (let i = 0; i < listeners.length; i++) {
      try {
        Reflect.apply(listeners[i], this, args);
        if (listeners[i].once) {
          offListeners.push(listeners[i]);
        }
      } catch (err) {
        this.emit(EventEmitter.errorMonitor, err, event, args);
      }
    }

    offListeners.forEach((func) => {
      this.off(event, func);
    });
    return true;
  }

  eventNames() {
    return Reflect.ownKeys(this._events);
  }

  /**
   * @returns {number }
   */
  listenerCount(event) {
    if (!event) {
      console.warn('eventEmitter listenerCount warn: param event is nil');
      return 0;
    }

    const listeners = this._events[event];
    if (!listeners) return 0;

    return listeners.length;
  }
}
