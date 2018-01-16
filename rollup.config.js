import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';

export default [ {
    input : 'src/promise.js',
    plugins : [
        resolve( {
            module : true,
            jsnext : true
        } )
    ],
    output : [
        { file : 'dist/promise.cjs.js', format : 'cjs' },
        { file : 'dist/promise.js', format : 'umd', name : 'Promise' }
    ]
}, {
    input : 'src/promise.js',
    plugins : [
        resolve( {
            jsnext : true
        } ),
        babel()
    ],
    output : [
        { file : 'dist/promise.bc.js', format : 'umd', name : 'Promise' }
    ]
} ];
