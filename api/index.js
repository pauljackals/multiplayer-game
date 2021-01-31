require('dotenv').config();
const mqtt = require('mqtt')
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors())
app.use(express.json());

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
    sendChat,
    joinRoom,
    leaveRoom,
    sendRoomMessage,
    play,
    ready,
    endPlayerTurn,
    vote,
    cancel
} = require('../tanks-game/functions')

client.on('message',  async (topic, message) => {
    await messageLogic(client, store, topic, message)
})

app.get('/:username', (req, res) => {
    const username = req.params.username
    const state = storeWithUser(store, username).getState()
    const status = Object.values(state).includes(undefined) ? 404 : 200
    return res.status(status).json(state)
})

app.post('/', (req, res) => {
    const username = req.body.username
    if(typeof username !== 'string' || !/^\w+$/.test(username)) {
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
    if(typeof user !== 'string' || !/^\w+$/.test(user) || typeof message !== 'string' || !message.length) {
        return res.status(422).json({})
    }
    const storeLoaded = storeWithUser(store, username)
    sendChat(client, storeLoaded, user, message, username)
    return res.status(201).json(storeLoaded.getState())
})

app.patch('/:username/join', (req, res) => {
    const username = req.params.username
    const room = req.body.room
    if(typeof room !== 'string' || !/^\w+$/.test(room)) {
        return res.status(422).json({})
    }
    const storeLoaded = storeWithUser(store, username)
    joinRoom(client, storeLoaded, store.getState().reducerLocal, room)
    return res.json(storeLoaded.getState())
})

app.patch('/:username/leave',  (req, res) => {
    const username = req.params.username
    const storeLoaded = storeWithUser(store, username)
    leaveRoom(client, storeLoaded, store.getState().reducerLocal)
    return res.json(storeLoaded.getState())
})

app.post('/:username/message', (req, res) => {
    const username = req.params.username
    const body = req.body
    const message = body.message
    if(typeof message !== 'string' || !message.length) {
        return res.status(422).json({})
    }
    const storeLoaded = storeWithUser(store, username)
    sendRoomMessage(client, storeLoaded, message)
    return res.status(201).json(storeLoaded.getState())
})

app.patch('/:username/play', async (req, res) => {
    const username = req.params.username
    const storeLoaded = storeWithUser(store, username)
    play(client, storeLoaded)
    return res.json(storeLoaded.getState())
})

app.patch('/:username/ready', async (req, res) => {
    const username = req.params.username
    const storeLoaded = storeWithUser(store, username)
    ready(client, storeLoaded)
    return res.json(storeLoaded.getState())
})

app.patch('/:username/end', async (req, res) => {
    const username = req.params.username
    const storeLoaded = storeWithUser(store, username)
    endPlayerTurn(client, storeLoaded)
    return res.json(storeLoaded.getState())
})
app.patch('/:username/vote', async (req, res) => {
    const username = req.params.username
    const agree = req.body.agree
    if(typeof agree !== 'boolean') {
        return res.status(422).json({})
    }
    const storeLoaded = storeWithUser(store, username)
    vote(client, storeLoaded, agree)
    return res.json(storeLoaded.getState())
})
app.patch('/:username/cancel', async (req, res) => {
    const username = req.params.username
    const storeLoaded = storeWithUser(store, username)
    cancel(client, storeLoaded)
    return res.json(storeLoaded.getState())
})