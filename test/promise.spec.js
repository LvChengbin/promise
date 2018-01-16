import Promise from '../src/promise';

const supportGenerators = ( () => {
    try {
        new Function( 'function* test() {}' )();
    } catch( e ) {
        return false;
    }
    return true;
} )();

describe( 'J/Core/Promise', () => {
    describe( 'Promise', () => {
        it( 'Should have thrown an error if using the promise object itself as a paramter of the resolve function', () => {
            var func;
            var p = new Promise( resolve => {
                func = resolve;
            } );

            expect( () => {
                func( p );
            } ).toThrow( new TypeError( 'Chaining cycle detected for promise #<Promise>' ) );
        } );
    } );

    describe( 'Promise.resolve', () => {
        it( 'Should have returned an instance of Promise', () => {
            expect( Promise.resolve() instanceof Promise ).toBeTruthy();
        } );

        it( 'Should have returned a resolved Promise object', () => {
            expect( Promise.resolve()[ '[[PromiseStatus]]' ] ).toBe( 'resolved' );
        } );

        it( 'Should have thrown a TypeError if using the Promise.resolve as a constructor', () => {
            expect( () => {
                new Promise.resolve();
            } ).toThrow( new TypeError( 'Promise.resolve is not a constructor' ) );
        } );
    } );

    describe( 'Promise.reject', () => {
        it( 'Should have returned an instance of Promise object', () => {
            expect( Promise.reject() instanceof Promise ) .toBeTruthy();
        } );

        it( 'Should have returned a rejected Promise object', () => {
            expect( Promise.reject()[ '[[PromiseStatus]]' ] ).toBe( 'rejected' );
        } );

        it( 'Should have thrown a TypeError if using the Promise.reject as a constructor', () => {
            expect( () => {
                new Promise.reject();
            } ).toThrow( new TypeError( 'Promise.reject is not a constructor' ) );
        } );
    } );

    describe( 'Promise.prototype.catch', () => {
        it( 'Should have called the "catch" after the Promise object was rejected', done => {
            new Promise( ( resolve, reject ) => {
                setTimeout( () => {
                    reject( 'reject' );
                }, 10 );
            } ).catch( value => {
                expect( value ).toBe( 'reject' );
                done();
            } );
        } );

        it( 'Should have called the "catch" method immediately if adding a "catch" method to a rejected Promise', done => {
            Promise.reject( 'reject' ).catch( value => {
                expect( value ).toBe( 'reject' );
                done();
            } );
        } );
    } );

    describe( 'Promise.prototype.then', () => {
        it( 'Should have been executed while Promise was resolved in async', done => {
            new Promise( resolve => {
                setTimeout( () => {
                    resolve( 'resolve' );
                }, 10 );
            } ).then( value => {
                expect( value ).toBe( 'resolve' );
                done();
            } );
        } );

        it( 'Should have executed the "reject" method after Promise was rejected in async', done => {
            new Promise( ( resolve, reject ) => {
                setTimeout( () => {
                    reject( 'reject' );
                }, 10 );
            } ).then( null, value => {
                expect( value ).toBe( 'reject' );
                done();
            } );
        } );

        it( 'If method "resolve" in the "then" method returned another Promise, the outer Promise should wait for the inner Promise untill the inner Promise been resolved, the the outer Promise should be resolved', done => {
            Promise.resolve( 1 ).then( () => {
                return new Promise( resolve => {
                    setTimeout( () => {
                        resolve( 'resolve' );
                    }, 10 );
                } );
            } ).then( value => {
                expect( value ).toBe( 'resolve' );
                done();
            } );
        } );

        it( 'If method "resolve" in the "then" method returned another Promise, the outer Promise should wait for the inner Promise untill the inner Promise been rejected, then the outer Promise should be rejected', done => {
            Promise.resolve( 1 ).then( () => {
                return new Promise( ( resolve, reject ) => {
                    setTimeout( () => {
                        reject( 'reject' );
                    }, 10 );
                } );
            } ).catch( value => {
                expect( value ).toBe( 'reject' );
                done();
            } );
        } );

        it( 'Should have transfered the value of the Promise to the following "resolve" methods in "then"', done => {
            Promise.resolve( 'resolve' ).catch( () => {} ).then( value => {
                expect( value ).toBe( 'resolve' );
                done();
            } );
        } );

        it( 'The "resolved" status should have been transfered to all of the Promise objects which were following the current Promise object', done => {
            Promise.resolve( 'resolve' )
                .then( () => {} )
                .then( () => {
                    expect( true ).toBe( true );
                    done();
                } );
        } );

        it( 'If the returned value from "resolve" method should have been transfered to the next "then" method', () => {
            Promise.resolve( 1 ).then( () => {
                return 'resolve';
            } ).then( value => {
                expect( value ).toBe( 'resolve' );
            } );
        } );

        it( 'If the "resolve" method has returned another Promise object, the "then" method should get transfered value from the inner Promise object', done => {
            Promise.resolve( 1 ).then( () => {
                return Promise.resolve( 2 );
            } ).then( value => {
                expect( value ).toBe( 2 );
                done();
            } );
        } );

        it( 'Should have called the "resolve" method in "then" even if the previous Promise object returned an resolved Promise object in it\'s "reject" method', done => {
            Promise.reject( 1 ).then( null, () => {
                return Promise.resolve( 'resolve' );
            } ).then( value => {
                expect( value ).toBe( 'resolve' );
                done();
            } );
        } );

        it( 'Should have gone well even if the method "resolve" returned a native Promise object', done => {
            window.Promise || ( window.Promise = Promise );

            Promise.resolve( 1 ).then( () => {
                return new window.Promise( resolve => {
                    setTimeout( () => {
                        resolve( 'resolve' );
                    }, 10 );
                } );
            } ).then( value => {
                expect( value ).toBe( 'resolve' );
                done();
            } );
        } );

        it( 'Should have gone well even if the method "reject" returned a native Promise object', done => {
            window.Promise || ( window.Promise = Promise );

            Promise.reject( 1 ).catch( () =>{ 
                return new window.Promise( ( resolve, reject ) => {
                    setTimeout( () => {
                        reject( 'reject' );
                    }, 10 );
                } );
            } ).catch( value => {
                expect( value ).toBe( 'reject' );
                done();
            } );
        } );


        it( 'If the paramater of "resolve" method is another Promise object, the current Promise object should wait for the Promise, as the paramater, untill it had been resolved, then the current Promise object should have been resolved', done => {
            new Promise( resolve => {
                resolve( new Promise( resolve => {
                    resolve( 'resolve' );
                } ) );
            } ).then( value => {
                expect( value ).toBe( 'resolve' );
                done();
            } );
        } );

        it( 'Should have gone well if the paramater of "resolve" method was a native Promise object', done => {
            window.Promise || ( window.Promise = Promise );

            new Promise( resolve => {
                resolve( window.Promise.resolve( 'resolve' ) );
            } ).then( value => {
                expect( value ).toBe( 'resolve' );
                done();
            } );
        } );

        it( 'If the param of "resolve" method was a native Promise object, the "catch" method can catch the reason thrown from the native Promise object', done => {
            new Promise( resolve => {
                resolve( window.Promise.reject( 'reject' ) );
            } ).catch( reason => {
                expect( reason ).toBe( 'reject' );
                done();
            } );
        } );

        it( 'Should have been executed well even if the paramater of "resolve" method is null', done => {
            new Promise( resolve => {
                setTimeout( () => {
                    resolve( null );
                }, 10 );
            } ).then( value => {
                expect( value ).toBe( null );
                done();
            } );
        } );

        it( 'Should have caught the exception in the "catch" method if an error was thrown from the previous Promise object', done => {
            new Promise( () => {
                throw 'Error';
            } ).catch( reason => {
                expect( reason ).toBe( 'Error' );
                done();
            } );
        } );

        it( 'Should have caught all exceptions if there is a method for dealing with the "rejected" status of th Promise instance', done => {
            new Promise( () => {
                JSON.parse( 'dfslafjdslaf:{]da"' );
            } ).catch( reason => {
                expect( reason instanceof SyntaxError ).toBeTruthy();
                done();
            } );
        } );

        it( 'Should have caught the exception in the "catch" method if an error was thrown from the previous Promise object', done => {
            Promise.resolve().then( () => {
                throw 'x';
            } ).catch( reason => {
                expect( reason ).toBe( 'x' );
                done();
            } );
        } );

        it( 'The "then" method should have returned a resolved Promise object no matter the "onResolved" or "onRejected" was called', done => {
            Promise.resolve().then( () => {
                throw 1;
            } ).then( null, function( e ) {
                return ++e;
            } ).then( function( v ) {
                expect( v ).toBe( 2 );
                done();
            } );
        } );

        it( 'The second Promise object should be resolved with the value of the first Promise object if the first "onResolved" is not a function', done => {
            Promise.resolve( 1 ).then().then( value => {
                expect( value ).toBe( 1 );
                done();
            } );
        } );

        it( 'The second Promise object shoule be rejected with the reason of the first Promise  object if the first "onRejected" is not a function', done => {
            Promise.reject( 1 ).then().catch( reason => {
                expect( reason ).toBe( 1 );
                done();
            } );
        } );

        it( 'Should have ignored the thrown exception if the Promise object\'s resolved has already been called', done => {
            new Promise( resolve => {
                resolve( 'resolve' );
                throw 'x';
            } ).then( value => {
                expect( value ).toBe( 'resolve' );
                done();
            } );
        } );

        it( 'This is a special case, I don\'t know how to describe it', done => {
            new Promise( resolve => {
                resolve( new Promise( function( r ) {
                    setTimeout( () => { r( false ) }, 10 );
                } ) );
            } ).then( value => {
                if( !value ) throw 'x';
                return true;
            } ).catch( reason => {
                expect( reason ).toBe( 'x' );
                done();
            } );
        } );
    } );

    describe( 'Promise.all', () => {
        if( supportGenerators ) {
            const promises = function* () {
                yield Promise.resolve( 1 );
                yield Promise.resolve( 2 );
            }
            
            it( 'Can accept an Iterator as its param', done => {
                Promise.all( promises() ).then( values => {
                    expect( values ).toEqual( [ 1, 2 ] );
                    done();
                } );
                
            } );
        }

        it( 'The Promise object should have been resolved after all Promise objects in the argument list resolved', done => {
            Promise.all( [ Promise.resolve(), Promise.resolve() ] ).then( () => {
                expect( true ).toBeTruthy();
                done();
            } );
        } );

        it( 'The value of the Promise should be an array that filled with all Promise objects\' values in the arguments list', done => {
            Promise.all( [ 
                Promise.resolve( 1 ),
                Promise.resolve( 2 )
            ] ).then( function( values ) {
                expect( values ).toEqual( [ 1, 2 ] );
                done();
            } );
        } );

        it( 'The Promise object should have been rejected as long as one Promise object in the argument list has been rejected', done => {
            Promise.all( [ Promise.reject(), Promise.resolve() ] ).catch( () => {
                expect( true ).toBeTruthy();
                done();
            } );
        } );

        it( 'Should have transfered the rejected reason, that generated from the first rejected Promise object in the argument list, to the "catch" method', done => {
            Promise.all( [
                Promise.reject( 'reject' ),
                Promise.resolve( 'resolve' ),
                Promise.reject( 'reject2' )
            ] ).catch( reason => {
                expect( reason ).toBe( 'reject' );
                done();
            } );
        } );

        it( 'Should have been converted to a "resolved" promise instance if an item in the argument is not a promise instance, and it should be the value of the promise instance', done => {
            Promise.all( [ 'a', 'b', Promise.resolve( 'c' ) ] ).then( value => {
                expect( value ).toEqual( [ 'a', 'b', 'c' ] );
                done();
            } );
        } );

    } );
    
    describe( 'Promise.race', () => {
        if( supportGenerators ) {
            it( 'Can accept an Iterator as its param', done => {
                Promise.race( ( function*() {
                    yield Promise.resolve( 'one' );
                    yield Promise.resolve( 'two' );
                    yield Promise.reject( 'reject' );
                } )() ).then( value => {
                    expect( value ).toBe( 'one' );
                    done();
                } );
            } );
        }

        it( 'The Promise object should have been resolved as long as any Promise object in the argument list was resolved firstly', done => {
            Promise.race( [
                Promise.resolve( 'one' ),
                Promise.resolve( 'two' ),
                Promise.reject( 'reject' )
            ] ).then( value => {
                expect( value ).toBe( 'one' );
                done();
            } );
        } );

        it( 'The Promise object should have been rejected as long as any Promise object in the argument list was rejected firstly', done => {
            Promise.race( [
                Promise.reject( 'reject' ),
                Promise.resolve( 'one' ),
                Promise.resolve( 'two' )
            ] ).catch( value => {
                expect( value ).toBe( 'reject' );
                done();
            } );
        } );

        it( 'Should have been converted to a promise instance if one item in the argument is not a promise instance', done => {
            Promise.race( [
                'a',
                Promise.resolve( 'b' )
            ] ).then( value => {
                expect( value ).toEqual( 'a' );
                done();
            } );
        } );

    } );
} );
