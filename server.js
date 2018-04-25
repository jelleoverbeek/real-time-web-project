require('dotenv').config();

const express = require('express'),
    app = express(),
    http = require('http').Server(app),
    nunjucks = require('nunjucks'),
    io = require('socket.io')(http),
    mm = require('music-metadata'),
    util = require('util'),
    fs = require( 'fs' ),
    path = require( 'path' ),
    fetch = require('node-fetch');

let port = process.env.PORT || 8888;

nunjucks.configure('src/views', {
    autoescape: true,
    express: app,
    watch: true
});

app.use(express.static(__dirname + '/src/assets'));

const songs = [];
const songDir = "./src/assets/audio";

String.prototype.replaceAll = function(str1, str2, ignore)
{
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}

function createSongsArr() {
    fs.readdir(songDir, function (err, files) {
        if (err) {
            console.error("Could not list the directory.", err);
            process.exit(1);
        }

        files.forEach(function (file, index) {
            let songObj;

            if (file.indexOf(".mp3") > 0) {
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
                            src: file
                        };

                        songs.push(songObj);
                    })
                    .catch(function (err) {
                        console.error(err.message);
                    });
            }
        });
    });
}

createSongsArr();

const api = {
    baseUri: "http://ws.audioscrobbler.com/2.0/",
    key: process.env.KEY,
    getSongData: function (artist, title) {
        let songData;

        fetch(this.baseUri + `?method=track.getinfo&api_key=${this.key}&artist=${artist}&track=${title}&format=json`)
            .then(
                function(response) {
                    if (response.status !== 200) {
                        console.log('Looks like there was a problem. Status Code: ' +
                            response.status);
                        return;
                    }

                    // Examine the text in the response
                    response.json().then(function(data) {
                        console.log(data);
                    });
                }
            )
            .catch(function(err) {
                console.log('Fetch Error :-S', err);
            });
    }
};

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

        console.log(playData);

        api.getSongData(playData.artist, playData.title);

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

http.listen(port, function(){
    console.log('listening on *:' + port);
});