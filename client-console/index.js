require('dotenv').config()
const readline = require('readline')
const mqtt = require('mqtt')
const {
    setRoomAction,
    setUsernameAction,
    resetLocalAction,
    addMessageAction,
    setPlayingLocalAction,
    setTankLocalAction,
    setTankBoardAction,
    setTurnLocalAction,
    setPreviousNextLocalAction,
    setFirstLocalAction,
    setReadyLocalAction,
    decrementActionsLocalAction,
    resetActionsLocalAction,
    addPointsLocalAction,
    setWinnerAction,
    addChatMessageAction,
    setInitialPositionAction,
    setCancelUserAction,
    setCancelLocalAction,
    setVoteLocalAction,
    addTopicsAction,
    removeTopicsAction
} = require('../tanks-game/actions/actionsLocal')
const {
    resetOnlineAction,
    setPlayingOnlineAction,
    setTurnOnlineAction,
    setPreviousNextOnlineAction,
    setReadyOnlineAction,
    decrementHealthOnlineAction,
    setVoteOnlineAction
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

const client = mqtt.connect(`mqtt://${hostAddress}`)

client.on('error', error => {
    console.clear()
    console.log(`Connection error with ${hostAddress}`)
    console.log(error)
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
    getDataForPublish
} = require('../tanks-game/functions')
const endTurnLoaded = local => endTurn(client,store, local)
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
        store.dispatch(setUsernameAction(username))
        store.dispatch(setCurrentUserAction(username))
        const topics = [`${topicChatPrefix}/${username}/#`]
        client.subscribe(topics, () => storeWithUser(store, username).dispatch(addTopicsAction(topics)))
        renderWithStore(username)()
    } else {
        start()
    }
}
start()

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

    const storeLoaded = storeWithUser(store, storeCurrentUser)
    const renderWithStoreLoaded = renderWithStore(storeCurrentUser)

    const state = storeLoaded.getState()
    const local = state.reducerLocal
    const online = state.reducerOnline
    const extra = state.reducerExtra
    const room = local.room
    const username = local.username
    const canAct = local.playing && local.turn && local.tank.actions && local.tank.health
    const stopVoting = () => {
        storeLoaded.dispatch(setCancelUserAction(''))
        storeLoaded.dispatch(setCancelLocalAction(false))
        const onlineVoting = online.filter(o => o.vote)
        onlineVoting.forEach(o => storeLoaded.dispatch(setVoteOnlineAction(0, o.username)))
        if(local.vote) {
            storeLoaded.dispatch(setVoteLocalAction(0))
        }
    }

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
            storeLoaded.dispatch(addChatMessageAction(extra.currentChat, input, username))
            client.publish(`${topicChatPrefix}/${extra.currentChat}/${username}`, JSON.stringify({message: input}))
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
            storeLoaded.dispatch(setRoomAction(room))
            const topic = `${topicRoomPrefix}/+/${room}/#`
            client.subscribe(topic, () => {
                storeLoaded.dispatch(addTopicsAction([topic]))
                client.publish(`${topicRoomPrefix}/join/${room}/${username}`, JSON.stringify({user: getDataForPublish(storeLoaded.getState().reducerLocal)}))
            })
        }
    } else if(room.length) {
        if(input==='/exit'){
            const topic = `${topicRoomPrefix}/+/${room}/#`
            client.unsubscribe(topic, () => storeLoaded.dispatch(removeTopicsAction([topic])))
            storeLoaded.dispatch(resetOnlineAction())
            storeLoaded.dispatch(resetLocalAction())
            client.publish(`${topicRoomPrefix}/leave/${room}/${username}`, '{}')

        }  else if(input==='/play' && !local.playing && (!online.length || !online.find(o => o.turn)) && !local.winner.username.length) {
            const getRandomIntInclusive = (min, max) => {
                return Math.floor(Math.random() * (max - min + 1) + min)
            }
            const emptyFields = local.board.flat().filter(field => field.tank==='')
            const chosenField = emptyFields[getRandomIntInclusive(0, emptyFields.length-1)]
            const rotation = getRandomIntInclusive(0, 3)

            storeLoaded.dispatch(setTankLocalAction(chosenField.indexRow, chosenField.indexColumn, rotation))
            storeLoaded.dispatch(setTankBoardAction(chosenField.indexRow, chosenField.indexColumn, username))

            const firstPlayer = online.find(user => user.playing && user.first)
            const lastPlayer = firstPlayer===undefined ? undefined : online.find(user => user.username===firstPlayer.previous)
            const [previous, next] = firstPlayer!==lastPlayer || (firstPlayer===lastPlayer && firstPlayer!==undefined) ? [lastPlayer.username, firstPlayer.username] : [username, username]
            storeLoaded.dispatch(setPreviousNextLocalAction(previous, next))
            storeLoaded.dispatch(setFirstLocalAction(firstPlayer===undefined))
            if(firstPlayer===lastPlayer) {
                if(firstPlayer!==undefined) {
                    storeLoaded.dispatch(setPreviousNextOnlineAction(username, username, firstPlayer.username))
                }
            } else {
                storeLoaded.dispatch(setPreviousNextOnlineAction(username, undefined, firstPlayer.username))
                storeLoaded.dispatch(setPreviousNextOnlineAction(undefined, username, lastPlayer.username))
            }
            storeLoaded.dispatch(setPlayingLocalAction(true))
            client.publish(`${topicRoomPrefix}/play/${room}/${username}`, JSON.stringify({
                tank: {row: chosenField.indexRow, column: chosenField.indexColumn, rotation},
                first: firstPlayer===undefined,
                previous,
                next
            }))

        } else if (input==='/ready' && local.playing && !local.ready && online.filter(o => o.playing).length) {
            storeLoaded.dispatch(setReadyLocalAction(true))
            client.publish(`${topicRoomPrefix}/ready/${room}/${username}`, '{}')

            const playing = online.filter(p => p.playing)
            if(playing.every(p => p.ready)) {
                const first = [local, ...online].find(u => u.playing && u.first)
                if(first.username===username) {
                    storeLoaded.dispatch(setTurnLocalAction(true))

                } else {
                    storeLoaded.dispatch(setTurnOnlineAction(true, first.username))
                }
            }
            const tank = local.tank
            storeLoaded.dispatch(setInitialPositionAction(tank.row, tank.column, tank.rotation))

        } else if(input==='/end' && local.turn){
            endTurnLoaded(local)
            if(local.cancelUser.length) {
                stopVoting()
            }

        } else if(canAct && (input==='/back' || input==='/forward')){
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
                    endTurnLoaded(local)
                }
                if(local.cancelUser.length) {
                    stopVoting()
                }
            }

        } else if(canAct && (input==='/left' || input==='/right')){
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
                endTurnLoaded(local)
            }
            if(local.cancelUser.length) {
                stopVoting()
            }

        } else if (canAct && input==='/shoot') {
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
                endTurnLoaded(local)
            }
            if(local.cancelUser.length) {
                stopVoting()
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

        } else if(canAct && local.tank.actions<3 && !local.cancelUser.length && input==='/cancel'){
            storeLoaded.dispatch(setCancelLocalAction(true))
            storeLoaded.dispatch(setCancelUserAction(username))
            client.publish(`${topicRoomPrefix}/cancel/${room}/${username}`, '{}')

        } else if(local.playing && local.cancelUser.length && local.cancelUser!==username && !local.vote && (input==='/yes' || input==='/no')){
            const agree = input==='/yes'
            if(agree) {
                storeLoaded.dispatch(setVoteLocalAction(1))

            } else {
                stopVoting(local.cancelUser)
            }
            client.publish(`${topicRoomPrefix}/vote/${room}/${username}`, JSON.stringify({agree}))



        } else if(input.length && input[0]!=='/'){
            storeLoaded.dispatch(addMessageAction(username, input))
            client.publish(`${topicRoomPrefix}/message/${room}/${username}`, JSON.stringify({message: input}))
        }
    }
    renderWithStoreLoaded()
})