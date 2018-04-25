(function () {
    const socket = io();

    const client = {
        id: "",
        userPlayed: function(playData) {
            socket.emit('userPlayed', playData);
        },
        userPaused: function() {
            socket.emit('userPaused');
        },
        init: function () {
            const _this = this;
            let playBtns = document.querySelectorAll(".play-btn");

            playBtns.forEach(function (btn) {
                btn.addEventListener("click", function (ev) {

                    console.log(this.dataset.albumart);

                    const playData = {
                        src: this.dataset.src,
                        artist: this.dataset.artist,
                        title: this.dataset.title,
                        img: this.dataset.albumart,
                        latency: latency.average
                    };

                    _this.userPlayed(playData);
                })
            });
        }
    };

    const player = {
        element: document.querySelector("audio"),
        playerImg: document.querySelector("#player-img"),
        playerTitle: document.querySelector("#player-title"),
        isPlaying: false,
        setPlayerMeta: function(artist, song, src) {
            if(src !== null) {
                this.playerImg.src = src;
            } else {
                this.playerImg.src = "img/albumart.svg"
            }
            this.playerTitle.innerHTML = artist + "-" + song;
        },
        play: function(src) {
            this.element.src = "/audio/" + src;
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

            socket.on('play', function(playData){
                player.setPlayerMeta(playData.artist, playData.title, playData.img);

                setTimeout(function(){
                    player.play(playData.src);
                }, playData.latency);
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