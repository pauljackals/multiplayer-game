require('dotenv').config()
const readline = require('readline')
const mqtt = require('mqtt')
const {
    setHelpAction,
    setCurrentUserAction
} = require('./actions/actionsExtra')
const reducerExtra = require('./reducers/reducerExtra')

const hostAddress = process.env.HOST

console.clear()
const client = mqtt.connect(`mqtt://${hostAddress}`)

client.on('error', () => {
    console.clear()
    console.log(`Connection error with ${hostAddress}`)
    client.end()
    process.exit(1)
})

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const store = require('../tanks-game/store')({reducerExtra})

const {render} = require('./functions')
const {
    storeWithUser,
    messageLogic,
    createUser,
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
    readChat
} = require('../tanks-game/functions')
const {
    topicChatPrefix
} = require('../tanks-game/prefixes')
const renderWithStore = currentUser => render(storeWithUser(store, currentUser))

const askQuestion = async questionString => new Promise(resolve => {
    rl.question(questionString, resolve)
})

const start = async () => {
    console.clear()
    console.log("'/help' lists the commands")
    console.log()
    const username = await askQuestion("Type your username: ")
    if(/^\w+$/.test(username)) {
        store.dispatch(setCurrentUserAction(username))
        createUser(client, store, username)
        renderWithStore(username)()
    } else {
        start()
    }
}

client.on('connect', () => {
    console.log(`Connected to MQTT broker (${hostAddress})`)
    setTimeout(() => start(), 1000)
})

client.on('message', async (topic, message) => {

    await messageLogic(client, store, topic, message)

    const renderWithStoreLoaded = renderWithStore(store.getState().reducerExtra.currentUser)
    renderWithStoreLoaded()
})

rl.on('line', async input => {
    const storeCurrentUser = store.getState().reducerExtra.currentUser

    if(!storeCurrentUser.length) {
        return
    }

    const storeLoaded = storeWithUser(store, storeCurrentUser)
    const renderWithStoreLoaded = renderWithStore(storeCurrentUser)

    const state = storeLoaded.getState()
    const local = state.reducerLocal
    const online = state.reducerOnline
    const extra = state.reducerExtra
    const room = local.room
    const username = local.username

    if(!extra.help && input==='/help'){
        storeLoaded.dispatch(setHelpAction(true))
        renderWithStoreLoaded()
        return

    } else if(extra.help) {
        if (input==='/exit') {
            storeLoaded.dispatch(setHelpAction(false))
        }
        renderWithStoreLoaded()
        return
    }

    if(/^\/chat \w+$/.test(input)){
        const target = input.split(' ')[1]
        if(target!==username) {
            readChat(storeLoaded, target)
        }
        renderWithStoreLoaded()
        return
    } else if (local.currentChat.length) {
        if (input === '/exit') {
            readChat(storeLoaded, '')

        } else if (input.length && input[0] !== '/') {
            sendChat(client, storeLoaded, local.currentChat, input, username)
        }
        renderWithStoreLoaded()
        return
    }

    if(!room.length){
        if(input==='/exit'){
            rl.close()
            client.unsubscribe(`${topicChatPrefix}/${username}/#`)
            client.end()
            console.clear()
            console.log("Stopping client...")
            process.exit()

        } else if(/^\/join \w+$/.test(input)) {
            const room = input.split(' ')[1]
            joinRoom(client, storeLoaded, store.getState().reducerLocal, room)
        }
    } else if(room.length) {
        if(input==='/exit'){
            leaveRoom(client, storeLoaded, store.getState().reducerLocal)

        }  else if(input==='/play' && !local.playing && (!online.length || !online.find(o => o.turn)) && !local.winner.username.length) {
            play(client, storeLoaded)

        } else if (input==='/ready' && local.playing && !local.ready && online.filter(o => o.playing).length) {
            ready(client, storeLoaded)

        } else if(input==='/end' && local.turn){
            endPlayerTurn(client, storeLoaded)

        } else if(canAct(storeLoaded) && ['/left', '/right', '/back', '/forward'].includes(input)){
            const getMoveType = () => {
                if(input==='/left') {
                    return 'L'
                } else if(input==='/right') {
                    return 'R'
                }else if (input==='/forward') {
                    return 'F'
                } else {
                    return 'B'
                }
            }
            const moveType = getMoveType()
            move(client, storeLoaded, moveType)

        } else if (canAct(storeLoaded) && input==='/shoot') {
            shoot(client, storeLoaded)

        } else if(canAct(storeLoaded) && local.tank.actions<3 && !local.cancelUser.length && input==='/cancel'){
            cancel(client, storeLoaded)

        } else if(local.playing && local.cancelUser.length && local.cancelUser!==username && !local.vote && (input==='/yes' || input==='/no')){
            vote(client, storeLoaded, input==='/yes')

        } else if(input.length && input[0]!=='/'){
            sendRoomMessage(client, storeLoaded, input)
        }
    }
    renderWithStoreLoaded()
})