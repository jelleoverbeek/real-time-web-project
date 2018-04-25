require('dotenv').config();

const express = require('express'),
    app = express(),
    http = require('http').Server(app),
    nunjucks = require('nunjucks'),
    io = require('socket.io')(http),
    formidable = require('formidable'),
    bodyParser = require('body-parser'),
    fs =require('fs-extra');

let port = process.env.PORT || 8888;

nunjucks.configure('src/views', {
    autoescape: true,
    express: app,
    watch: true
});

app.use(express.static(__dirname + '/src/assets'));

/* ==========================================================
 bodyParser() required to allow Express to see the uploaded files
============================================================ */
app.use(bodyParser({defer: true}));

const times = {
    getServerTime: function () {
        let timestamp = new Date();

        timestamp = timestamp.getTime();
        console.log(timestamp);

        return timestamp;
    },
};

const clients = {
    sessions: [],
    findClientIndex: function(id) {
        let clientIndex;

        this.sessions.forEach(function (session, index) {
            if (id === session.id) {
                clientIndex = index;
            }
        });

        return clientIndex;
    }
};

io.on('connection', function(socket){

    io.emit('initConnection', socket.id);
    socket.sessionIndex = clients.findClientIndex(socket.id);

    clients.sessions.push({
        id: socket.id,
    });

    socket.on('sendPing', function(userInfo) {
        socket.emit('sendPong');
    });

    socket.on('disconnect', function () {
        clients.sessions.splice(socket.sessionIndex, 1);
    });

    socket.on('userPlayed', function(playData){
        io.emit('play', playData);
    });

    socket.on('uploaded', function(playData){
        io.emit('play', playData);
    });

    socket.on('userPaused', function(){
        io.emit('pause');
    });
});

app.get('/', function(req, res) {
    res.render('index.html', {

    })
});

app.get('/upload-form', function(req, res) {
    res.render('upload-form.html', {

    })
});

app.route('/upload').post(function (req, res, next) {
    let form = new formidable.IncomingForm();
    //Formidable uploads to operating systems tmp dir by default
    form.uploadDir = "./uploads";       //set upload directory
    form.keepExtensions = true;     //keep file extension

    form.parse(req, function(err, fields, files) {
        res.writeHead(200, {'content-type': 'text/plain'});
        res.write('received upload:\n\n');
        console.log("form.bytesReceived");
        //TESTING
        console.log("file size: "+JSON.stringify(files.fileUploaded.size));
        console.log("file path: "+JSON.stringify(files.fileUploaded.path));
        console.log("file name: "+JSON.stringify(files.fileUploaded.name));
        console.log("file type: "+JSON.stringify(files.fileUploaded.type));
        console.log("astModifiedDate: "+JSON.stringify(files.fileUploaded.lastModifiedDate));

        //Formidable changes the name of the uploaded file
        //Rename the file to its original name
        fs.rename(files.fileUploaded.path, './uploads/'+files.fileUploaded.name, function(err) {
            if (err)
                throw err;
            console.log('renamed complete');
        });
        res.end();
    });
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});