'use strict';

var fs          = require('fs'),
    ssh2        = require('ssh2'),
    SFTPStream  = require('ssh2-streams').SFTPStream,
    OPEN_MODE   = ssh2.SFTP_OPEN_MODE,
    STATUS_CODE = ssh2.SFTP_STATUS_CODE,
    nsRe        = /^\[\w+\]$/;

class Server {
    /**
     * @param {Object} config Configuration with following configs:
     *  - **adapter** The adapter the server will use to work with files
     *  - **address** The IP or hostname of the server, defaults to `127.0.0.1`
     *  - **debugFn** A function to use to output debug info (optional)
     *  - **mysqlConnection** The MySQL connection to use to lookup public keys
     *  - **port** The port the server is listening to, defaults to `22`
     *  - **privateKey** Can be a string or a buffer from `fs.readFile` or `fs.readFileSync`
     */
    constructor(config) {
        let name;

        config.adapters     = {};
        config.address      = config.address || '127.0.0.1';
        config.dbConnection = true;
        config.port         = config.port    || 22;

        for (name in config) {
            this[name] = config[name];
        }
    }

    destroy() {
        var dbConnection = this.dbConnection;

        if (dbConnection) {
            dbConnection.disconnect();
        }
    }

    get privateKey() {
        return this._privateKey;
    }

    set privateKey(key) {
        if (typeof key === 'string') {
            key = fs.readFileSync(key);
        }

        this._privateKey = key;
    }

    get dbConnection() {
        return this._dbConnection;
    }

    set dbConnection(bool) {
        if (bool) {
            let config = this.dbConfig,
                conn   = new this.dbAdapter(config);

            conn.connect();

            this._dbConnection = conn;
        } else {
            //destroy it if present?
            this._dbConnection = null;
        }

        return this;
    }

    /**
     * Initialize the server, this will create the ssh2 server and start listening.
     */
    init() {
        let me = this;

        new ssh2.Server(
            {
                privateKey : me.privateKey
            },
            function(client) {
                console.log('Client connected!');

                me.client = client;

                client
                    .on('authentication', me.authenticate.bind(me))
                    .on('ready',          me.onReady.bind(me))
                    .on('end',            me.onEnd.bind(me));
            }
        )
        .listen(
            me.port,
            me.address,
            function() {
                let address = this.address();

                console.log('\nListening on %s:%d\n', address.address, address.port)
            }
        );
    }

    /**
     * Returns a cached adapter.
     *
     * @param {String/Number} id The id of the adapter.
     *
     * @return {FileAdapter}
     */
    getAdapter(id) {
        return this.adapters[id];
    }

    /**
     * Caches the adapter. If the adapter passed is `== null` then the adapter
     * is removed from the cache.
     *
     * @param {String/Number} id The id of the adapter.
     * @param {FileAdapter} adapter The adapter to cache.
     *
     * @return {FileAdapter}
     */
    setAdapter(id, adapter) {
        if (adapter == null) {
            delete this.adapters[id];
        } else {
            this.adapters[id] = adapter;
        }

        return this;
    }

    /**
     * Creates an adapter instance using the {@link #adapter} that was configured.
     *
     * @return {FileAdapter}
     */
    createAdapter() {
        var adapter = this.fileAdapter,
            config  = this.fileConfig || {};

        config.dbConnection = this.dbConnection;

        return new adapter(config);
    }

    /**
     * Creates a {@link Key} instance passing the database connection and the
     * ssh2 context.
     *
     * @param {Context} ctx The ssh2 context object from the authentication event.
     *
     * @return {Key}
     */
    createKey(ctx) {
        var adapter = this.keyAdapter,
            config  = this.keyConfig || {};

        config.dbConnection = this.dbConnection;
        config.username     = ctx.user || ctx.username;

        return new adapter(config);
    }

    /**
     * Authenticates the client.
     *
     * @param {Context} ctx The ssh2 context object from the authentication event.
     */
    authenticate(ctx) {
        if (ctx.method === 'publickey') {
            let key = this.createKey(ctx);

            key.getKey(ctx)
                .then(function() {
                    ctx.accept();
                })
                .catch(function(error) {
                    console.log(error);

                    ctx.reject();
                });
        } else {
            ctx.reject();
        }
    }

    /**
     * Handler for the end event. Only logs out when the client has been
     * disconnected.
     */
    onEnd() {
        console.log('Client disconnected');
    }

    /**
     * Handler for the ready event. This happens after the client has been
     * authenticated. This sets up the event listeners on the SFTPStream.
     */
    onReady() {
        const me = this;

        console.log('Client authenticated!');

        me.client.on('session', function(accept, reject) {
            let session = accept();

            session.on('sftp', function(accept, reject) {
                console.log('Client SFTP session');

                let sftpStream = accept();

                sftpStream
                    .on('OPEN',  me.wrapSFTPStream(sftpStream, 'onOPEN' ))
                    .on('FSTAT', me.wrapSFTPStream(sftpStream, 'onFSTAT'))
                    .on('READ',  me.wrapSFTPStream(sftpStream, 'onREAD' ))
                    .on('CLOSE', me.wrapSFTPStream(sftpStream, 'onCLOSE'));
                });
        });
    }

    /**
     * Method to wrap another method in order to add the SFTPStream as the last
     * argument.
     */
    wrapSFTPStream(sftpStream, fn) {
        const me = this;

        if (typeof fn === 'string') {
            fn = me[fn];
        }

        return function() {
            let args = Array.prototype.slice.call(arguments);

            args.push(sftpStream);

            return fn.apply(me, args);
        };
    }

    /**
     * Handler for the `OPEN` event on the SFTPStream.
     *
     * @param {Number} reqid The request ID.
     * @param {String} filename The filename being requested. Can use the optional
     * {@link #parseIncomingFilename} config.
     * @param {Number} flags The flags associated with the file being opened.
     * @param {Object} attrs Any attributes being passed in the open request.
     * @param {SFTPStream} sftpStream The stream object.
     */
    onOPEN(reqid, filename, flags, attrs, sftpStream) {
        const me = this;

        /*if (me.parseIncomingFilename) {
            filename = me.parseIncomingFilename(filename);
        }*/

        flags = SFTPStream.flagsToString(flags);

        if (flags !== 'r') {
            return sftpStream.status(reqid, STATUS_CODE.FAILURE);
        }

        let adapter = me.createAdapter();

        adapter.open(filename, flags, attrs)
            .then(function(id) {
                let handle = new Buffer(4);

                me.setAdapter(id, adapter);

                handle.writeUInt32BE(id, 0);

                sftpStream.handle(reqid, handle);
            })
            .catch(function(error) {
                sftpStream.status(reqid, STATUS_CODE.FAILURE)
            });
    }

    /**
     * Handler for the `FSTAT` event on the SFTPStream.
     *
     * @param {Number} reqid The request ID.
     * @param {Buffer} handle The handle buffer that has the adapter ID saved to it.
     * @param {SFTPStream} sftpStream The stream object.
     */
    onFSTAT(reqid, handle, sftpStream) {
        let id, adapter;

        if (handle.length !== 4 || !(adapter = this.getAdapter(id = handle.readUInt32BE(0)))) {
            return sftpStream.status(reqid, STATUS_CODE.FAILURE);
        }

        adapter.fstat()
            .then(function(stats) {
                sftpStream.attrs(reqid, stats);
                sftpStream.status(reqid, STATUS_CODE.OK);
            })
            .catch(function() {
                sftpStream.status(reqid, STATUS_CODE.FAILURE);
            });
    }

    /**
     * Handler for the `READ` event on the SFTPStream.
     *
     * @param {Number} reqid The request ID.
     * @param {Buffer} handle The handle buffer that has the adapter ID saved to it.
     * @param {Number} offset The offset location of the file chunk being requested.
     * @param {Number} length The length of the file chunk being requested.
     * @param {SFTPStream} sftpStream The stream object.
     */
    onREAD(reqid, handle, offset, length, sftpStream) {
        let id, adapter;

        if (handle.length !== 4 || !(adapter = this.getAdapter(id = handle.readUInt32BE(0)))) {
            return sftpStream.status(reqid, STATUS_CODE.FAILURE);
        }

        adapter.read(length, offset)
            .then(function(buf) {
                sftpStream.data(reqid, buf);
            })
            .catch(function() {
                sftpStream.status(reqid, STATUS_CODE.FAILURE);
            });
    }

    /**
     * Handler for the `CLOSE` event on the SFTPStream.
     *
     * @param {Number} reqid The request ID.
     * @param {Buffer} handle The handle buffer that has the adapter ID saved to it.
     * @param {SFTPStream} sftpStream The stream object.
     */
    onCLOSE(reqid, handle, sftpStream) {
        let id, adapter;

        if (handle.length !== 4 || !(adapter = this.getAdapter(id = handle.readUInt32BE(0)))) {
            return sftpStream.status(reqid, STATUS_CODE.FAILURE);
        }

        adapter.close()
            .then(function() {
                sftpStream.status(reqid, STATUS_CODE.OK);
            })
            .catch(function() {
                sftpStream.status(reqid, STATUS_CODE.FAILURE);
            });
    }
}

module.exports = Server;
