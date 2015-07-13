var jspm = require('jspm');
var crypto = require('crypto');
var fs = require('fs');

// writes file hashes to metadata
// | Note that metadata is not cumulative and will therefore overwrite previously defined metadata

var systemBuilder = new jspm.Builder();

const MAIN_FILE = 'main.js'; // can't find JSPM interface to get that
const SRC_DIR = 'src/'; // can't find JSPM interface to get that
const CONIFG_FILE = SRC_DIR + 'source-hashes.js';

systemBuilder
    .trace(MAIN_FILE)
    .then(function(tree){
        var dep_tree = systemBuilder.getDepCache(tree);

        var files = new Set();
        for(var dependant in dep_tree) {
            files.add(dependant);
            var dependencies = dep_tree[dependant];
            dependencies.forEach(function(dependency){
                files.add(dependency);
            });
        }

        var hashes = {};
        files.forEach(function(file){
            var source_code = tree[file].metadata.originalSource;
            var hash = crypto.createHash('sha256').update(source_code).digest('hex');
            hashes[file] = {
                "hash": hash
            };
            console.log(hash, file);
        });

        // TODO; replace \n with require('os').EOL
        fs.writeFile(CONIFG_FILE, 'System.config(' + JSON.stringify({meta:hashes}, null, 2) + ');', function(err){
            if( err ) throw err;
        });

        return tree;
    })
    .catch(function(err){ console.error(err); throw new Error(err)})
