(function () {
    const socket = io();

    const client = {
        id: "",
        userPlayed: function() {
            const playData = {
                songSrc: player.element.src,
                time: Date.now(),
                latency: latency.average
            };

            socket.emit('userPlayed', playData);
        },
        userPaused: function() {
            socket.emit('userPaused');
        },
        init: function () {
            document.querySelector("#play").addEventListener("click", (ev) => {
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

            const userInfo = {
                id: client.id,
                latency: this.average
            };

            socket.emit('sendPing', userInfo);
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
            }, 1000);

            socket.on('sendPong', function() {
                _this.pong()
            });
        }
    };

    const connection = {
        init: function () {
            socket.on('initConnection', function(userId){
                client.id = userId;
            });

            socket.on('play', function(latency){

                console.log(latency);

                setTimeout(function(){

                    player.play();

                }, latency);

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