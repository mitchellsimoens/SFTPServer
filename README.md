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
