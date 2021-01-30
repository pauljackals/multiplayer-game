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
    messageLogic,
    storeWithUser,
    createUser,
    sendChat
} = require('../tanks-game/functions')

client.on('message',  (topic, message) => {
    messageLogic(client, store, topic, message)
})

app.get('/:username', (req, res) => {
    const username = req.params.username
    const state = storeWithUser(store, username).getState()
    const status = Object.values(state).includes(undefined) ? 404 : 200
    return res.status(status).json(state)
})

app.post('/', (req, res) => {
    const username = req.body.username
    if(username===undefined || !/^\w+$/.test(username)) {
        return res.status(422).json({})
    }
    createUser(client, store, username)
    return res.status(201).json(storeWithUser(store, username).getState())
})

app.post('/:username/chat', (req, res) => {
    const username = req.params.username
    const body = req.body
    const message = body.message
    const user = body.user
    if(user===undefined || !/^\w+$/.test(user) || message===undefined || !message.length) {
        return res.status(422).json({})
    }
    const storeLoaded = storeWithUser(store, username)
    sendChat(client, storeLoaded, username, user, message, username)
    return res.status(201).json(storeLoaded.getState())
})