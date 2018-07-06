import Promise from '../src/promise';

const supportGenerators = ( () => {
    try {
        new Function( 'function* test() {}' )();
    } catch( e ) {
        return false;
    }
    return true;
} )();

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
} );
