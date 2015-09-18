'use strict';

class DatabaseAdapter {
    /**
     * @param {Object} config The database configuration object.
     */
    constructor(config) {
        this.dbConfig   = config;
        this.connection = config;
    }

    get connection() {
        return this._connection;
    }

    set connection(dbConfig) {
        this._connection = this.createConnection(dbConfig);

        return this;
    }

    /**
     * Creates the database connection.
     *
     * @param {Object} dbConfig The database configuration object.
     */
    createConnection(dbConfig) {
        throw 'createConnection needs to be implemented';
    }

    /**
     * Opens the database connection.
     */
    connect() {
        throw 'connect needs to be implemented';
    }

    /**
     * Closes the database connection.
     */
    disconnect() {
        throw 'disconnect needs to be implemented';
    }

    /**
     * Retrieves the keys from the database.
     *
     * @param {String} username The username of the client.
     */
    getKeys(username) {
        throw 'getKey needs to be implemented';
    }
}

module.exports = DatabaseAdapter;
