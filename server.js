require('babel/register');

var fs         = require('fs'),
    mysql      = require('mysql'),
    SFTPServer = require('./lib/SFTPServer'),
    adapter    = require('./lib/adapter/Filesystem'),
    //adapter    = require('./lib/adapter/Database'),
    db         = require('./lib/database/MySQL'),
    dbConn     = new db(JSON.parse(fs.readFileSync('./db_config.json', 'utf8'))), // { "database" : "", "host" : "", "password" : "", "user" : "" }
    endDBConn  = function() {
        dbConn.disconnect();

        process.exit(0);
    };

dbConn.connect();

process.on('SIGINT',  endDBConn);
process.on('SIGTERM', endDBConn);
process.on('SIGHUP',  endDBConn);

//for simple example, this is only needed for Filesystem adapter
adapter.setFilenameParser(function(filename) {
    return __dirname + '/fileforyou.txt';
});

var server = new SFTPServer({
    adapter      : adapter,
    debug        : console.log,
    dbConnection : dbConn,
    port         : 3333,
    privateKey   : __dirname + '/keys/host_rsa'
});

server.init();
