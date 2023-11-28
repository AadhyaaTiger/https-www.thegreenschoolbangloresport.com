/**
 * Holds the storage interface and object
 */
;
(function($, global, undefined) {

  if($.storage)
    return;

  /**
   * define generic storage object
   */
  function StorageObject() {
    this._storage = {};
  };

  StorageObject.prototype.get = function(key) {
    return this._storage[key];
  };

  StorageObject.prototype.set = function(key, value) {
    this._storage[key] = value;
  };

  StorageObject.prototype.clear = function(key) {
    this._storage[key] = null;
  };

  global.StorageObject = StorageObject;

  /**
   * generic storage API (get, set, remove)
   */
  $.storage = (function() {

    //check for localStorage support
    var hasLocalStorage = (typeof(Storage) !== "undefined");

    // init events module
    var events = ($.dmx && $.dmx.events) || $("body");

    // determine which storage element to use (local storage, cookies, cache or internal storage)
    var storageElement = hasLocalStorage ? localStorage : $.dmcookies || (($.dmx && $.dmx.cache) || new StorageObject());

    // map the method names to those of the storage element
    var methodNames = {
      "get": hasLocalStorage ? "getItem" : "get",
      "set": hasLocalStorage ? "setItem" : "set",
      "remove": hasLocalStorage ? "removeItem" : "clear"
    };

    // inner object for method invoking
    var methods = {
      // get the storage type
      type: hasLocalStorage ? "local" : "session",

      // proxy for methods (in order to invoke localStorage or cache storage)
      proxy: function(method) {
        return $.proxy(storageElement[methodNames[method]], storageElement);
      },

      // invokes a method		
      invoke: function(method, key, value, success) {
        if(!key) return;
        // trigger an event
        events.trigger("storage:" + method + ":" + key, {
          key: key,
          value: value || this.proxy("get", key),
          type: this.type
        });
        // get result
        var result = this.proxy(method)(key, value);
        // run success
        try {
          (success || $.noop)(result);
        } catch(e) {};

        return result;
      }
    };

    //return public API
    return {
      type: methods.type,
      get: function(key, success) {
        return methods.invoke("get", key, null, success);
      },
      set: function(key, value, success) {
        return methods.invoke("set", key, value, success);
      },
      remove: function(key, success) {
        return methods.invoke("remove", key, null, success);
      }
    };
  }());

  // hang on $.dm
  ($.dm = $.dm || {})["storage"] = $.storage;

}($, window));