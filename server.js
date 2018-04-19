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
    updateInfo: function() {

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

    socket.on('sendPing', function(userInfo) {


        socket.emit('sendPong');
    });

    socket.on('disconnect', function () {
        let index = clients.findClientIndex(socket.id);
        clients.sessions.splice(index, 1);
    });

    socket.on('userTime', function(timestamp){
        console.log(timestamp);
    });

    socket.on('userPlayed', function(playData){
        console.log(playData.time, playData.latency);

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