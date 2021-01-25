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
    // setTurnLocalAction,
    setPreviousNextLocalAction,
    setFirstLocalAction,
    setReadyLocalAction
} = require('./actions/actionsLocal')
const {
    addUserAction,
    removeUserAction,
    resetOnlineAction,
    setPlayingOnlineAction,
    setTankOnlineAction,
    // setTurnOnlineAction,
    setFirstOnlineAction,
    setPreviousNextOnlineAction,
    setReadyOnlineAction
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
    // turn: user.turn,
    next: user.next,
    previous: user.previous,
    first: user.first,
    ready: user.ready
})

const askQuestion = async questionString => new Promise(resolve => {
    rl.question(questionString, resolve)
})

const joinRoom = async () => {
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
    console.clear()

    const username = await askQuestion("Type your username: ")
    store.dispatch(setUsernameAction(username))
}
start().then(() => renderWithStore())

client.on('message', (topic, message) => {
    const topicSplit = topic.split('/')
    const state = store.getState()
    const local = state.reducerLocal
    const online = state.reducerOnline
    const localUsername = local.username
    const messageUser = topicSplit[3]

    if(topicSplit[1] === 'join'){
        if(messageUser !== localUsername) {
            store.dispatch(addUserAction(JSON.parse(message).user))
            client.publish(topic.replace('join', 'info'), JSON.stringify({user: getDataForPublish(store.getState().reducerLocal)}))
        }

    } else if(topicSplit[1]==='info') {
        if(messageUser === localUsername) {
            const messageUser = JSON.parse(message).user
            store.dispatch(addUserAction(messageUser))
            if(messageUser.playing) {
                store.dispatch(setTankBoardAction(messageUser.tank.row, messageUser.tank.column, messageUser.username))
            }
        }

    } else if(topicSplit[1]==='leave') {
        const userObject = online.find(userOnline => userOnline.username===messageUser)
        if(userObject && userObject.playing){
            store.dispatch(setTankBoardAction(-1, -1, messageUser))
            const previous = userObject.previous
            const next = userObject.next
            const properFunctionPrevious = previous===localUsername ? setPreviousNextLocalAction : setPreviousNextOnlineAction
            const properFunctionNext = next===localUsername ? setPreviousNextLocalAction : setPreviousNextOnlineAction
            if(next===previous){
                if(next!==messageUser){
                    store.dispatch(properFunctionNext(next, next, next))
                }
            } else {
                store.dispatch(properFunctionPrevious(undefined, next, previous))
                store.dispatch(properFunctionNext(previous, undefined, next))
            }
            if(userObject.first && next!==messageUser) {
                const properFunctionFirst = next===localUsername ? setFirstLocalAction : setFirstOnlineAction
                store.dispatch(properFunctionFirst(true, next))
            }
        }
        store.dispatch(removeUserAction(messageUser))

    } else if(topicSplit[1]==='message') {
        if(messageUser !== localUsername) {
            store.dispatch(addMessageAction(messageUser, JSON.parse(message).message))
        }
    } else if(topicSplit[1]==='play') {
        if(messageUser !== localUsername) {
            const messageJson = JSON.parse(message)
            store.dispatch(setPlayingOnlineAction(true, messageUser))
            store.dispatch(setTankOnlineAction(messageJson.tank.row, messageJson.tank.column, messageJson.tank.rotation, messageUser))
            store.dispatch(setTankBoardAction(messageJson.tank.row, messageJson.tank.column, messageUser))
            // store.dispatch(setTurnOnlineAction(messageJson.turn, user))
            store.dispatch(setFirstOnlineAction(messageJson.first, messageUser))
            store.dispatch(setPreviousNextOnlineAction(messageJson.previous, messageJson.next, messageUser))
            if(messageJson.next!==messageUser && messageJson.previous!==messageUser){
                const properFunctionPrevious = messageJson.previous===localUsername ? setPreviousNextLocalAction : setPreviousNextOnlineAction
                const properFunctionNext = messageJson.next===localUsername ? setPreviousNextLocalAction : setPreviousNextOnlineAction
                if(messageJson.next===messageJson.previous) {
                    store.dispatch(properFunctionNext(messageUser, messageUser, messageJson.next))
                } else {
                    store.dispatch(properFunctionPrevious(undefined, messageUser, messageJson.previous))
                    store.dispatch(properFunctionNext(messageUser, undefined, messageJson.next))
                }
            }
        }
    } else if (topicSplit[1]==='ready') {
        if(messageUser !== localUsername) {
            store.dispatch(setReadyOnlineAction(true, messageUser))
        }
    }
    renderWithStore()
})

rl.on('line', async input => {
    const state = store.getState()
    const local = state.reducerLocal
    const online = state.reducerOnline
    const room = local.room
    const username = local.username

    // if(input==='/exit'){
    //     if(room === ''){
    //         rl.close()
    //         client.end()
    //         console.clear()
    //         console.log("Stopping client...")
    //         process.exit()
    //
    //     } else {
    //         client.unsubscribe(`${topicPrefix}/+/${room}/#`)
    //         store.dispatch(resetOnlineAction())
    //         store.dispatch(resetLocalAction())
    //         client.publish(`${topicPrefix}/leave/${room}/${username}`, '{}')
    //     }
    //     renderWithStore()
    //
    // } else if(input==='/join' && room===''){
    //     joinRoom()
    //
    // } else if(input==='/play' && room!=='' && !local.playing) {
    //
    //     const getRandomIntInclusive = (min, max) => {
    //         return Math.floor(Math.random() * (max - min + 1) + min)
    //     }
    //     const emptyFields = store.getState().reducerLocal.board.flat().filter(field => field.tank==='')
    //     const chosenField = emptyFields[getRandomIntInclusive(0, emptyFields.length-1)]
    //     const rotation = getRandomIntInclusive(0, 3)
    //     // const turns = online.filter(user => user.playing).map(user => user.turn)
    //     // const highestTurn = Math.max(-1, ...turns)
    //     store.dispatch(setTankLocalAction(chosenField.indexRow, chosenField.indexColumn, rotation))
    //     store.dispatch(setTankBoardAction(chosenField.indexRow, chosenField.indexColumn, username))
    //     // store.dispatch(setTurnLocalAction(highestTurn+1))
    //
    //     const firstPlayer = online.find(user => user.playing && user.first)
    //     const lastPlayer = firstPlayer===undefined ? undefined : online.find(user => user.username===firstPlayer.previous)
    //     const [previous, next] = firstPlayer!==lastPlayer || (firstPlayer===lastPlayer && firstPlayer!==undefined) ? [lastPlayer.username, firstPlayer.username] : [username, username]
    //     store.dispatch(setPreviousNextLocalAction(previous, next))
    //     store.dispatch(setFirstLocalAction(firstPlayer===undefined))
    //     if(firstPlayer===lastPlayer) {
    //         if(firstPlayer!==undefined) {
    //             store.dispatch(setPreviousNextOnlineAction(username, username, firstPlayer.username))
    //         }
    //     } else {
    //         store.dispatch(setPreviousNextOnlineAction(username, undefined, firstPlayer.username))
    //         store.dispatch(setPreviousNextOnlineAction(undefined, username, lastPlayer.username))
    //     }
    //     store.dispatch(setPlayingLocalAction(true))
    //     client.publish(`${topicPrefix}/play/${room}/${username}`, JSON.stringify({
    //         tank: {row: chosenField.indexRow, column: chosenField.indexColumn, rotation},
    //         // turn: highestTurn+1,
    //         first: firstPlayer===undefined,
    //         previous,
    //         next
    //     }))
    //     renderWithStore()
    //
    // } else if(input.length && input[0]!=='/' && room!==''){
    //     store.dispatch(addMessageAction(username, input))
    //     client.publish(`${topicPrefix}/message/${room}/${username}`, JSON.stringify({message: input}))
    //     renderWithStore()
    // } else {
    //     renderWithStore()
    // }

    if(room===''){
        if(input==='/exit'){
            rl.close()
            client.end()
            console.clear()
            console.log("Stopping client...")
            process.exit()

        } else if(input==='/join') {
            renderWithStore()
            await joinRoom()
        }
    } else {
        if(input==='/exit'){
            client.unsubscribe(`${topicPrefix}/+/${room}/#`)
            store.dispatch(resetOnlineAction())
            store.dispatch(resetLocalAction())
            client.publish(`${topicPrefix}/leave/${room}/${username}`, '{}')

        }  else if(input==='/play' && !local.playing && (!online.length || !online.every(o => o.ready))) {
            const getRandomIntInclusive = (min, max) => {
                return Math.floor(Math.random() * (max - min + 1) + min)
            }
            const emptyFields = store.getState().reducerLocal.board.flat().filter(field => field.tank==='')
            const chosenField = emptyFields[getRandomIntInclusive(0, emptyFields.length-1)]
            const rotation = getRandomIntInclusive(0, 3)

            store.dispatch(setTankLocalAction(chosenField.indexRow, chosenField.indexColumn, rotation))
            store.dispatch(setTankBoardAction(chosenField.indexRow, chosenField.indexColumn, username))

            const firstPlayer = online.find(user => user.playing && user.first)
            const lastPlayer = firstPlayer===undefined ? undefined : online.find(user => user.username===firstPlayer.previous)
            const [previous, next] = firstPlayer!==lastPlayer || (firstPlayer===lastPlayer && firstPlayer!==undefined) ? [lastPlayer.username, firstPlayer.username] : [username, username]
            store.dispatch(setPreviousNextLocalAction(previous, next))
            store.dispatch(setFirstLocalAction(firstPlayer===undefined))
            if(firstPlayer===lastPlayer) {
                if(firstPlayer!==undefined) {
                    store.dispatch(setPreviousNextOnlineAction(username, username, firstPlayer.username))
                }
            } else {
                store.dispatch(setPreviousNextOnlineAction(username, undefined, firstPlayer.username))
                store.dispatch(setPreviousNextOnlineAction(undefined, username, lastPlayer.username))
            }
            store.dispatch(setPlayingLocalAction(true))
            client.publish(`${topicPrefix}/play/${room}/${username}`, JSON.stringify({
                tank: {row: chosenField.indexRow, column: chosenField.indexColumn, rotation},
                first: firstPlayer===undefined,
                previous,
                next
            }))

        } else if (input==='/ready' && local.playing && !local.ready && online.filter(o => o.playing).length) {
            store.dispatch(setReadyLocalAction(true))
            client.publish(`${topicPrefix}/ready/${room}/${username}`, '{}')

        } else if(input.length && input[0]!=='/' && room!==''){
            store.dispatch(addMessageAction(username, input))
            client.publish(`${topicPrefix}/message/${room}/${username}`, JSON.stringify({message: input}))
        }
    }

    renderWithStore()
})