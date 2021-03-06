
const fs          = require('fs'),
      FileAdapter = require('./FileAdapter');

class Filesystem extends FileAdapter {
    get type() {
        return 'filesystem';
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
            fs.open(filename, flags, function(error, fd) {
                if (error) {
                    reject(error);
                } else {
                    resolve(me.id = fd);
                }
            });
        });
    }

    fstat() {
        const fd = this.id;

        return new Promise(function(resolve, reject) {
            fs.fstat(fd, function(error, stats) {
                if (error) {
                    reject(error);
                } else {
                    resolve(stats);
                }
            });
        });
    }

    read(length, offset) {
        const buf = new Buffer(length),
              fd  = this.id;

        return new Promise(function(resolve, reject) {
            fs.read(fd, buf, 0, length, offset, function(error) {
                if (error) {
                    reject(error);
                } else {
                    resolve(buf);
                }
            });
        });
    }

    close() {
        const me = this,
              fd = me.id;

        return new Promise(function(resolve, reject) {
            fs.close(fd, function(error) {
                me.destroy();

                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = Filesystem;
