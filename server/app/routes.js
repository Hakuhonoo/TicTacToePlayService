const _ = require('lodash');
const {ObjectId} = require('mongodb');
const {checkFields} = require('./helpers');

function sendError(res, msg) {
    res.status(500).send(msg);
}

module.exports = (app, db) => {

    app.post('/signIn', (req, res) => {
        const data = checkFields(req.body, ['_id', 'name']);
        if (!data) {
            sendError(res, 'Wrong data');
            return;
        }

        // Insert new record in users collection if not exists yet
        db.collection('users').findOneAndUpdate(
            {_id: data._id},
            {$setOnInsert: {..._.omit(data, '_id'), score: 0}},
            {upsert: true, returnOriginal: false}
        ).then(data => {
            res.send(data.value);
        }).catch(e => {
            console.log(e.errmsg);
            sendError(res, 'DB error');
        });
    });

    app.get('/fetchGames', (req, res) => {
        db.collection('games').aggregate([{
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
        }]).toArray((err, data) => {
            if (err)
                return console.log(err);

            res.send(data);
        });
    });

    app.post('/makeGame', (req, res) => {
        const data = checkFields(req.body, ['name', 'turn', 'x', 'o'], ['description']);
        if (!data) {
            sendError(res, 'Wrong data');
            return;
        }

        db.collection('games').insertOne({...data, desk: {}}).then(result => {
            res.send({...data, _id: result.insertedId});
        }).catch(e => {
            console.log(e.errmsg);
            sendError(res, 'DB error');
        });
    });

    app.post('/joinGame', (req, res) => {
        const data = checkFields(req.body, ['playerId', 'gameId', 'side']);
        if (!data) {
            sendError(res, 'Wrong data');
            return;
        }

        db.collection('games').findOneAndUpdate(
            {
                _id: ObjectId(data.gameId),
                [data.side]: null
            },
            {
                $set: {
                    [data.side]: data.playerId
                }
            }
        ).then(e => {
            if (e.lastErrorObject.updatedExisting)
                res.send(true);
            else
                sendError(res, 'Document not found');
        }).catch(e => {
            console.log(e.errmsg);
            sendError(res, 'DB error');
        });
    });


};