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
    decrementHealthLocalAction,
    addPointsLocalAction,
    setWinnerAction
} = require('./actions/actionsLocal')
const {
    addUserAction,
    removeUserAction,
    resetOnlineAction,
    setPlayingOnlineAction,
    setTankOnlineAction,
    setTurnOnlineAction,
    setFirstOnlineAction,
    setPreviousNextOnlineAction,
    setReadyOnlineAction,
    decrementActionsOnlineAction,
    resetActionsOnlineAction,
    decrementHealthOnlineAction,
    addPointsOnlineAction
} = require('./actions/actionsOnline')

const hostAddress = process.env.HOST

const client = mqtt.connect(`mqtt://${hostAddress}`)

client.on('error', () => {
    console.clear()
    console.log(`Can't connect to ${hostAddress}`)
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
    ...user,
    board: undefined,
    room: undefined,
    messages: undefined
})

const askQuestion = async questionString => new Promise(resolve => {
    rl.question(questionString, resolve)
})

const joinRoom = async () => {
    const username = store.getState().reducerLocal.username
    const room = await askQuestion("Type room: ")
    store.dispatch(setRoomAction(room))

    client.subscribe(`${topicPrefix}/+/${room}/#`, () => {
        client.publish(`${topicPrefix}/join/${room}/${username}`, JSON.stringify({user: getDataForPublish(store.getState().reducerLocal)}))
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
    const topicType = topicSplit[1]
    const messageUser = topicSplit[3]
    const notUserEcho = messageUser!==localUsername

    if(topicType === 'join' && notUserEcho){
        store.dispatch(addUserAction(JSON.parse(message).user))
        client.publish(`${topicPrefix}/info/${topicSplit[2]}/${messageUser}`, JSON.stringify({user: getDataForPublish(store.getState().reducerLocal)}))

    } else if(topicType==='info' && !notUserEcho) {
        const messageUser = JSON.parse(message).user
        const winner = messageUser.winner
        store.dispatch(addUserAction({...messageUser, winner: undefined}))
        if(messageUser.playing) {
            store.dispatch(setTankBoardAction(messageUser.tank.row, messageUser.tank.column, messageUser.username))
        }
        if(winner.username.length && winner.username!==local.winner.username) {
            store.dispatch(setWinnerAction(winner.username, winner.score))
        }

    } else if(topicType==='leave') {
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
            if(userObject.turn && next!==messageUser) {
                if(next===localUsername) {
                    store.dispatch(setTurnLocalAction(true))
                    store.dispatch(resetActionsLocalAction(true))
                } else {
                    store.dispatch(setTurnOnlineAction(true, next))
                    store.dispatch(resetActionsOnlineAction(true, userObject.next))
                }
            }
        }
        store.dispatch(removeUserAction(messageUser))
        const currentState = store.getState()
        const playing = [currentState.reducerLocal, ...currentState.reducerOnline].filter(p => p.playing)
        if(currentState.reducerLocal.turn && !currentState.reducerOnline.filter(u => u.playing && u.ready).length) {
            store.dispatch(setWinnerAction(localUsername, local.score))
            store.dispatch(setTurnLocalAction(false))
            store.dispatch(setReadyLocalAction(false))
            store.dispatch(setPlayingLocalAction(false))
            client.publish(`${topicPrefix}/win/${topicSplit[2]}/${localUsername}`, JSON.stringify({score: local.score}))

        } else if (playing.length>1 && !playing.find(p => p.turn) && playing.every(p => p.ready)) {
            const first = playing.find(u => u.first)
            if(first.username===localUsername) {
                store.dispatch(setTurnLocalAction(true))
            } else {
                store.dispatch(setTurnOnlineAction(true, first.username))
            }
        }

    } else if(topicType==='message' && notUserEcho) {
        store.dispatch(addMessageAction(messageUser, JSON.parse(message).message))

    } else if(topicType==='play' && notUserEcho) {
        const messageJson = JSON.parse(message)
        store.dispatch(setPlayingOnlineAction(true, messageUser))
        store.dispatch(setTankOnlineAction(messageJson.tank.row, messageJson.tank.column, messageJson.tank.rotation, messageUser))
        store.dispatch(setTankBoardAction(messageJson.tank.row, messageJson.tank.column, messageUser))
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

    } else if (topicType==='ready' && notUserEcho) {
        store.dispatch(setReadyOnlineAction(true, messageUser))
        const playing = [local, ...store.getState().reducerOnline].filter(p => p.playing)
        if(playing.every(p => p.ready)) {
            const first = playing.find(u => u.first)
            if(first.username===localUsername) {
                store.dispatch(setTurnLocalAction(true))
            } else {
                store.dispatch(setTurnOnlineAction(true, first.username))
            }
        }

    } else if (topicType==='end' && notUserEcho) {
        store.dispatch(setTurnOnlineAction(false, messageUser))
        if(local.previous===messageUser) {
            store.dispatch(setTurnLocalAction(true))
            store.dispatch(resetActionsLocalAction(true))
        } else {
            const userObject = [local, ...online].find(u => u.username===messageUser)
            store.dispatch(setTurnOnlineAction(true, userObject.next))
            store.dispatch(resetActionsOnlineAction(true, userObject.next))
        }

    } else if (topicType==='action' && notUserEcho) {
        const messageJson = JSON.parse(message)
        store.dispatch(decrementActionsOnlineAction(messageUser))
        store.dispatch(setTankOnlineAction(messageJson.row, messageJson.column, messageJson.rotation, messageUser))
        store.dispatch(setTankBoardAction(messageJson.row, messageJson.column, messageUser))

    } else if (topicType==='shoot' && notUserEcho) {
        const messageJson = JSON.parse(message)
        const target = messageJson.target
        store.dispatch(resetActionsOnlineAction(false, messageUser))
        if(target.length) {
            if(target===localUsername) {
                store.dispatch(decrementHealthLocalAction())
            } else {
                store.dispatch(decrementHealthOnlineAction(target))
            }
            if(messageJson.kill) {
                store.dispatch(addPointsOnlineAction(1, messageUser))
            }
        }
    } else if (topicType==='win' && notUserEcho) {
        const messageJson = JSON.parse(message)
        store.dispatch(setWinnerAction(messageUser, messageJson.score))
        if(local.playing) {
            store.dispatch(setTurnLocalAction(false))
            store.dispatch(setReadyLocalAction(false))
            store.dispatch(setPlayingLocalAction(false))
        }
        online.filter(u => u.playing).forEach(user => {
            store.dispatch(setTurnOnlineAction(false, user.username))
            store.dispatch(setReadyOnlineAction(false, user.username))
            store.dispatch(setPlayingOnlineAction(false, user.username))
        })
    }
    renderWithStore()
})

rl.on('line', async input => {
    const state = store.getState()
    const local = state.reducerLocal
    const online = state.reducerOnline
    const room = local.room
    const username = local.username
    const canAct = local.playing && local.turn && local.tank.actions && local.tank.health

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

        }  else if(input==='/play' && !local.playing && (!online.length || !online.find(o => o.turn)) && !local.winner.username.length) {
            const getRandomIntInclusive = (min, max) => {
                return Math.floor(Math.random() * (max - min + 1) + min)
            }
            const emptyFields = local.board.flat().filter(field => field.tank==='')
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

            const playing = online.filter(p => p.playing)
            if(playing.every(p => p.ready)) {
                const first = [local, ...online].find(u => u.playing && u.first)
                if(first.username===username) {
                    store.dispatch(setTurnLocalAction(true))

                } else {
                    store.dispatch(setTurnOnlineAction(true, first.username))
                }
            }

        } else if(input==='/end' && local.turn){
            const next = local.next
            if(next===username) {
                store.dispatch(resetActionsLocalAction(true))

            } else {
                store.dispatch(setTurnLocalAction(false))
                store.dispatch(setTurnOnlineAction(true, next))
                store.dispatch(resetActionsOnlineAction(true, next))
            }
            client.publish(`${topicPrefix}/end/${room}/${username}`, '{}')

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
                store.dispatch(decrementActionsLocalAction())
                store.dispatch(setTankLocalAction(newLocation.row, newLocation.column, newLocation.rotation))
                store.dispatch(setTankBoardAction(newLocation.row, newLocation.column, username))
                client.publish(`${topicPrefix}/action/${room}/${username}`, JSON.stringify(newLocation))
            }

        } else if(canAct && (input==='/left' || input==='/right')){
            const tank = local.tank
            const maxRotation = 4
            const newLocation = {
                rotation: input==='/right' ? (tank.rotation+1)%maxRotation : tank.rotation===0 ? maxRotation-1 : tank.rotation-1,
                row: tank.row,
                column: tank.column
            }
            store.dispatch(decrementActionsLocalAction())
            store.dispatch(setTankLocalAction(newLocation.row, newLocation.column, newLocation.rotation))
            client.publish(`${topicPrefix}/action/${room}/${username}`, JSON.stringify(newLocation))

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
            store.dispatch(resetActionsLocalAction(false))
            if(finalTarget.length) {
                store.dispatch(decrementHealthOnlineAction(finalTarget))
            }
            const kill = targetObject && !(targetObject.tank.health-1)
            if(kill) {
                store.dispatch(addPointsLocalAction(1))
            }
            const win = kill && store.getState().reducerOnline.filter(u => u.playing).every(u => !u.tank.health)

            client.publish(`${topicPrefix}/shoot/${room}/${username}`, JSON.stringify({target: finalTarget, kill}))
            if(win) {
                const score = store.getState().reducerLocal.score
                store.dispatch(setWinnerAction(username, score))
                store.dispatch(setTurnLocalAction(false))
                store.dispatch(setReadyLocalAction(false))
                store.dispatch(setPlayingLocalAction(false))
                online.filter(u => u.playing).forEach(user => {
                    store.dispatch(setTurnOnlineAction(false, user.username))
                    store.dispatch(setReadyOnlineAction(false, user.username))
                    store.dispatch(setPlayingOnlineAction(false, user.username))
                })
                client.publish(`${topicPrefix}/win/${room}/${username}`, JSON.stringify({score}))
            }

        } else if(input.length && input[0]!=='/' && room!==''){
            store.dispatch(addMessageAction(username, input))
            client.publish(`${topicPrefix}/message/${room}/${username}`, JSON.stringify({message: input}))
        }
    }
    renderWithStore()
})