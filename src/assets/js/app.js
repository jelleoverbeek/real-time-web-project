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
        latency: [],
        average: 0,
        calcAverage: function() {
            let total = 0;

            this.latency.forEach(function (latency) {
                total += latency
            });

            this.average = total / this.latency.length;

            if(this.latency.length >= 5) {
                this.latency = []
            }
        },
        ping: function() {
            this.startTime = Date.now();
            socket.emit('sendPing');
        },
        pong: function () {
            let latency = Date.now() - this.startTime;
            this.latency.push(latency);
            this.calcAverage();

            return latency;
        },
        init: function () {
            const _this = this;

            setInterval(function() {
                _this.ping()
            }, 2000);

            socket.on('sendPong', function() {
                _this.pong()
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