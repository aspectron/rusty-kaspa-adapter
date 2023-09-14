'use strict';

 /**
   * Clear event by name.
   *
   * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
   * @param {(String|Symbol)} evt The Event name.
   * @private
   */
  function clearEvent<Events extends EventEmitter.ValidEventTypes>(emitter: EventEmitter<Events, any>, evt:EventEmitter.EventNames<Events>) {
    emitter._events.delete(evt);
  }

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
class EE{
  fn: Function;
  context: any;
  once : boolean;

  constructor(fn:Function, context:any, once:boolean) {
    this.fn = fn;
    this.context = context;
    this.once = once || false;
  }
}

/**
 * Add a listener for a given event.
 *
 */
function addListener<Events extends EventEmitter.ValidEventTypes>(emitter: EventEmitter<Events, any>, event:EventEmitter.EventNames<Events>, fn: Function, context:any, once:boolean) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  let listener = new EE(fn, context || emitter, once);
  
  if (!emitter._events.has(event)){
    emitter._events.set(event, [listener]);
  }else{
    let array = emitter._events.get(event);
    array?.push(listener)
  }

  return emitter;
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
class EventEmitter<
  EventTypes extends EventEmitter.ValidEventTypes = string | symbol,
  Context extends any = any
  >  {
  

  _events: Map<EventEmitter.EventNames<EventTypes>, EE[]>;
  constructor(){
    this._events = new Map();
  }


  /**
   * Return an array listing the events for which the emitter has registered
   * listeners.
   *
   * @returns {Array}
   * @public
   */
  eventNames() : Array<EventEmitter.EventNames<EventTypes>>{
    return [...this._events.keys()];
  }

  /**
   * Return the listeners registered for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @returns {Array} The registered listeners.
   * @public
   */
  listeners<T extends EventEmitter.EventNames<EventTypes>>(
    event: T
  ): Array<EventEmitter.EventListener<EventTypes, T>> {
    let handlers = this._events.get(event);

    if (!handlers) return [];

    for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
      ee[i] = handlers[i].fn;
    }

    return ee;
  }

  /**
   * Return the number of listeners listening to a given event.
   *
   */
  listenerCount<T extends EventEmitter.EventNames<EventTypes>>(event: T) {
    let listeners = this._events.get(event);

    if (!listeners) return 0;
    return listeners.length;
  }

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param event The event name.
 * @returns `true` if the event had listeners, else `false`.
 *
 */
  emit<T extends EventEmitter.EventNames<EventTypes>>(event:T, ...args:EventEmitter.EventArgs<EventTypes, T>) {
    let listeners = this._events.get(event)
      , i;

    if (!listeners?.length)
      return false;
    
    var length = listeners.length;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);
      listeners[i].fn.call(listeners[i].context, ...args);
    }

    return true;
  }

  /**
   * Add a listener for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} fn The listener function.
   * @param {*} [context=this] The context to invoke the listener with.
   * @returns {EventEmitter} `this`.
   * @public
   */
  on(event:EventEmitter.EventNames<EventTypes>, fn:Function, context:any) {
    return addListener(this, event, fn, context, false);
  }

  /**
   * Add a one-time listener for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} fn The listener function.
   * @param {*} [context=this] The context to invoke the listener with.
   * @returns {EventEmitter} `this`.
   * @public
   */
  once(event:EventEmitter.EventNames<EventTypes>, fn:Function, context:any) {
    return addListener(this, event, fn, context, true);
  }

  /**
   * Remove the listeners of a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} fn Only remove the listeners that match this function.
   * @param {*} context Only remove the listeners that have this context.
   * @param {Boolean} once Only remove one-time listeners.
   * @returns {EventEmitter} `this`.
   * @public
   */
  removeListener(event:EventEmitter.EventNames<EventTypes>, fn:Function, context:any, once:boolean) {

    if (!this._events.has(event)) return this;
    var listeners = this._events.get(event);
    if (!listeners || !fn){
      clearEvent(this, event);
      return this;
    }
    
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length){
      this._events.set(event, events);
    }else{
      clearEvent(this, event);
    }
    return this;
  }

  /**
   * Remove all listeners, or those of the specified event.
   *
   * @param {(String|Symbol)} [event] The event name.
   * @returns {EventEmitter} `this`.
   * @public
   */
  removeAllListeners(event:EventEmitter.EventNames<EventTypes>|undefined) {

    if (event) {
      if (this._events.has(event)){
        clearEvent(this, event);
      }
    } else {
      this._events = new Map();
    }

    return this;
  }

  off(event:EventEmitter.EventNames<EventTypes>, fn:Function, context:any, once:boolean){
    return this.removeListener(event, fn, context, once)
  }
  addListener(event:EventEmitter.EventNames<EventTypes>, fn:Function, context:any){
    return this.on(event, fn, context)
  }
}

declare namespace EventEmitter {
  export interface ListenerFn<Args extends any[] = any[]> {
    (...args: Args): void;
  }

  export interface EventEmitterStatic {
    new <
      EventTypes extends ValidEventTypes = string | symbol,
      Context = any
    >(): EventEmitter<EventTypes, Context>;
  }

  /**
   * `object` should be in either of the following forms:
   * ```
   * interface EventTypes {
   *   'event-with-parameters': any[]
   *   'event-with-example-handler': (...args: any[]) => void
   * }
   * ```
   */
  export type ValidEventTypes = string | symbol | object;

  export type EventNames<T extends ValidEventTypes> = T extends string | symbol
    ? T
    : keyof T;

  export type ArgumentMap<T extends object> = {
    [K in keyof T]: T[K] extends (...args: any[]) => void
      ? Parameters<T[K]>
      : T[K] extends any[]
      ? T[K]
      : any[];
  };

  export type EventListener<
    T extends ValidEventTypes,
    K extends EventNames<T>
  > = T extends string | symbol
    ? (...args: any[]) => void
    : (
        ...args: ArgumentMap<Exclude<T, string | symbol>>[Extract<K, keyof T>]
      ) => void;

  export type EventArgs<
    T extends ValidEventTypes,
    K extends EventNames<T>
  > = Parameters<EventListener<T, K>>;

  export const EventEmitter: EventEmitterStatic;
}



export default EventEmitter;