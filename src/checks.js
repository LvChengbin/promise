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

export default checks;
