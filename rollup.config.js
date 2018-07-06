import resolve from 'rollup-plugin-node-resolve';
import buble from 'rollup-plugin-buble';

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
            module : true,
            jsnext : true
        } ),
        buble( {
            transforms : {
                dangerousForOf : true
            }
        } )
    ],
    output : [
        { file : 'dist/promise.bc.js', format : 'umd', name : 'Promise' }
    ]
} ];
