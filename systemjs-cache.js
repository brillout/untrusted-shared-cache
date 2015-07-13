Cache.init();

var systemFetch = System.fetch;
System.fetch = function(load) {
    var System = this;
    return new Promise(function(resolve, reject) {
        // console.log('load', load.name, load.metadata.hash, load);

        new Promise(function(resolve, reject){
            if( ! load.metadata.hash ) {
                reject();
            }
            else {
                Cache.get(
                    load.metadata.hash,
                    function(source){
                        if( source ) {
                            resolve(source);
                        }
                        else {
                            reject();
                        }
                    });
            }
        })
        .then(resolve)
        .catch(function(){
            systemFetch
                .call(System, load)
                .then(function(source){
                    Cache.add(source);
                    resolve(source);
                })
                .catch(reject);
        });

    });
};
