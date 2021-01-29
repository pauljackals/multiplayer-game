require('dotenv').config();
const mqtt = require('mqtt')
const express = require('express');
const cors = require('cors');
const app = express();
// const users = require('./routes/users');

app.use(cors())
app.use(express.json());

// app.use('/users', users);

const port = process.env.PORT
const hostAddress = process.env.HOST

const client = mqtt.connect(`mqtt://${hostAddress}`)

client.on('connect', () => {
    console.log(`Connected to MQTT broker (${hostAddress})`)
    app.listen(port, () => {
        console.log(`API server listening at http://localhost:${port}`);
    });
})
client.on('error', () => {
    console.log(`Connection error with ${hostAddress}`)
    client.end()
    process.exit(1)
})

const store = require('../tanks-game/store')()

const {
    setUsernameAction,
    addTopicsAction
} = require('../tanks-game/actions/actionsLocal')
const {
    messageLogic,
    storeWithUser
} = require('../tanks-game/functions')
const {
    topicChatPrefix
} = require('../tanks-game/prefixes')

client.on('message',  (topic, message) => {
    messageLogic(client, store, topic, message)
})

app.get('/:username', (req, res) => {
    const username = req.params.username
    const state = storeWithUser(store, username).getState()
    if(Object.values(state).includes(undefined)) {
        return res.status(404).json({})

    } else {
        return res.json(state)
    }
})
app.post('/', (req, res) => {
    const username = req.body.username
    store.dispatch(setUsernameAction(username))
    const storeUser = storeWithUser(store, username)
    const topic = `${topicChatPrefix}/${username}/#`
    client.subscribe(topic)
    storeUser.dispatch(addTopicsAction([topic]))
    return res.json(storeUser.getState())
})