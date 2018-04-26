# Real-time-web-project

A web app where users can upload songs and listen to them together.
![preview](https://d.pr/i/gYNytr+)

**Demo:** http://my-sync.herokuapp.com/

## Table of contents
- [Real-time-web-project](#real-time-web-project)
  * [Table of contents](#table-of-contents)
  * [Prerequisites](#prerequisites)
  * [Getting started](#getting-started)
  * [Data life Cycle](#data-life-cycle)
  * [Socket.io](#socketio)
      - [Playing a song](#playing-a-song)
  * [To-do list](#to-do-list)
  * [License](#license)

## Prerequisites
* Git
* Node
* NPM

## Getting started

To install this project do this:

1. Clone and navigate to the project.
2. `npm install`
3. `cp .env.dist .env`
4. Get a Last.fm key from https://www.last.fm/api and put them in the `.env` file.
5. **Production:** `npm start` to compile scss and run the server.  
   **Development:** `gulp watch` to compile scss and `nodemon server.js` to watch for server changes.
6. Check out `localhost:8888` for the app!

## Data life Cycle
![data life cycle](https://d.pr/i/GWeObS+)

## Socket.io
For sending play events to all users [socket.io](https://socket.io/) is used. 

#### Playing a song
1. **Client**  
   When a user clicks on a song this event is fired.

```javascript
socket.emit('userPlayed', playData);
```

2. **playData**  
   The playData object looks like this:

```javascript
// playData will look like this:
const playData = {
    src: "song-1.mp3",
    artist: "Floorplan",
    title: "Tell You No Lie",
    img: "https://lastfm-img2.akamaized.net/i/u/300x300/a2a7c8c4336ddc4b57b9966ef0ed4d4e.png",
    latency: 11
};
```

3. **Server**  
   The server is listening to the userPlayed event and will send a play event with the playData to all users.

```javascript
socket.on('userPlayed', function(playData){
    io.emit('play', playData);
});
```

4. **All clients**  
   After receiving the play event all the clients update the player and play it.

```javascript
socket.on('play', function(playData){
    // This will set the player metadata
    player.setPlayerMeta(playData.artist, playData.title, playData.img);
    // Play the player.
    player.play(playData.src);
});
```

## Uploading a song  
[Formidable](https://www.npmjs.com/package/formidable) is used to upload songs. When submitting a file to `/upload` the file is uploaded to `./src/assets/audio`.  When a song is uploaded the server will scan the audio directory and add them to the songs array.

**MP3 metadata and Last FM**  
Using [music-metadata](https://www.npmjs.com/package/music-metadata) the metadata of the mp3s is passed to the array. With this metadata and Last.fm's [track.getInfo](https://www.last.fm/api/show/track.getInfo) API the objects in the array are enriched with more data such as album arts.

**The songs array will look like this:**

```javascript
[{ title: 'Tell You No Lie',
    artist: 'Floorplan',
    src: 'song-3.mp3',
    listeners: '3225',
    playcount: '9170',
    album: 'Victorious',
    albumImg: 'https://lastfm-img2.akamaized.net/i/u/300x300/a2a7c8c4336ddc4b57b9966ef0ed4d4e.png' },
  { title: 'Discotico Plexico',
    artist: 'Maceo Plex',
    src: 'song-1.mp3',
    listeners: '2',
    playcount: '12' }]

```

## To-do list
* Add spotify API
* Add database
* Make rooms for the users
* Improve design
* Make app assumptive.
* Make file upload real-time.
  ​

## License
None