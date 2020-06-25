const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./app/routes');
const gameHandler = require('./app/gameHandler');
const config = require('./config/config');
const MongoClient = require('mongodb').MongoClient;
const io = require('socket.io')(config.wsPort);

io.set('transports', ['websocket']);

const app = express();
app.use(bodyParser.json());
app.use(cors({
    origin: config.clientUrl,
    optionsSuccessStatus: 200,
    credentials: true
}));

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

MongoClient.connect(config.dbUrl, {useUnifiedTopology: true}, (error, client) => {
    if (error)
        return console.log(error)

    const db = client.db('TicTacToe');
    routes(app, db);
    gameHandler(io, db, client);

    // Handles any requests that don't match the ones above
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname + '../client/build/index.html'));
    });

    app.listen(config.serverPort, () => {
        console.log('Listening on ' + config.serverPort + ' and ' + config.wsPort);
    });
});