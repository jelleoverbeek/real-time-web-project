require('dotenv').config();

const express = require('express');
const app = express();
const http = require('http').Server(app);
const nunjucks = require('nunjucks');
const io = require('socket.io')(http);

let port = process.env.PORT || 8888;

nunjucks.configure('src/views', {
    autoescape: true,
    express: app,
    watch: true
});

app.use(express.static(__dirname + '/src/assets'));

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

    socket.on('userPaused', function(){
        io.emit('pause');
    });
});

app.get('/', function(req, res) {
    res.render('index.html', {

    })
});

app.get('/new-session', function(req, res) {
    res.render('session.html', {
        data: {
            sessionId: "1ABCA"
        }
    })
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});