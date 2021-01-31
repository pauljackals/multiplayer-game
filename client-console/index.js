require('dotenv').config()
const readline = require('readline')
const mqtt = require('mqtt')
const {
    setPlayingLocalAction,
    setTankLocalAction,
    setTankBoardAction,
    setTurnLocalAction,
    setReadyLocalAction,
    decrementActionsLocalAction,
    resetActionsLocalAction,
    addPointsLocalAction,
    setWinnerAction
} = require('../tanks-game/actions/actionsLocal')
const {
    setPlayingOnlineAction,
    setTurnOnlineAction,
    setReadyOnlineAction,
    decrementHealthOnlineAction
} = require('../tanks-game/actions/actionsOnline')
const {
    setCurrentChatAction,
    removeChatNotificationAction,
    addChatNotificationAction,
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
    endTurn,
    createUser,
    sendChat,
    joinRoom,
    leaveRoom,
    sendRoomMessage,
    play,
    ready,
    stopVoting,
    endPlayerTurn,
    vote,
    cancel,
    canAct
} = require('../tanks-game/functions')
const {
    topicChatPrefix,
    topicRoomPrefix
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

    const topicSplit = topic.split('/')
    const extra = store.getState().reducerExtra
    const messageUser = topicSplit[3]
    const renderWithStoreLoaded = renderWithStore(extra.currentUser)

    if (topicSplit[1]==='chat' && extra.currentChat!==messageUser) {
        const remove = () => store.dispatch(removeChatNotificationAction(messageUser))
        remove()
        store.dispatch(addChatNotificationAction(messageUser, setTimeout(() => {
            remove()
            renderWithStoreLoaded()
        }, 5000)))
    }
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
            storeLoaded.dispatch(setCurrentChatAction(target))
            storeLoaded.dispatch(removeChatNotificationAction(target))
        }
        renderWithStoreLoaded()
        return
    } else if (extra.currentChat.length) {
        if (input === '/exit') {
            storeLoaded.dispatch(setCurrentChatAction(''))

        } else if (input.length && input[0] !== '/') {
            sendChat(client, storeLoaded, extra.currentChat, input, username)
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

        } else if(canAct(storeLoaded) && (input==='/back' || input==='/forward')){
            const tank = local.tank
            const board = local.board
            const boardSize = board.length

            const forwardMultiplier = input==='/forward' ? 1 : -1
            const forwardRotationMultiplier = tank.rotation===1 || tank.rotation===2 ? 1 : -1

            const rowNew = tank.rotation%2===0 ?
                tank.row + forwardMultiplier*forwardRotationMultiplier :
                tank.row
            const columnNew = tank.rotation%2===1 ?
                tank.column + forwardMultiplier*forwardRotationMultiplier :
                tank.column

            if (rowNew>=0 && columnNew>=0 && rowNew<boardSize && columnNew<boardSize && board[rowNew][columnNew].tank==='') {
                const newLocation = {
                    rotation: tank.rotation,
                    row: rowNew,
                    column: columnNew
                }
                storeLoaded.dispatch(decrementActionsLocalAction())
                storeLoaded.dispatch(setTankLocalAction(newLocation.row, newLocation.column, newLocation.rotation))
                storeLoaded.dispatch(setTankBoardAction(newLocation.row, newLocation.column, username))
                client.publish(`${topicRoomPrefix}/action/${room}/${username}`, JSON.stringify(newLocation))

                if(!storeLoaded.getState().reducerLocal.tank.actions) {
                    endTurn(client, storeLoaded)
                }
                if(local.cancelUser.length) {
                    stopVoting(storeLoaded)
                }
            }

        } else if(canAct(storeLoaded) && (input==='/left' || input==='/right')){
            const tank = local.tank
            const maxRotation = 4
            const newLocation = {
                rotation: input==='/right' ? (tank.rotation+1)%maxRotation : tank.rotation===0 ? maxRotation-1 : tank.rotation-1,
                row: tank.row,
                column: tank.column
            }
            storeLoaded.dispatch(decrementActionsLocalAction())
            storeLoaded.dispatch(setTankLocalAction(newLocation.row, newLocation.column, newLocation.rotation))
            client.publish(`${topicRoomPrefix}/action/${room}/${username}`, JSON.stringify(newLocation))

            if(!storeLoaded.getState().reducerLocal.tank.actions) {
                endTurn(client, storeLoaded)
            }
            if(local.cancelUser.length) {
                stopVoting(storeLoaded)
            }

        } else if (canAct(storeLoaded) && input==='/shoot') {
            const tank = local.tank
            const rotation = tank.rotation

            const getTargets = () => {
                const lineOfSightTargets = check => local.board.flat().filter(field => field.tank.length && check(field))
                if(rotation===0) {
                    return lineOfSightTargets(field =>
                        field.indexRow<tank.row && field.indexColumn===tank.column
                    )
                } else if(rotation===1) {
                    return lineOfSightTargets(field =>
                        field.indexRow===tank.row && field.indexColumn>tank.column
                    )
                } else if(rotation===2) {
                    return lineOfSightTargets(field =>
                        field.indexRow>tank.row && field.indexColumn===tank.column
                    )
                } else if(rotation===3) {
                    return lineOfSightTargets(field =>
                        field.indexRow===tank.row && field.indexColumn<tank.column
                    )
                }
            }

            const targets = getTargets()

            const getClosestTarget = () => {
                const reduceTargets = check =>
                    targets.reduce((closest, current) => check(closest, current) ? current : closest)
                if (rotation===0) {
                    return reduceTargets((closest, current) => closest.indexRow<current.indexRow)
                } else if (rotation===1) {
                    return reduceTargets((closest, current) => closest.indexColumn>current.indexColumn)
                } else if (rotation===2) {
                    return reduceTargets((closest, current) => closest.indexRow>current.indexRow)
                } else if (rotation===3) {
                    return reduceTargets((closest, current) => closest.indexColumn<current.indexColumn)
                }
            }
            const target = targets.length > 1 ? getClosestTarget().tank : (targets.length ? targets[0].tank : '')
            const targetObject = target.length ? online.find(o => o.username===target) : undefined
            const finalTarget = !target.length || targetObject.tank.health ? target  : ''
            storeLoaded.dispatch(resetActionsLocalAction(false))
            if(finalTarget.length) {
                storeLoaded.dispatch(decrementHealthOnlineAction(finalTarget))
            }
            const kill = targetObject && !(targetObject.tank.health-1)
            if(kill) {
                storeLoaded.dispatch(addPointsLocalAction(1))
            }
            const win = kill && storeLoaded.getState().reducerOnline.filter(u => u.playing).every(u => !u.tank.health)

            client.publish(`${topicRoomPrefix}/shoot/${room}/${username}`, JSON.stringify({target: finalTarget, kill}))

            if(!storeLoaded.getState().reducerLocal.tank.actions) {
                endTurn(client, storeLoaded)
            }
            if(local.cancelUser.length) {
                stopVoting(storeLoaded)
            }

            if(win) {
                const score = storeLoaded.getState().reducerLocal.score
                storeLoaded.dispatch(setWinnerAction(username, score))
                storeLoaded.dispatch(setTurnLocalAction(false))
                storeLoaded.dispatch(setReadyLocalAction(false))
                storeLoaded.dispatch(setPlayingLocalAction(false))
                online.filter(u => u.playing).forEach(user => {
                    storeLoaded.dispatch(setTurnOnlineAction(false, user.username))
                    storeLoaded.dispatch(setReadyOnlineAction(false, user.username))
                    storeLoaded.dispatch(setPlayingOnlineAction(false, user.username))
                })
                client.publish(`${topicRoomPrefix}/win/${room}/${username}`, JSON.stringify({score}))
            }

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