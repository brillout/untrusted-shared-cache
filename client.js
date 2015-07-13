var Cache = (function(){

    return (function(){

        var Cache = {};

        var IFRAME_SRC__ORIGIN = 'http://localhost:8080';
        var IFRAME_SRC__PATH = '/cache.html';

        var iframe;
        var callbacks = {};

        Cache.init = function () {

            iframe = insert_iframe(IFRAME_SRC__ORIGIN + IFRAME_SRC__PATH);

            add_response_listener(callbacks, IFRAME_SRC__ORIGIN);

        };

        Cache.add = function(source){

            send_msg(iframe, source);

        };

        Cache.get = function(hash, callback){

            // TODO; avoid collision in case of two `Cache.get()` calls with same hash
            callbacks[hash] = function(source){
                if( source ) {
                    var source_hash = forge_sha256(source);

                    if(  hash !== source_hash ) {
                        log("ERROR: hash mismatch: expected hash: " + hash + ", computed hash: " + source_hash + ", source:\n" + source.slice(0,1000));
                        callback(undefined);
                        return;
                    }
                }

                callback(source);
            };

            send_msg(iframe, hash);

        };

        return Cache;

    })();


    function send_msg(iframe, msg){
        if( !iframe ) throw "Cache.init() needs to be called before";

        if( ! iframe.loaded ) {
            // no possible race condition since JS is single threaded
            iframe.addEventListener('load', function(){
                send_msg(iframe, msg);
            });
            return;
        }

        try{ // sometimes returns "Uncaught Error: SyntaxError: DOM Exception 12"
            if( iframe.contentWindow && iframe.contentWindow.postMessage ) {
                iframe.contentWindow.postMessage(
                    msg,
                    iframe.src);
            }
            else {
                log_warn("iframe.contentWindow.postMessage undefined");
            }
         }catch(err){
             log_warn(err);
         }

         function log_warn(err){
             log("WARNING: failed to communicate with iframe: " + err);
         }
    }

    function insert_iframe(src){

        var iframe = document.createElement('iframe');

        iframe.src = src;

        iframe.style.display = 'none';

        iframe.loaded = false;
        iframe.addEventListener('load', function(){
            iframe.loaded = true;
        });

        /* sequential loading
        // TODO; retrieve iframe after insertion and attach onload listener
        document.open();
        document.write(iframe.outerHTML);
        document.close();
        /*/
        ( document.getElementsByTagName('body')[0] ||
          document.documentElement)
            .appendChild(iframe);
        //*/

        return iframe;
    }

    function add_response_listener(callbacks, iframe_origin){
        window.addEventListener("message", function(event){
            if( event.origin !== iframe_origin ) return;
            var response = JSON.parse(event.data);
            if( callbacks[response.hash] ) callbacks[response.hash](response.source);
        });
    }

    function log(msg){
        var LOG_PREFIX = 'shared-cache.js: ';

        var IS_DEV = window.location && window.location.hostname && window.location.hostname === 'localhost';

        msg = LOG_PREFIX + msg;

        if( IS_DEV ) {
            throw msg;
        }
        else {
            console && console.log && console.log(msg);
        }
    }

})();
