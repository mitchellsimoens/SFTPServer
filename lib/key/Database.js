'use strict';

const KeyAdapter = require('./KeyAdapter');

class Database extends KeyAdapter {
    getKey(ctx) {
        let me = this;

        return me.getKeys()
            .then(function(keys) {
                return me.getMatchingKey(ctx, keys);
            });
    }

    /**
     * Retrieve the keys from the {@link #connection} for the {@link #username}.
     *
     * @return {Promise}
     */
    getKeys() {
        const connection = this.connection,
              username   = this.username;

        return new Promise(function(resolve, reject) {
            connection.getKeys(username)
                .then(function(keys) {
                    resolve(keys);
                })
                .catch(function(e) {
                    reject(e);
                });
        });
    }

    /**
     * Find a matching key from an array of keys returned from {@link #getKeys}.
     *
     * @param {Context} ctx The ssh2 module context.
     * @param {Object[]} keys The array of object keys to find a match. Each
     * object must have a `key` property with the public key data.
     *
     * @return {Promise}
     */
    getMatchingKey(ctx, keys) {
        const me = this;

        return new Promise(function(resolve, reject) {
            if (keys && keys.length) {
                var i      = 0,
                    length = keys.length,
                    key, match;

                for (; i < length; i++) {
                    key = keys[i].key;

                    if (me.authenticateKey(ctx, key)) {
                        match = key;

                        break;
                    }
                }

                if (match) {
                    resolve(match);
                } else {
                    reject(new Error('Public key authentcation failed.'));
                }
            } else {
                reject(new Error('No public keys to authenticate with.'));
            }
        });
    }
}

module.exports = Database;
