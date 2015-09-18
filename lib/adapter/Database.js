
const fs          = require('fs'),
      FileAdapter = require('./FileAdapter');

class Database extends FileAdapter {
    get type() {
        return 'database';
    }

    open(filename, flags, attrs) {
        const me         = this,
              nameParser = me.filenameParser;

        me.filename = filename;
        me.flags    = flags;

        if (nameParser) {
            filename = nameParser.call(me, filename);
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
