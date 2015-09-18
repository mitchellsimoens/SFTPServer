'use strict';

const crypto       = require('crypto'),
      ssh2         = require('ssh2'),
      buffersEqual = require('buffer-equal-constant-time'),
      utils        = ssh2.utils

class KeyAdapter {
    /**
     * @param {DatabaseConnection} connection The database connection.
     * @param {String} username The username from the client.
     */
    constructor(config) {
        let name;

        for (name in config) {
            this[name] = config[name];
        }
    }

    /**
     * Gets the key for the user.
     *
     * @param {Context} ctx The ssh2 module context.
     *
     * @return {Promise}
     */
    getKey(ctx) {
        throw 'getKey must be implemented in subclass.';
    }

    /**
     * Authenticates the matching key with the key data passed from the client.
     *
     * @param {Context} ctx The ssh2 module context.
     * @param {String} key The public key data.
     *
     * @return {Boolean}
     */
    authenticateKey(ctx, key) {
        var pubKey = utils.genPublicKey(utils.parseKey(key));

        if (ctx.key.algo === pubKey.fulltype && buffersEqual(ctx.key.data, pubKey.public)) {
            if (ctx.signature) {
                var verifier = crypto.createVerify(ctx.sigAlgo);

                verifier.update(ctx.blob);

                if (verifier.verify(pubKey.publicOrig, ctx.signature, 'binary')) {
                    return true;
                }
            } else {
                // if no signature present, that means the client is just checking
                // the validity of the given public key
                return true;
            }
        }

        return false;
    }
}

module.exports = KeyAdapter;
