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
    getClientTime: function () {

    },
};

io.on('connection', function(socket){

    io.emit('initConnection', socket.id);

    socket.on('sendPing', function() {
        socket.emit('sendPong');
    });

    socket.on('userInfo', function(userInfo){
        console.log(userInfo);
    });

    socket.on('userTime', function(timestamp){
        console.log(timestamp);
    });

    socket.on('userPlayed', function(playData){
        console.log(playData);
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