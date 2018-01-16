(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Promise = factory());
}(this, (function () { 'use strict';

const checks = {
    plainObject( o ) {
        return !!o && Object.prototype.toString.call( o ) === '[object Object]';
    },
    object( src ) {
        return src && ( typeof src === 'object' );
    },
    string : s => typeof s === 'string' || s instanceof String,
    arrowFunction : src => {
        if( !checks.function( src ) ) return false;
        return /^(?:function)?\s*\(?[\w\s,]*\)?\s*=>/.test( src.toString() );
    },
    boolean : s => typeof s === 'boolean',
    promise : p => p && checks.function( p.then ),
    function : f => {
        const type = ({}).toString.call( f ).toLowerCase();
        return ( type === '[object function]' ) || ( type === '[object asyncfunction]' );
    },
    undefined : s => typeof s === 'undefined',
    true( s, generalized = true )  {
        if( checks.boolean( s ) || !generalized ) return !!s;
        if( checks.string( s ) ) {
            s = s.toLowerCase();
            return ( s === 'true' || s === 'yes' || s === 'ok' || s === '1' );
        }
        return !!s;
    },
    false( s, generalized = true ) {
        if( checks.boolean( s ) || !generalized ) return !s;
        if( checks.string( s ) ) {
            s = s.toLowerCase();
            return ( s === 'false' || s === 'no' || s === '0' || s === '' );
        }
        return !s;
    },
    iterable( obj ) {
        if( obj === null ) return false;
        let res;
        try {
            res = checks.function( obj[ Symbol.iterator ] );
        } catch( e ) {
            return false;
        }
        return res;
    },
    array( obj ) {
        return Array.isArray( obj );
    }
};

'arguments,asyncfunction,number,date,regexp,error'.split( ',' ).forEach( item => {
    checks[ item ] = obj => ( ({}).toString.call( obj ).toLowerCase() === '[object ' + item + ']' );
} );

const Promise = class {
    constructor( fn ) {
        if( !( this instanceof Promise ) ) {
            throw new TypeError( this + ' is not a promise ' );
        }

        if( !checks.function( fn ) ) {
            throw new TypeError( 'Promise resolver ' + fn + ' is not a function' );
        }

        this[ '[[PromiseStatus]]' ] = 'pending';
        this[ '[[PromiseValue]]' ]= null;
        this[ '[[PromiseThenables]]' ] = [];
        try {
            fn( promiseResolve.bind( null, this ), promiseReject.bind( null, this ) );
        } catch( e ) {
            if( this[ '[[PromiseStatus]]' ] === 'pending' ) {
                promiseReject.bind( null, this )( e );
            }
        }
    }

    then( resolved, rejected ) {
        const promise = new Promise( () => {} );
        this[ '[[PromiseThenables]]' ].push( {
            resolve : checks.function( resolved ) ? resolved : null,
            reject : checks.function( rejected ) ? rejected : null,
            called : false,
            promise
        } );
        if( this[ '[[PromiseStatus]]' ] !== 'pending' ) promiseExecute( this );
        return promise;
    }

    catch( reject ) {
        return this.then( null, reject );
    }
};

Promise.resolve = function( value ) {
    if( !checks.function( this ) ) {
        throw new TypeError( 'Promise.resolve is not a constructor' );
    }
    /**
     * @todo
     * check if the value need to return the resolve( value )
     */
    return new Promise( resolve => {
        resolve( value );
    } );
};

Promise.reject = function( reason ) {
    if( !checks.function( this ) ) {
        throw new TypeError( 'Promise.reject is not a constructor' );
    }
    return new Promise( ( resolve, reject ) => {
        reject( reason );
    } );
};

Promise.all = function( promises ) {
    let rejected = false;
    const res = [];
    return new Promise( ( resolve, reject ) => {
        let remaining = 0;
        const then = ( p, i ) => {
            if( !checks.promise( p ) ) {
                p = Promise.resolve( p );
            }
            p.then( value => {
                res[ i ] = value;
                if( --remaining === 0 ) {
                    resolve( res );
                }
            }, reason => {
                if( !rejected ) {
                    reject( reason );
                    rejected = true;
                }
            } );
        };

        let i = 0;
        for( let promise of promises ) {
            then( promise, remaining = i++ );
        }
    } );
};

Promise.race = function( promises ) {
    let resolved = false;
    let rejected = false;

    return new Promise( ( resolve, reject ) => {
        function onresolved( value ) {
            if( !resolved && !rejected ) {
                resolve( value );
                resolved = true;
            }
        }

        function onrejected( reason ) {
            if( !resolved && !rejected ) {
                reject( reason );
                rejected = true;
            }
        }

        for( let promise of promises ) {
            if( !checks.promise( promise ) ) {
                promise = Promise.resolve( promise );
            }
            promise.then( onresolved, onrejected );
        }
    } );
};

function promiseExecute( promise ) {
    var thenable,
        p;

    if( promise[ '[[PromiseStatus]]' ] === 'pending' ) return;
    if( !promise[ '[[PromiseThenables]]' ].length ) return;

    const then = ( p, t ) => {
        p.then( value => {
            promiseResolve( t.promise, value );
        }, reason => {
            promiseReject( t.promise, reason );
        } );
    };

    while( promise[ '[[PromiseThenables]]' ].length ) {
        thenable = promise[ '[[PromiseThenables]]' ].shift();

        if( thenable.called ) continue;

        thenable.called = true;

        if( promise[ '[[PromiseStatus]]' ] === 'resolved' ) {
            if( !thenable.resolve ) {
                promiseResolve( thenable.promise, promise[ '[[PromiseValue]]' ] );
                continue;
            }
            try {
                p = thenable.resolve.call( null, promise[ '[[PromiseValue]]' ] );
            } catch( e ) {
                then( Promise.reject( e ), thenable );
                continue;
            }
            if( p && ( typeof p === 'function' || typeof p === 'object' ) && p.then ) {
                then( p, thenable );
                continue;
            }
        } else {
            if( !thenable.reject ) {
                promiseReject( thenable.promise, promise[ '[[PromiseValue]]' ] ); 
                continue;
            }
            try {
                p = thenable.reject.call( null, promise[ '[[PromiseValue]]' ] );
            } catch( e ) {
                then( Promise.reject( e ), thenable );
                continue;
            }
            if( ( typeof p === 'function' || typeof p === 'object' ) && p.then ) {
                then( p, thenable );
                continue;
            }
        }
        promiseResolve( thenable.promise, p );
    }
    return promise;
}

function promiseResolve( promise, value ) {
    if( !( promise instanceof Promise ) ) {
        return new Promise( resolve => {
            resolve( value );
        } );
    }
    if( promise[ '[[PromiseStatus]]' ] !== 'pending' ) return;
    if( value === promise ) {
        /**
         * thie error should be thrown, defined ES6 standard
         * it would be thrown in Chrome but not in Firefox or Safari
         */
        throw new TypeError( 'Chaining cycle detected for promise #<Promise>' );
    }

    if( value !== null && ( typeof value === 'function' || typeof value === 'object' ) ) {
        var then;

        try {
            then = value.then;
        } catch( e ) {
            return promiseReject( promise, e );
        }

        if( typeof then === 'function' ) {
            then.call( value, 
                promiseResolve.bind( null, promise ),
                promiseReject.bind( null, promise )
            );
            return;
        }
    }
    promise[ '[[PromiseStatus]]' ] = 'resolved';
    promise[ '[[PromiseValue]]' ] = value;
    promiseExecute( promise );
}

function promiseReject( promise, value ) {
    if( !( promise instanceof Promise ) ) {
        return new Promise( ( resolve, reject ) => {
            reject( value );
        } );
    }
    promise[ '[[PromiseStatus]]' ] = 'rejected';
    promise[ '[[PromiseValue]]' ] = value;
    promiseExecute( promise );
}

return Promise;

})));
