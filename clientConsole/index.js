require('dotenv').config()
const readline = require('readline')
const mqtt = require('mqtt')
const {
    setRoomAction,
    setUsernameAction,
    resetLocalAction,
    addMessageAction,
    setJoiningAction,
    setPlayingLocalAction,
    setTankLocalAction,
    setTankBoardAction,
    setTurnLocalAction
} = require('./actions/actionsLocal')
const {
    addUserAction,
    removeUserAction,
    resetOnlineAction,
    setPlayingOnlineAction,
    setTankOnlineAction,
    setTurnOnlineAction
} = require('./actions/actionsOnline')

const arguments = process.argv.slice(2)
if (arguments.length !== 1 && !process.env.HOST){
    console.log('You must provide a broker address')
    process.exit(1)
}

const hostAddress = arguments[0] ? arguments[0] : process.env.HOST

const client = mqtt.connect(`mqtt://${hostAddress}`)

client.on('error', error => {
    console.clear()
    console.log(`Can't connect to ${error.address}`)
    client.end()
    process.exit(1)
})

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const topicPrefix = 'game'

const store = require('./store')
const {render} = require('./functions')
const renderWithStore = render(store)

const getDataForPublish = user => ({
    username: user.username,
    playing: user.playing,
    tank: user.tank,
    score: user.score,
    turn: user.turn
})

const askQuestion = async questionString => new Promise(resolve => {
    rl.question(questionString, resolve)
})

const joinRoom = async () => {
    renderWithStore()
    const username = store.getState().reducerLocal.username
    const room = await askQuestion("Type room: ")
    store.dispatch(setRoomAction(room))

    client.subscribe(`${topicPrefix}/+/${room}/#`, () => {
        client.publish(`${topicPrefix}/join/${room}/${username}`, JSON.stringify({user: getDataForPublish(store.getState().reducerLocal)}), () => {
                setTimeout(() => {
                    store.dispatch(setJoiningAction(false))
                }, 1000)
            }
        )
    })
}

const start = async () => {
    renderWithStore()
    store.subscribe(renderWithStore)

    const username = await askQuestion("Type your username: ")
    store.dispatch(setUsernameAction(username))
}
start()

client.on('message', (topic, message) => {
    const topicSplit = topic.split('/')
    const username = store.getState().reducerLocal.username

    if(topicSplit[1] === 'join'){
        const user = topicSplit[3]
        if(user !== username) {
            store.dispatch(addUserAction(JSON.parse(message).user))
            client.publish(topic.replace('join', 'info'), JSON.stringify({user: getDataForPublish(store.getState().reducerLocal)}))
        }

    } else if(topicSplit[1]==='info') {
        const user = topicSplit[3]
        if(user === username) {
            const messageUser = JSON.parse(message).user
            store.dispatch(addUserAction(messageUser))
            if(messageUser.playing) {
                store.dispatch(setTankBoardAction(messageUser.tank.row, messageUser.tank.column, messageUser.username))
            }
        }

    } else if(topicSplit[1]==='leave') {
        const user = topicSplit[3]
        store.dispatch(setTankBoardAction(-1, -1, user))
        store.dispatch(removeUserAction(user))

    } else if(topicSplit[1]==='message') {
        const user = topicSplit[3]
        if(user !== username) {
            store.dispatch(addMessageAction(user, JSON.parse(message).message))
        }
    } else if(topicSplit[1]==='play') {
        const user = topicSplit[3]
        if(user !== username) {
            const messageJson = JSON.parse(message)
            store.dispatch(setPlayingOnlineAction(true, user))
            store.dispatch(setTankOnlineAction(messageJson.tank.row, messageJson.tank.column, messageJson.tank.rotation, user))
            store.dispatch(setTankBoardAction(messageJson.tank.row, messageJson.tank.column, user))
            store.dispatch(setTurnOnlineAction(messageJson.turn, user))
        }
    }
})

rl.on('line', input => {
    const local = store.getState().reducerLocal
    const room = local.room
    const username = local.username

    if(input==='/exit'){
        if(room === ''){
            rl.close()
            client.end()
            console.clear()
            console.log("Stopping client...")
            process.exit()

        } else {
            client.unsubscribe(`${topicPrefix}/+/${room}/#`)
            store.dispatch(resetOnlineAction())
            store.dispatch(resetLocalAction())
            client.publish(`${topicPrefix}/leave/${room}/${username}`, '{}')
        }

    } else if(input==='/join' && room===''){
        joinRoom()

    } else if(input==='/play' && room!=='' && !local.playing) {
        store.dispatch(setPlayingLocalAction(true))

        const getRandomIntInclusive = (min, max) => {
            return Math.floor(Math.random() * (max - min + 1) + min)
        }
        const emptyFields = store.getState().reducerLocal.board
            .map((row, indexRow) =>
                row.map((field, indexColumn) =>
                    ({...field, indexRow, indexColumn})
                )
            ).flat().filter(field => field.tank==='')
        const chosenField = emptyFields[getRandomIntInclusive(0, emptyFields.length-1)]
        const rotation = getRandomIntInclusive(0, 7)
        const turns = store.getState().reducerOnline.filter(user => user.playing).map(user => user.turn)
        const highestTurn = Math.max(-1, ...turns)
        store.dispatch(setTankLocalAction(chosenField.indexRow, chosenField.indexColumn, rotation))
        store.dispatch(setTankBoardAction(chosenField.indexRow, chosenField.indexColumn, username))
        store.dispatch(setTurnLocalAction(highestTurn+1))
        client.publish(`${topicPrefix}/play/${room}/${username}`, JSON.stringify({tank: {row: chosenField.indexRow, column: chosenField.indexColumn, rotation}, turn: highestTurn+1}))

    } else if(input[0]!=='/' && room!==''){
        store.dispatch(addMessageAction(username, input))
        client.publish(`${topicPrefix}/message/${room}/${username}`, JSON.stringify({message: input}))

    } else {
        renderWithStore()
    }
})