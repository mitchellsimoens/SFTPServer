'use strict';

class FileAdapter {
    constructor(dbConnection) {
        this.dbConnection = dbConnection;
    }
    /**
     * Opens a file for operation (read, write). This will save the file
     * descriptor in the {@link #id} property.
     *
     * @param {String} filename The filename of the file being opened.
     * @param {Number} flag The flag of the open, can be `r` or `w` or any others.
     * @param {Object} attrs Any attributes of the open request.
     */
    open(filename, flag, attrs) {
        throw 'open needs to be implemented';
    }

    /**
     * Gets the file stats (file size, uid, etc).
     */
    fstat() {
        throw 'fstat needs to be implemented';
    }

    /**
     * Reads a chunk of the file based on the length and offset of the read request.
     *
     * @param {Number} length The length of the chunk to be read.
     * @param {Number} offset The offset of the chunk, the start.
     */
    read(length, offset) {
        throw 'read needs to be implemented';
    }

    /**
     * Close the file. Should also call {@link #destroy} to clean up properties.
     */
    close() {
        throw 'read needs to be implemented';
    }

    /**
     * Clean up after a destroy
     */
    destroy() {
        this.id = this.dbConnection = null;
    }
}

module.exports = FileAdapter;
