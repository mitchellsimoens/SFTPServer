require('babel/register');

var fs         = require('fs'),
    mysql      = require('mysql'),
    SFTPServer = require('./lib/SFTPServer'),
    onShutdown = function() {
        server.destroy();

        process.exit(0);
    };

process.on('SIGINT',  onShutdown);
process.on('SIGTERM', onShutdown);
process.on('SIGHUP',  onShutdown);

var server = new SFTPServer({
    debug        : console.log,
    port         : 3333,
    privateKey   : __dirname + '/keys/host_rsa',

    dbAdapter   : require('./lib/database/MySQL'),
    fileAdapter : require('./lib/adapter/Filesystem'),
    //fileAdapter : require('./lib/adapter/Database'),
    keyAdapter  : require('./lib/key/Database'),

    dbConfig    : JSON.parse(fs.readFileSync('./db_config.json', 'utf8')),

    fileConfig  : {
        filenameParser : function(filename) {
            if (this.type === 'filesystem') {
                return __dirname + '/fileforyou.txt';
            } else {
                return filename;
            }
        }
    }
});

server.init();
