SFTP Server
====

Designed to be a simple way to use the [ssh2](https://www.npmjs.com/package/ssh2) module.
Will admit, only doing this as a proof-of-concept and just for fun... because I can.

This SFTP server will allow somoene to download a file via filesystem or database
using ssh public key saved in a database. Using adapters for both the file and key
allows them to be stored wherever, just need an adapter. If you want files stored
in an AWS S3 bucket, create an adapter to retrieve the file. Want to use MongoDB
instead of a SQL server? Create a new database adapter.

All the files in the `lib` directory are coded using ES2015. Since I only have
Node.js 0.12.7 installed, I use babel to transpile to ES5. If you have Node.js
4+ or io.js, you may not need babel.

Install
===

Assuming you have node.js installed (I have 0.12.7 installed), run `npm install`
to install the dependencies.

For database connectivity, create a `db_config.json` file in the root, this file
will be passed to the database adapter. For the mysql module, you can use this
`db_config.json`:

    {
        "database" : "",
        "host"     : "",
        "password" : "",
        "user"     : ""
    }

You need to create a host RSA key. Via CLI, run this command:

    ssh-keygen -t rsa

I save the key in the `keys/host_rsa` file in this project.

For MySQL tables, I use these three:

    CREATE TABLE `user_public_keys` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `username` varchar(200) NOT NULL,
        `name` varchar(25) NOT NULL,
        `key` text NOT NULL,
        `added` datetime NOT NULL,
        PRIMARY KEY (`id`)
    );

    CREATE TABLE `user_files` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `name` VARCHAR(255) NOT NULL,
        `data` LONGTEXT NULL,
        PRIMARY KEY (`id`),
        UNIQUE INDEX `name_UNIQUE` (`name` ASC)
    );

    CREATE TABLE `user_files_stats` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `file_id` INT NOT NULL,
        `uid` INT NOT NULL,
        `gid` INT NOT NULL,
        `mode` INT NOT NULL,
        `size` INT NOT NULL,
        `atime` DATETIME NOT NULL,
        `mtime` DATETIME NOT NULL,
        `ctime` DATETIME NOT NULL,
        PRIMARY KEY (`id`)
    );

TODO
===

 - Upload file
 - Read directory
 - other sftp operations
 - MongoDB db adapter
 - S3 file adapter
 - Filesystem key adapter
 - S3 key adapter
