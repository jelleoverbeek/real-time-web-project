(function () {
    const socket = io();

    const client = {
        id: "",
        userPlayed: function() {
            const playData = {
                songSrc: player.element.src,
                time: Date.now()
            };

            socket.emit('userPlayed', playData);
        },
        userPaused: function() {
            socket.emit('userPaused');
        },
        init: function () {
            document.querySelector(".play").addEventListener("click", (ev) => {
                if(player.isPlaying) {
                    this.userPaused();
                    console.log('pause');
                } else {
                    this.userPlayed();
                    console.log('play');
                }
            })
        }
    };

    const player = {
        element: document.querySelector("audio"),
        isPlaying: false,
        play: function(song) {
            this.element.play();
            this.isPlaying = true;
        },
        pause: function() {
            this.element.pause();
            this.isPlaying = false;
        },
    };

    const latency = {
        startTime: 0,
        latency: 0,
        init: function () {
            setInterval(function() {
                this.startTime = Date.now();
                socket.emit('sendPing');
            }, 1000);

            socket.on('sendPong', function() {
                this.latency = Date.now() - startTime;
                console.log(this.latency);
            });
        }
    };

    const connection = {
        init: function () {
            socket.on('initConnection', function(userId){
                client.id = userId;

                const userInfo = {
                    id: userId,
                    time: Date.now()
                };

                socket.emit('userInfo', userInfo);
            });

            socket.on('play', function(song){
                player.play(song);
            });

            socket.on('pause', function(song){
                player.pause(song);
            });
        }
    };

    const app = {
        init: function () {
            connection.init();
            latency.init();
            client.init();
        }
    };

    app.init();
})();