'use strict';

const mysql           = require('mysql'),
      DatabaseAdapter = require('./DatabaseAdapter');

/**
 * Sample key table:
 *
 *     CREATE TABLE `user_public_keys` (
 *         `id` int(11) NOT NULL AUTO_INCREMENT,
 *         `username` varchar(200) NOT NULL,
 *         `name` varchar(25) NOT NULL,
 *         `key` text NOT NULL,
 *         `added` datetime NOT NULL,
 *         PRIMARY KEY (`id`)
 *     );
 *
 * Sample files table (data could be blob instead, text for simple example):
 *
 *     CREATE TABLE `user_files` (
 *         `id` INT NOT NULL AUTO_INCREMENT,
 *         `name` VARCHAR(255) NOT NULL,
 *         `data` LONGTEXT NULL,
 *         PRIMARY KEY (`id`),
 *         UNIQUE INDEX `name_UNIQUE` (`name` ASC)
 *     );
 *
 * Sample file attributes table:
 *
 *     CREATE TABLE `user_files_stats` (
 *         `id` INT NOT NULL AUTO_INCREMENT,
 *         `file_id` INT NOT NULL,
 *         `uid` INT NOT NULL,
 *         `gid` INT NOT NULL,
 *         `mode` INT NOT NULL,
 *         `size` INT NOT NULL,
 *         `atime` DATETIME NOT NULL,
 *         `mtime` DATETIME NOT NULL,
 *         `ctime` DATETIME NOT NULL,
 *         PRIMARY KEY (`id`)
 *     );
 */

class MySQL extends DatabaseAdapter {
    createConnection(dbConfig) {
        if (dbConfig.multipleStatements !== false) {
            dbConfig.multipleStatements = true;
        }

        return mysql.createConnection(dbConfig);
    }

    connect() {
        this.connection.connect();

        console.log('Connected to MySQL');
    }

    disconnect() {
        this.connection.end();

        console.log('\nDisconnected from MySQL');
    }

    getKeys(username) {
        const connection = this.connection;

        return new Promise(function(resolve, reject) {
            connection.query(
                'SELECT `key` FROM user_public_keys WHERE username = ?;',
                [username],
                function(error, keys) {
                    if (error) {
                        reject(error);
                    } else if (keys.length) {
                        resolve(keys);
                    } else {
                        reject(new Error('No public keys found for that user.'));
                    }
                }
            );
        });
    }

    getFileId(filename) {
        const connection = this.connection;

        return new Promise(function(resolve, reject) {
            connection.query(
                'SELECT id FROM user_files WHERE name = ? LIMIT 1;',
                [filename],
                function(error, files) {
                    if (error) {
                        reject(error);
                    } else if (files.length) {
                        resolve(files[0].id);
                    } else {
                        reject(new Error('File not found.'));
                    }
                }
            );
        });
    }

    getFileStats(id) {
        const connection = this.connection;

        return new Promise(function(resolve, reject) {
            connection.query(
                'SELECT uid,gid,mode,size,atime,mtime,ctime FROM user_files_stats WHERE file_id = ? LIMIT 1;',
                [id],
                function(error, stats) {
                    if (error) {
                        reject(error);
                    } else if (stats.length) {
                        resolve(stats[0]);
                    } else {
                        reject(new Error('Could not get stats for the file.'));
                    }
                }
            );
        });
    }

    getFile(id) {
        const connection = this.connection;

        return new Promise(function(resolve, reject) {
            connection.query(
                'SELECT data FROM user_files WHERE id = ? LIMIT 1;',
                [id],
                function(error, files) {
                    if (error) {
                        reject(error);
                    } else if (files.length) {
                        resolve(files[0].data);
                    } else {
                        reject(new Error('File not found.'));
                    }
                }
            );
        });
    }
}

module.exports = MySQL;
