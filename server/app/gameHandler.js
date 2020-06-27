const {ObjectId} = require('mongodb');
const _ = require('lodash');
const {checkFields} = require('./helpers');

let games = {};

function onAuth(db, req, socket) {
    if (!checkFields(req, ['gameId', 'playerId'])) {
        socket.emit('err', 'Wrong data');
        return;
    }

    db.collection('games').aggregate([
        {
            $match: {
                _id: ObjectId(req.gameId),
                $or: [{x: req.playerId}, {o: req.playerId}]
            }
        }, {
            $lookup: {
                from: 'users',
                localField: 'x',
                foreignField: '_id',
                as: 'x'
            }
        }, {
            $lookup: {
                from: 'users',
                localField: 'o',
                foreignField: '_id',
                as: 'o'
            }
        }, {
            $addFields: {
                x: {$arrayElemAt: ["$x", 0]},
                o: {$arrayElemAt: ["$o", 0]}
            }
        }
    ]).toArray((err, res) => {
        if (err) {
            socket.emit('err', 'DB Error');
            return console.log(err);
        }

        if (res.length < 1) {
            socket.emit('err', 'No such game');
            return console.log(err);
        }
        onPlayerConnect(socket, req, res[0]);
    });
}

function onPlayerConnect(socket, req, res) {
    const side = res.x && res.x._id === req.playerId ? 'x' : 'o';
    const player = {
        playerId: req.playerId,
        socket,
        side
    }

    let game = games[req.gameId];
    if (!game) {
        game = games[req.gameId] = [player];
    } else {
        _.remove(game, p => p.playerId === player.playerId);
        game.push(player);
    }

    game.forEach(p => p.socket.emit('state', {...res, side: p.side}));
}

async function onTurn(db, dbClient, req, socket) {
    if (!checkFields(req, ['cellId'])) {
        return Promise.reject('Wrong data');
    }

    const {cellId} = req;
    const gameData = getGameData(socket);
    if (!gameData)
        return Promise.reject('No such game');

    const {side} = gameData.playerGame;
    const cell = `desk.${cellId}`;
    const res = await db.collection('games').findOneAndUpdate(
        {
            $and: [
                {_id: ObjectId(gameData.gameId)},
                {turn: side},
                {[cell]: {$exists: false}}
            ]
        },
        {
            $set: {
                'turn': side === 'x' ? 'o' : 'x',
                [cell]: side
            }
        },
        {returnOriginal: false}
    );

    if (!res.lastErrorObject.updatedExisting)
        return Promise.reject('Document not found');

    await sendTurn(db, dbClient, gameData.gameId, side, cellId, res.value);
}

async function sendTurn(db, dbClient, gameId, side, cellId, newData) {
    const game = games[gameId];
    if (!game)
        return Promise.reject('Game not found');

    game.forEach(p => p.socket.connected && p.socket.emit('turn', {cellId, side}));

    if (checkWinCondition(newData.desk, cellId)) {
        const side = newData.desk[cellId];
        const session = dbClient.startSession();

        // Must be with 'async'
        await session.withTransaction(async () => {
            // Add score for winner
            await db.collection('users').updateOne(
                {_id: _.find(game, {side}).playerId},
                {$inc: {score: 1}},
                {session}
            );

            // Delete game from DB
            await db.collection('games').deleteOne(
                {_id: ObjectId(gameId)},
                {session}
            );
        });

        delete games[gameId];
        game.forEach(p => p.socket.connected && p.socket.emit('win', {side}));
    }
}

function convertCellIdToPos(cellId) {
    const x = cellId % 3;
    const y = Math.floor(cellId / 3);
    return {x, y};
}

function getDeskAt(desk, x, y) {
    return desk[x + y * 3];
}

function isWinByHorizontalRow(desk, y) {
    const first = getDeskAt(desk, 0, y);
    if (!first)
        return false;

    return first === getDeskAt(desk, 1, y) && first === getDeskAt(desk, 2, y);
}

function isWinByVerticalRow(desk, x) {
    const first = getDeskAt(desk, x, 0);
    if (!first)
        return false;

    return first === getDeskAt(desk, x, 1) && first === getDeskAt(desk, x, 2);
}

function isWinByDiagonal(desk, pos) {
    const center = getDeskAt(desk, 1, 1);
    if (!center)
        return false;

    if (pos.x === pos.y) { // On main diagonal
        return center === getDeskAt(desk, 0, 0) && center === getDeskAt(desk, 2, 2);
    } else if (pos.x === 2 - pos.y) { // On reversed diagonal
        return center === getDeskAt(desk, 0, 2) && center === getDeskAt(desk, 2, 0);
    } else // Not on a diagonal
        return false;
}

function checkWinCondition(desk, changedCellId) {
    const pos = convertCellIdToPos(changedCellId);
    return isWinByHorizontalRow(desk, pos.y) || isWinByVerticalRow(desk, pos.x) || isWinByDiagonal(desk, pos);
}

function onMessage(message, socket) {
    const gameData = getGameData(socket);
    if (!gameData)
        return;

    gameData.game.forEach(p => p.socket.connected && p.side !== gameData.playerGame.side && p.socket.emit('message', message));
}

function onLeave(db, socket) {
    const gameData = getGameData(socket);
    if (!gameData)
        return;

    // If there is no one except of us in the game - delete the game
    if (gameData.game.length === 1) {
        db.collection('games').deleteOne(
            {_id: ObjectId(gameData.gameId)}
        );

        delete games[gameData.gameId];
    }
    else { // There is someone else in the game
        gameData.game.forEach(p => p.socket.connected && p.side !== gameData.playerGame.side && p.socket.emit('leave'));

        db.collection('games').updateOne(
            {_id: ObjectId(gameData.gameId)},
            {$set: {[gameData.playerGame.side]: null}}
        );

        games[gameData.gameId] = gameData.game.filter(p => p.socket !== socket);
    }
}

function getGameData(socket) {
    let playerGame;
    const gameId = _.findKey(games, player => {
        const res = _.find(player, {socket});
        if (res)
            playerGame = res;
        return res;
    });

    if (!gameId)
        return console.log('No such game');

    return {gameId, game: games[gameId], playerGame};
}

module.exports = (io, db, dbClient) => {

    io.on('connection', socket => {
        socket.on('auth', req => {
            onAuth(db, req, socket);
        });

        socket.on('turn', req => {
            onTurn(db, dbClient, req, socket).catch(e => {
                console.log(e);
                socket.emit('err', _.isString(e) ? e : 'DB Error');
            });
        });

        socket.on('leave', () => {
            onLeave(db, socket);
        });

        socket.on('message', message => {
            onMessage(message, socket);
        });
    });
}