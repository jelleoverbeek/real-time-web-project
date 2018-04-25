require('dotenv').config();

const express = require('express'),
    app = express(),
    http = require('http').Server(app),
    nunjucks = require('nunjucks'),
    io = require('socket.io')(http),
    mm = require('music-metadata'),
    util = require('util'),
    path = require( 'path' ),
    fetch = require('node-fetch'),
    formidable = require('formidable'),
    bodyParser = require('body-parser'),
    fs = require('fs-extra');

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

let songs = [];
const songDir = "./src/assets/audio";

String.prototype.replaceAll = function(str1, str2, ignore) {
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
};

function pushToSongsArr(file) {
    if (file.indexOf(".mp3") > 0) {
        let songObj;
        let songSrc = songDir + "/" + file;
        let artist = "";
        let title = "";

        mm.parseFile(songSrc, {native: true})
            .then(function (metadata) {
                title = util.inspect(metadata.common.title);
                artist = util.inspect(metadata.common.artist);

                title = title.replaceAll("'", "");
                artist = artist.replaceAll("'", "");

                songObj = {
                    title: title,
                    artist: artist,
                    src: file,
                };

                songs.push(songObj);
                api.getSongData(artist, title, songs.length - 1);
            })
            .catch(function (err) {
                console.error(err.message);
            });
    }
}

function scanDir() {
    songs = [];

    fs.readdir(songDir, function (err, files) {
        if (err) {
            console.error("Could not list the directory.", err);
            process.exit(1);
        }

        files.forEach(function (file, index) {
            pushToSongsArr(file)
        });
    });
}

scanDir();

const api = {
    baseUri: "http://ws.audioscrobbler.com/2.0/",
    key: process.env.KEY,
    getSongData: function (artist, title, songIndex) {
        fetch(this.baseUri + `?method=track.getinfo&api_key=${this.key}&artist=${artist}&track=${title}&format=json`)
            .then(function (response) {
                    if (response.status !== 200) {
                        console.log('Error. Status Code: ' + response.status);
                        return;
                    }
                    response.json().then(function (data) {
                        if(data.track) {
                            songs[songIndex].listeners = data.track.listeners;
                            songs[songIndex].playcount = data.track.playcount;

                            if (data.track.album) {
                                songs[songIndex].album = data.track.album.title;

                                if (data.track.album.image[3]) {
                                    songs[songIndex].albumImg = data.track.album.image[3]["#text"];
                                }
                            }
                        }
                    }).catch(function (err) {
                        console.log('Error', err);
                    });
                }
            )
            .catch(function (err) {
                console.log('Fetch Error :-S', err);
            });
    }
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

    socket.on('userPaused', function(){
        io.emit('pause');
    });
});

app.get('/', function(req, res) {
    res.render('index.html', {
        songs: songs
    })
});

app.get('/upload-form', function(req, res) {
    res.render('upload-form.html', {

    })
});

app.route('/upload').post(function (req, res, next) {
    let form = new formidable.IncomingForm();
    //Formidable uploads to operating systems tmp dir by default
    form.uploadDir = "./src/assets/audio";       //set upload directory
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

        scanDir();
        res.end();
    });
});


http.listen(port, function(){
    console.log('listening on *:' + port);
});