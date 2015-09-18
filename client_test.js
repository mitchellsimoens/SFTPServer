var Client = require('ssh2').Client,
    conn   = new Client();

conn.on('ready', function() {
    console.log('Client :: ready');

    conn.sftp(function(error, sftp) {
        if (error) {
            throw error;
        }

        sftp.fastGet(
            'mitchellsimoens/awesomeness',
            __dirname + '/test.txt',
            {},
            function() {
                conn.end();
            }
        );
    });
}).connect({
    //debug      : console.log,
    host       : '127.0.0.1',
    port       : 3333,
    username   : 'mitchellsimoens@gmail.com',
    privateKey : require('fs').readFileSync('/Users/mitchellsimoens/.ssh/id_rsa')
});
