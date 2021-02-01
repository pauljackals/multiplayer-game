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

const reducerExtra = require('./reducers/reducerExtra')
const store = require('../tanks-game/store')({reducerExtra})

const {
    addTokenAction
} = require('./actions/actionsExtra')
const {
    removeNameCheck
} = require('../tanks-game/actions/actionsNameCheck')
const {
    storeWithUser,
    messageLogic,
    sendChat,
    joinRoom,
    leaveRoom,
    sendRoomMessage,
    play,
    ready,
    endPlayerTurn,
    vote,
    cancel,
    canAct,
    move,
    shoot,
    readChat,
    checkName
} = require('../tanks-game/functions')

client.on('message',  async (topic, message) => {
    await messageLogic(client, store, topic, message)
})

const checkToken = req => {
    const authorization = req.headers.authorization
    if (typeof authorization ==='string') {
        const token = req.headers.authorization.replace(/^Bearer /, '')
        if(store.getState().reducerExtra[req.path.split('/')[1]]===token) {
            return 200
        }
        return 403
    }
    return 401
}

const getLocalOnline = storeLoaded => {
    const data = storeLoaded.getState()
    return {
        reducerLocal: data.reducerLocal,
        reducerOnline: data.reducerOnline
    }
}

app.get('/:username', (req, res) => {
    const username = req.params.username
    const storeLoaded = storeWithUser(store, username)
    const status = Object.values(getLocalOnline(storeLoaded)).includes(undefined) ? 404 : 200
    if(status===404) {
        return res.status(status).json({})
    } else {
        const result = checkToken(req)
        if(result===200) {
            return res.status(result).json(getLocalOnline(storeLoaded))
        } else {
            return res.status(result).json({})
        }
    }
})

app.post('/', async (req, res) => {
    const username = req.body.username
    if(typeof username !== 'string' || !/^\w+$/.test(username)) {
        return res.status(422).json({message: 'Name can only contain letters, numbers and _'})
    }
    const id = checkName(client, store, username)
    const interval = setInterval(() => {
        const nameCheck = store.getState().reducerNameCheck[id]
        if(nameCheck && nameCheck.finished) {
            clearInterval(interval)
            store.dispatch(removeNameCheck(id))
            if(nameCheck.free) {
                const token = id.replace(/_/g, '-')
                store.dispatch(addTokenAction(username, token))
                console.log(`[INFO] ${username}: ${token}`)
                const storeLoaded = storeWithUser(store, username)
                res.status(201).json({data: getLocalOnline(storeLoaded), token})
            } else {
                res.status(409).json({message: 'Name already in use'})
            }
        }
    }, 10)
})

app.use((req, res, next) => {
    const result = checkToken(req)
    if(result === 200) {
        return next()
    } else {
        return res.status(result).json({})
    }
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
    return res.status(201).json(getLocalOnline(storeLoaded))
})

app.patch('/:username/join', (req, res) => {
    const username = req.params.username
    const room = req.body.room
    if(typeof room !== 'string' || !/^\w+$/.test(room)) {
        return res.status(422).json({})
    }
    const storeLoaded = storeWithUser(store, username)
    if(storeLoaded.getState().reducerLocal.room.length){
        return res.status(409).json({})
    }
    joinRoom(client, storeLoaded, store.getState().reducerLocal, room)
    return res.json(getLocalOnline(storeLoaded))
})

app.patch('/:username/leave',  (req, res) => {
    const username = req.params.username
    const storeLoaded = storeWithUser(store, username)
    if(!storeLoaded.getState().reducerLocal.room.length){
        return res.status(409).json({})
    }
    leaveRoom(client, storeLoaded, store.getState().reducerLocal)
    return res.json(getLocalOnline(storeLoaded))
})

app.post('/:username/message', (req, res) => {
    const username = req.params.username
    const body = req.body
    const message = body.message
    if(typeof message !== 'string' || !message.length) {
        return res.status(422).json({})
    }
    const storeLoaded = storeWithUser(store, username)
    if(!storeLoaded.getState().reducerLocal.room.length){
        return res.status(409).json({})
    }
    sendRoomMessage(client, storeLoaded, message)
    return res.status(201).json(getLocalOnline(storeLoaded))
})

app.patch('/:username/play',(req, res) => {
    const username = req.params.username
    const storeLoaded = storeWithUser(store, username)
    const state = storeLoaded.getState()
    const local = state.reducerLocal
    const online = state.reducerOnline
    if(!local.playing && (!online.length || !online.find(o => o.turn)) && !local.winner.username.length){
        play(client, storeLoaded)
        return res.json(getLocalOnline(storeLoaded))
    } else {
        return res.status(409).json({})
    }
})

app.patch('/:username/ready',(req, res) => {
    const username = req.params.username
    const storeLoaded = storeWithUser(store, username)
    const state = storeLoaded.getState()
    const local = state.reducerLocal
    const online = state.reducerOnline
    if(local.playing && !local.ready && online.filter(o => o.playing).length) {
        ready(client, storeLoaded)
        return res.json(getLocalOnline(storeLoaded))
    } else {
        return res.status(409).json({})
    }
})

app.patch('/:username/end', (req, res) => {
    const username = req.params.username
    const storeLoaded = storeWithUser(store, username)
    if(storeLoaded.getState().reducerLocal.turn) {
        endPlayerTurn(client, storeLoaded)
        return res.json(getLocalOnline(storeLoaded))
    } else {
        return res.status(409).json({})
    }
})
app.patch('/:username/vote', (req, res) => {
    const username = req.params.username
    const agree = req.body.agree
    if(typeof agree !== 'boolean') {
        return res.status(422).json({})
    }
    const storeLoaded = storeWithUser(store, username)
    const local = storeLoaded.getState().reducerLocal
    if(local.playing && local.cancelUser.length && local.cancelUser!==username && !local.vote){
        vote(client, storeLoaded, agree)
        return res.json(getLocalOnline(storeLoaded))
    } else {
        return res.status(409).json({})
    }
})
app.patch('/:username/cancel', (req, res) => {
    const username = req.params.username
    const storeLoaded = storeWithUser(store, username)
    const local = storeLoaded.getState().reducerLocal
    if(canAct(storeLoaded) && local.tank.actions<3 && !local.cancelUser.length) {
        cancel(client, storeLoaded)
        return res.json(getLocalOnline(storeLoaded))
    } else {
        return res.status(409).json({})
    }
})
app.patch('/:username/move', (req, res) => {
    const username = req.params.username
    const moveType = req.body.move
    if(typeof moveType !== 'string' || !['R', 'L', 'F', 'B'].includes(moveType)) {
        return res.status(422).json({})
    }
    const storeLoaded = storeWithUser(store, username)
    if(canAct(storeLoaded) && move(client, storeLoaded, moveType)) {
        return res.json(getLocalOnline(storeLoaded))
    } else {
        return res.status(409).json({})
    }
})
app.patch('/:username/shoot', (req, res) => {
    const username = req.params.username
    const storeLoaded = storeWithUser(store, username)
    if(canAct(storeLoaded)){
        shoot(client, storeLoaded)
        return res.json(getLocalOnline(storeLoaded))
    } else {
        return res.status(409).json({})
    }
})
app.patch('/:username/read', (req, res) => {
    const username = req.params.username
    const target = req.body.user
    if(typeof target !== 'string' || !/^\w*$/.test(target)) {
        return res.status(422).json({})
    }
    const storeLoaded = storeWithUser(store, username)
    readChat(storeLoaded, target)
    return res.json(getLocalOnline(storeLoaded))
})