(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Promise = factory());
}(this, (function () { 'use strict';

var isAsyncFunction = (function (fn) {
  return {}.toString.call(fn) === '[object AsyncFunction]';
});

var isFunction = (function (fn) {
  return {}.toString.call(fn) === '[object Function]' || isAsyncFunction(fn);
});

var isPromise = (function (p) {
  return p && isFunction(p.then);
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var Promise$1 = function () {
    function Promise(fn) {
        classCallCheck(this, Promise);

        if (!(this instanceof Promise)) {
            throw new TypeError(this + ' is not a promise ');
        }

        if (!isFunction(fn)) {
            throw new TypeError('Promise resolver ' + fn + ' is not a function');
        }

        this['[[PromiseStatus]]'] = 'pending';
        this['[[PromiseValue]]'] = null;
        this['[[PromiseThenables]]'] = [];
        try {
            fn(promiseResolve.bind(null, this), promiseReject.bind(null, this));
        } catch (e) {
            if (this['[[PromiseStatus]]'] === 'pending') {
                promiseReject.bind(null, this)(e);
            }
        }
    }

    createClass(Promise, [{
        key: 'then',
        value: function then(resolved, rejected) {
            var promise = new Promise(function () {});
            this['[[PromiseThenables]]'].push({
                resolve: isFunction(resolved) ? resolved : null,
                reject: isFunction(rejected) ? rejected : null,
                called: false,
                promise: promise
            });
            if (this['[[PromiseStatus]]'] !== 'pending') promiseExecute(this);
            return promise;
        }
    }, {
        key: 'catch',
        value: function _catch(reject) {
            return this.then(null, reject);
        }
    }]);
    return Promise;
}();

Promise$1.resolve = function (value) {
    if (!isFunction(this)) {
        throw new TypeError('Promise.resolve is not a constructor');
    }
    /**
     * @todo
     * check if the value need to return the resolve( value )
     */
    return new Promise$1(function (resolve) {
        resolve(value);
    });
};

Promise$1.reject = function (reason) {
    if (!isFunction(this)) {
        throw new TypeError('Promise.reject is not a constructor');
    }
    return new Promise$1(function (resolve, reject) {
        reject(reason);
    });
};

Promise$1.all = function (promises) {
    var rejected = false;
    var res = [];
    return new Promise$1(function (resolve, reject) {
        var remaining = 0;
        var then = function then(p, i) {
            if (!isPromise(p)) {
                p = Promise$1.resolve(p);
            }
            p.then(function (value) {
                res[i] = value;
                setTimeout(function () {
                    if (--remaining === 0) resolve(res);
                }, 0);
            }, function (reason) {
                if (!rejected) {
                    reject(reason);
                    rejected = true;
                }
            });
        };

        var i = 0;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = promises[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var promise = _step.value;

                remaining++;
                then(promise, i++);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        if (!i) {
            resolve(res);
        }
    });
};

Promise$1.race = function (promises) {
    var resolved = false;
    var rejected = false;

    return new Promise$1(function (resolve, reject) {
        function onresolved(value) {
            if (!resolved && !rejected) {
                resolve(value);
                resolved = true;
            }
        }

        function onrejected(reason) {
            if (!resolved && !rejected) {
                reject(reason);
                rejected = true;
            }
        }

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = promises[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var promise = _step2.value;

                if (!isPromise(promise)) {
                    promise = Promise$1.resolve(promise);
                }
                promise.then(onresolved, onrejected);
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }
    });
};

function promiseExecute(promise) {
    var thenable, p;

    if (promise['[[PromiseStatus]]'] === 'pending') return;
    if (!promise['[[PromiseThenables]]'].length) return;

    var then = function then(p, t) {
        p.then(function (value) {
            promiseResolve(t.promise, value);
        }, function (reason) {
            promiseReject(t.promise, reason);
        });
    };

    while (promise['[[PromiseThenables]]'].length) {
        thenable = promise['[[PromiseThenables]]'].shift();

        if (thenable.called) continue;

        thenable.called = true;

        if (promise['[[PromiseStatus]]'] === 'resolved') {
            if (!thenable.resolve) {
                promiseResolve(thenable.promise, promise['[[PromiseValue]]']);
                continue;
            }
            try {
                p = thenable.resolve.call(null, promise['[[PromiseValue]]']);
            } catch (e) {
                then(Promise$1.reject(e), thenable);
                continue;
            }
            if (p && (typeof p === 'function' || (typeof p === 'undefined' ? 'undefined' : _typeof(p)) === 'object') && p.then) {
                then(p, thenable);
                continue;
            }
        } else {
            if (!thenable.reject) {
                promiseReject(thenable.promise, promise['[[PromiseValue]]']);
                continue;
            }
            try {
                p = thenable.reject.call(null, promise['[[PromiseValue]]']);
            } catch (e) {
                then(Promise$1.reject(e), thenable);
                continue;
            }
            if ((typeof p === 'function' || (typeof p === 'undefined' ? 'undefined' : _typeof(p)) === 'object') && p.then) {
                then(p, thenable);
                continue;
            }
        }
        promiseResolve(thenable.promise, p);
    }
    return promise;
}

function promiseResolve(promise, value) {
    if (!(promise instanceof Promise$1)) {
        return new Promise$1(function (resolve) {
            resolve(value);
        });
    }
    if (promise['[[PromiseStatus]]'] !== 'pending') return;
    if (value === promise) {
        /**
         * thie error should be thrown, defined ES6 standard
         * it would be thrown in Chrome but not in Firefox or Safari
         */
        throw new TypeError('Chaining cycle detected for promise #<Promise>');
    }

    if (value !== null && (typeof value === 'function' || (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object')) {
        var then;

        try {
            then = value.then;
        } catch (e) {
            return promiseReject(promise, e);
        }

        if (typeof then === 'function') {
            then.call(value, promiseResolve.bind(null, promise), promiseReject.bind(null, promise));
            return;
        }
    }
    promise['[[PromiseStatus]]'] = 'resolved';
    promise['[[PromiseValue]]'] = value;
    promiseExecute(promise);
}

function promiseReject(promise, value) {
    if (!(promise instanceof Promise$1)) {
        return new Promise$1(function (resolve, reject) {
            reject(value);
        });
    }
    promise['[[PromiseStatus]]'] = 'rejected';
    promise['[[PromiseValue]]'] = value;
    promiseExecute(promise);
}

return Promise$1;

})));
