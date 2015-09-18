
const fs          = require('fs'),
      FileAdapter = require('./FileAdapter');

class Database extends FileAdapter {
    static getFilenameParser() {
        return this._filenameParser;
    }

    static setFilenameParser(fn) {
        this._filenameParser = fn;
    }

    open(filename, flags, attrs) {
        const me         = this,
              nameParser = Database.getFilenameParser();

        me.filename = filename;
        me.flags    = flags;

        if (nameParser) {
            filename = nameParser(filename);
        }

        return new Promise(function(resolve, reject) {
            me.dbConnection.getFileId(filename)
                .then(function(id) {
                    resolve(me.id = id);
                })
                .catch(function(e) {
                    reject(e);
                });
        });
    }

    fstat() {
        const connection = this.dbConnection,
              fd         = this.id;

        return new Promise(function(resolve, reject) {
            connection.getFileStats(fd)
                .then(function(stats) {
                    resolve(stats);
                })
                .catch(function(e) {
                    reject(e);
                });
        });
    }

    read(length, offset) {
        const connection = this.dbConnection,
              buf        = new Buffer(length),
              fd         = this.id;

        return new Promise(function(resolve, reject) {
            connection.getFile(fd)
                .then(function(data) {
                    buf.write(data);

                    resolve(buf);
                })
                .catch(function(e) {
                    reject(e);
                });
        });
    }

    close() {
        return new Promise(function(resolve, reject) {
            resolve();
        });
    }
}

module.exports = Database;
