const express = require('express');
const app = express();
const http = require('http').Server(app);
const nunjucks = require('nunjucks');
const io = require('socket.io')(http);

// set the port of our application
// process.env.PORT lets the port be set by Heroku
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
    updateLatency: function(index, latency) {
        this.sessions[index].latency = latency;
    },
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

    clients.sessions.push({
        id: socket.id,
        latency: 0
    });

    socket.sessionIndex = clients.findClientIndex(socket.id);

    socket.on('sendPing', function(userInfo) {
        clients.updateLatency(socket.sessionIndex, userInfo.latency);
        socket.emit('sendPong');
    });

    socket.on('disconnect', function () {
        clients.sessions.splice(socket.sessionIndex, 1);
    });

    socket.on('userPlayed', function(playData){
        console.log(playData);
        io.emit('sendTimestamps');
    });

    socket.on('getTimestamps', function(timestamp) {
        let latency = timestamp - clients.sessions[socket.sessionIndex].latency;

        const playData = {
            latency: latency
        };

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

http.listen(port, function(){
    console.log('listening on *:' + port);
});