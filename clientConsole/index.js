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
    setWinnerAction,
    addChatMessageAction,
    setInitialPositionAction,
    setCancelUserAction,
    setCancelLocalAction,
    setVoteLocalAction
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
    addPointsOnlineAction,
    setVoteOnlineAction,
    setCancelOnlineAction
} = require('./actions/actionsOnline')
const {
    setCurrentChatAction,
    removeChatNotificationAction,
    addChatNotificationAction,
    setHelpAction,
    setCurrentUserAction
} = require('./actions/actionsExtra')

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

const topicPrefix = 'game'
const topicRoomPrefix = `${topicPrefix}/room`
const topicChatPrefix = `${topicPrefix}/chat`

const store = require('./store')
const storeWithUser = currentUser => {
    return {
        dispatch: action => {
            store.dispatch({...action, payload: {...action.payload, currentUser}})
        },
        getState: () => {
            const state = store.getState()
            return {
                ...state,
                reducerLocal: state.reducerLocal[currentUser],
                reducerOnline: state.reducerOnline[currentUser]
            }
        }
    }
}
const {render} = require('./functions')
// const renderWithStore = render(store)
const renderWithStore = currentUser => render(storeWithUser(currentUser))

const getDataForPublish = user => ({
    ...user,
    board: undefined,
    room: undefined,
    messages: undefined,
    chat: undefined,
    initialPosition: undefined,
    cancelUser: undefined
})

const askQuestion = async questionString => new Promise(resolve => {
    rl.question(questionString, resolve)
})

const start = async () => {
    console.clear()
    console.log("'/help' lists the commands")
    console.log()
    const username = await askQuestion("Type your username: ")
    if(/^\w+$/.test(username)) {
        return username
    } else {
        return await start()
    }
}
start().then(username => {
    store.dispatch(setUsernameAction(username))
    store.dispatch(setCurrentUserAction(username))
    client.subscribe(`${topicChatPrefix}/${username}/#`)
    renderWithStore(username)()
})

const endTurn = local => {
    const storeCurrentUser = store.getState().reducerExtra.currentUser
    const storeTest = storeWithUser(storeCurrentUser)

    const next = local.next
    storeTest.dispatch(setTurnLocalAction(false))
    storeTest.dispatch(setTurnOnlineAction(true, next))
    storeTest.dispatch(resetActionsOnlineAction(true, next))
    client.publish(`${topicRoomPrefix}/end/${local.room}/${local.username}`, '{}')
}

client.on('message', (topic, message) => {
    const storeCurrentUser = store.getState().reducerExtra.currentUser
    const storeTest = storeWithUser(storeCurrentUser)
    const renderWithStoreTest = renderWithStore(storeCurrentUser)

    const topicSplit = topic.split('/')
    const state = storeTest.getState()
    const local = state.reducerLocal
    const online = state.reducerOnline
    const extra = state.reducerExtra
    const localUsername = local.username

    const stopVoting = messageUser => {
        storeTest.dispatch(setCancelUserAction(''))
        storeTest.dispatch(setCancelOnlineAction(false, messageUser))
        storeTest.dispatch(setCancelLocalAction(false))
        const onlineVoting = storeTest.getState().reducerOnline.filter(o => o.playing && o.vote)
        onlineVoting.forEach(o => storeTest.dispatch(setVoteOnlineAction(0, o.username)))
        storeTest.dispatch(setVoteLocalAction(0))
    }
    const checkVotes = () => {
        if(local.cancelUser===localUsername) {
            const othersVoting = storeTest.getState().reducerOnline.filter(o => o.playing)
            if(othersVoting.every(o => o.vote===1)) {
                stopVoting(localUsername)
                const initialPosition = local.initialPosition
                storeTest.dispatch(setTankLocalAction(initialPosition.row, initialPosition.column, initialPosition.rotation))
                storeTest.dispatch(setTankBoardAction(initialPosition.row, initialPosition.column, localUsername))
                storeTest.dispatch(resetActionsLocalAction(true))
                client.publish(`${topicRoomPrefix}/success/${local.room}/${localUsername}`, JSON.stringify(initialPosition))
            }
        }
    }

    if(topicSplit[1]==='room') {
        const topicType = topicSplit[2]
        const messageUser = topicSplit[4]
        const notUserEcho = messageUser!==localUsername

        if(topicType === 'join' && notUserEcho){
            storeTest.dispatch(addUserAction(JSON.parse(message).user))
            client.publish(`${topicRoomPrefix}/info/${topicSplit[3]}/${messageUser}`, JSON.stringify({user: getDataForPublish(storeTest.getState().reducerLocal)}))

        } else if(topicType==='info' && !notUserEcho) {
            const messageUser = JSON.parse(message).user
            const winner = messageUser.winner
            storeTest.dispatch(addUserAction({...messageUser, winner: undefined}))
            if(messageUser.playing) {
                storeTest.dispatch(setTankBoardAction(messageUser.tank.row, messageUser.tank.column, messageUser.username))
            }
            if(messageUser.cancel) {
                storeTest.dispatch(setCancelUserAction(messageUser.username))
            }
            if(winner.username.length && winner.username!==local.winner.username) {
                storeTest.dispatch(setWinnerAction(winner.username, winner.score))
            }

        } else if(topicType==='leave') {
            const userObject = online.find(userOnline => userOnline.username===messageUser)
            if(userObject && userObject.playing){
                storeTest.dispatch(setTankBoardAction(-1, -1, messageUser))
                const previous = userObject.previous
                const next = userObject.next
                const properFunctionPrevious = previous===localUsername ? setPreviousNextLocalAction : setPreviousNextOnlineAction
                const properFunctionNext = next===localUsername ? setPreviousNextLocalAction : setPreviousNextOnlineAction
                if(next===previous){
                    if(next!==messageUser){
                        storeTest.dispatch(properFunctionNext(next, next, next))
                    }
                } else {
                    storeTest.dispatch(properFunctionPrevious(undefined, next, previous))
                    storeTest.dispatch(properFunctionNext(previous, undefined, next))
                }
                if(userObject.first && next!==messageUser) {
                    const properFunctionFirst = next===localUsername ? setFirstLocalAction : setFirstOnlineAction
                    storeTest.dispatch(properFunctionFirst(true, next))
                }
                if(userObject.turn && next!==messageUser) {
                    if(next===localUsername) {
                        storeTest.dispatch(setTurnLocalAction(true))
                        storeTest.dispatch(resetActionsLocalAction(true))
                    } else {
                        storeTest.dispatch(setTurnOnlineAction(true, next))
                        storeTest.dispatch(resetActionsOnlineAction(true, userObject.next))
                    }
                }
                if(messageUser===local.cancelUser) {
                    stopVoting(messageUser)
                }
            }
            storeTest.dispatch(removeUserAction(messageUser))
            const currentState = storeTest.getState()
            const playing = [currentState.reducerLocal, ...currentState.reducerOnline].filter(p => p.playing)
            if(currentState.reducerLocal.turn && !currentState.reducerOnline.filter(u => u.playing && u.ready).length) {
                storeTest.dispatch(setWinnerAction(localUsername, local.score))
                storeTest.dispatch(setTurnLocalAction(false))
                storeTest.dispatch(setReadyLocalAction(false))
                storeTest.dispatch(setPlayingLocalAction(false))
                client.publish(`${topicRoomPrefix}/win/${topicSplit[3]}/${localUsername}`, JSON.stringify({score: local.score}))

            } else if (playing.length>1 && !playing.find(p => p.turn) && playing.every(p => p.ready)) {
                const first = playing.find(u => u.first)
                if(first.username===localUsername) {
                    storeTest.dispatch(setTurnLocalAction(true))
                } else {
                    storeTest.dispatch(setTurnOnlineAction(true, first.username))
                }
            }
            if(local.cancelUser.length) {
                checkVotes()
            }

        } else if(topicType==='message' && notUserEcho) {
            storeTest.dispatch(addMessageAction(messageUser, JSON.parse(message).message))

        } else if(topicType==='play' && notUserEcho) {
            const messageJson = JSON.parse(message)
            storeTest.dispatch(setPlayingOnlineAction(true, messageUser))
            storeTest.dispatch(setTankOnlineAction(messageJson.tank.row, messageJson.tank.column, messageJson.tank.rotation, messageUser))
            storeTest.dispatch(setTankBoardAction(messageJson.tank.row, messageJson.tank.column, messageUser))
            storeTest.dispatch(setFirstOnlineAction(messageJson.first, messageUser))
            storeTest.dispatch(setPreviousNextOnlineAction(messageJson.previous, messageJson.next, messageUser))
            if(messageJson.next!==messageUser && messageJson.previous!==messageUser){
                const properFunctionPrevious = messageJson.previous===localUsername ? setPreviousNextLocalAction : setPreviousNextOnlineAction
                const properFunctionNext = messageJson.next===localUsername ? setPreviousNextLocalAction : setPreviousNextOnlineAction
                if(messageJson.next===messageJson.previous) {
                    storeTest.dispatch(properFunctionNext(messageUser, messageUser, messageJson.next))
                } else {
                    storeTest.dispatch(properFunctionPrevious(undefined, messageUser, messageJson.previous))
                    storeTest.dispatch(properFunctionNext(messageUser, undefined, messageJson.next))
                }
            }

        } else if (topicType==='ready' && notUserEcho) {
            storeTest.dispatch(setReadyOnlineAction(true, messageUser))
            const playing = [local, ...storeTest.getState().reducerOnline].filter(p => p.playing)
            if(playing.every(p => p.ready)) {
                const first = playing.find(u => u.first)
                if(first.username===localUsername) {
                    storeTest.dispatch(setTurnLocalAction(true))
                } else {
                    storeTest.dispatch(setTurnOnlineAction(true, first.username))
                }
            }

        } else if (topicType==='end' && notUserEcho) {
            storeTest.dispatch(setTurnOnlineAction(false, messageUser))
            if(local.previous===messageUser) {
                storeTest.dispatch(setTurnLocalAction(true))
                storeTest.dispatch(resetActionsLocalAction(true))
                const tank = local.tank
                storeTest.dispatch(setInitialPositionAction(tank.row, tank.column, tank.rotation))
                if(!local.tank.health) {
                    endTurn(storeTest.getState().reducerLocal)
                }
            } else {
                const userObject = [local, ...online].find(u => u.username===messageUser)
                storeTest.dispatch(setTurnOnlineAction(true, userObject.next))
                storeTest.dispatch(resetActionsOnlineAction(true, userObject.next))
            }
            if(messageUser===local.cancelUser) {
                stopVoting(messageUser)
            }

        } else if (topicType==='action' && notUserEcho) {
            const messageJson = JSON.parse(message)
            storeTest.dispatch(decrementActionsOnlineAction(messageUser))
            storeTest.dispatch(setTankOnlineAction(messageJson.row, messageJson.column, messageJson.rotation, messageUser))
            storeTest.dispatch(setTankBoardAction(messageJson.row, messageJson.column, messageUser))
            if(messageUser===local.cancelUser) {
                stopVoting(messageUser)
            }

        } else if (topicType==='shoot' && notUserEcho) {
            const messageJson = JSON.parse(message)
            const target = messageJson.target
            storeTest.dispatch(resetActionsOnlineAction(false, messageUser))
            if(target.length) {
                if(target===localUsername) {
                    storeTest.dispatch(decrementHealthLocalAction())
                } else {
                    storeTest.dispatch(decrementHealthOnlineAction(target))
                }
                if(messageJson.kill) {
                    storeTest.dispatch(addPointsOnlineAction(1, messageUser))
                }
            }
            if(messageUser===local.cancelUser) {
                stopVoting(messageUser)
            }

        } else if (topicType==='win' && notUserEcho) {
            const messageJson = JSON.parse(message)
            storeTest.dispatch(setWinnerAction(messageUser, messageJson.score))
            if(local.playing) {
                storeTest.dispatch(setTurnLocalAction(false))
                storeTest.dispatch(setReadyLocalAction(false))
                storeTest.dispatch(setPlayingLocalAction(false))
            }
            online.filter(u => u.playing).forEach(user => {
                storeTest.dispatch(setTurnOnlineAction(false, user.username))
                storeTest.dispatch(setReadyOnlineAction(false, user.username))
                storeTest.dispatch(setPlayingOnlineAction(false, user.username))
            })
        } else if (topicType==='cancel' && notUserEcho) {
            storeTest.dispatch(setCancelUserAction(messageUser))
            storeTest.dispatch(setCancelOnlineAction(true, messageUser))

        } else if (topicType==='vote' && notUserEcho) {
            const agree = JSON.parse(message).agree
            if(!agree) {
                stopVoting(local.cancelUser)

            } else{
                storeTest.dispatch(setVoteOnlineAction(1, messageUser))
                checkVotes()
            }
        } else if (topicType==='success' && notUserEcho) {
            const messageJson = JSON.parse(message)
            stopVoting(localUsername)
            storeTest.dispatch(setTankOnlineAction(messageJson.row, messageJson.column, messageJson.rotation, messageUser))
            storeTest.dispatch(setTankBoardAction(messageJson.row, messageJson.column, messageUser))
            storeTest.dispatch(resetActionsOnlineAction(true, messageUser))
        }
    } else if (topicSplit[1]==='chat') {
        const messageUser = topicSplit[3]
        const messageJson = JSON.parse(message)
        storeTest.dispatch(addChatMessageAction(messageUser, messageJson.message, messageUser))
        if(extra.currentChat!==messageUser) {
            const remove = () => storeTest.dispatch(removeChatNotificationAction(messageUser))
            remove()
            storeTest.dispatch(addChatNotificationAction(messageUser, setTimeout(() => {
                remove()
                renderWithStoreTest()
            }, 5000)))
        }
    }
    renderWithStoreTest()
})
//const store = storeWithUser(store.getState().reducerExtra.currentUser)
rl.on('line', async input => {
    const storeCurrentUser = store.getState().reducerExtra.currentUser
    const storeTest = storeWithUser(storeCurrentUser)
    const renderWithStoreTest = renderWithStore(storeCurrentUser)

    const state = storeTest.getState()
    const local = state.reducerLocal
    const online = state.reducerOnline
    const extra = state.reducerExtra
    const room = local.room
    const username = local.username
    const canAct = local.playing && local.turn && local.tank.actions && local.tank.health
    const stopVoting = () => {
        storeTest.dispatch(setCancelUserAction(''))
        storeTest.dispatch(setCancelLocalAction(false))
        const onlineVoting = online.filter(o => o.vote)
        onlineVoting.forEach(o => storeTest.dispatch(setVoteOnlineAction(0, o.username)))
        if(local.vote) {
            storeTest.dispatch(setVoteLocalAction(0))
        }
    }

    if(!extra.help && input==='/help'){
        storeTest.dispatch(setHelpAction(true))
        renderWithStoreTest()
        return

    } else if(extra.help) {
        if (input==='/exit') {
            storeTest.dispatch(setHelpAction(false))
        }
        renderWithStoreTest()
        return
    }

    if(/^\/chat \w+$/.test(input)){
        const target = input.split(' ')[1]
        if(target!==username) {
            storeTest.dispatch(setCurrentChatAction(target))
            storeTest.dispatch(removeChatNotificationAction(target))
        }
        renderWithStoreTest()
        return
    } else if (extra.currentChat.length) {
        if (input === '/exit') {
            storeTest.dispatch(setCurrentChatAction(''))

        } else if (input.length && input[0] !== '/') {
            storeTest.dispatch(addChatMessageAction(extra.currentChat, input, username))
            client.publish(`${topicChatPrefix}/${extra.currentChat}/${username}`, JSON.stringify({message: input}))
        }
        renderWithStoreTest()
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
            storeTest.dispatch(setRoomAction(room))
            client.subscribe(`${topicRoomPrefix}/+/${room}/#`, () => {
                client.publish(`${topicRoomPrefix}/join/${room}/${username}`, JSON.stringify({user: getDataForPublish(storeTest.getState().reducerLocal)}))
            })
        }
    } else if(room.length) {
        if(input==='/exit'){
            client.unsubscribe(`${topicRoomPrefix}/+/${room}/#`)
            storeTest.dispatch(resetOnlineAction())
            storeTest.dispatch(resetLocalAction())
            client.publish(`${topicRoomPrefix}/leave/${room}/${username}`, '{}')

        }  else if(input==='/play' && !local.playing && (!online.length || !online.find(o => o.turn)) && !local.winner.username.length) {
            const getRandomIntInclusive = (min, max) => {
                return Math.floor(Math.random() * (max - min + 1) + min)
            }
            const emptyFields = local.board.flat().filter(field => field.tank==='')
            const chosenField = emptyFields[getRandomIntInclusive(0, emptyFields.length-1)]
            const rotation = getRandomIntInclusive(0, 3)

            storeTest.dispatch(setTankLocalAction(chosenField.indexRow, chosenField.indexColumn, rotation))
            storeTest.dispatch(setTankBoardAction(chosenField.indexRow, chosenField.indexColumn, username))

            const firstPlayer = online.find(user => user.playing && user.first)
            const lastPlayer = firstPlayer===undefined ? undefined : online.find(user => user.username===firstPlayer.previous)
            const [previous, next] = firstPlayer!==lastPlayer || (firstPlayer===lastPlayer && firstPlayer!==undefined) ? [lastPlayer.username, firstPlayer.username] : [username, username]
            storeTest.dispatch(setPreviousNextLocalAction(previous, next))
            storeTest.dispatch(setFirstLocalAction(firstPlayer===undefined))
            if(firstPlayer===lastPlayer) {
                if(firstPlayer!==undefined) {
                    storeTest.dispatch(setPreviousNextOnlineAction(username, username, firstPlayer.username))
                }
            } else {
                storeTest.dispatch(setPreviousNextOnlineAction(username, undefined, firstPlayer.username))
                storeTest.dispatch(setPreviousNextOnlineAction(undefined, username, lastPlayer.username))
            }
            storeTest.dispatch(setPlayingLocalAction(true))
            client.publish(`${topicRoomPrefix}/play/${room}/${username}`, JSON.stringify({
                tank: {row: chosenField.indexRow, column: chosenField.indexColumn, rotation},
                first: firstPlayer===undefined,
                previous,
                next
            }))

        } else if (input==='/ready' && local.playing && !local.ready && online.filter(o => o.playing).length) {
            storeTest.dispatch(setReadyLocalAction(true))
            client.publish(`${topicRoomPrefix}/ready/${room}/${username}`, '{}')

            const playing = online.filter(p => p.playing)
            if(playing.every(p => p.ready)) {
                const first = [local, ...online].find(u => u.playing && u.first)
                if(first.username===username) {
                    storeTest.dispatch(setTurnLocalAction(true))

                } else {
                    storeTest.dispatch(setTurnOnlineAction(true, first.username))
                }
                const tank = local.tank
                storeTest.dispatch(setInitialPositionAction(tank.row, tank.column, tank.rotation))
            }

        } else if(input==='/end' && local.turn){
            endTurn(local)
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
                storeTest.dispatch(decrementActionsLocalAction())
                storeTest.dispatch(setTankLocalAction(newLocation.row, newLocation.column, newLocation.rotation))
                storeTest.dispatch(setTankBoardAction(newLocation.row, newLocation.column, username))
                client.publish(`${topicRoomPrefix}/action/${room}/${username}`, JSON.stringify(newLocation))

                if(!storeTest.getState().reducerLocal.tank.actions) {
                    endTurn(local)
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
            storeTest.dispatch(decrementActionsLocalAction())
            storeTest.dispatch(setTankLocalAction(newLocation.row, newLocation.column, newLocation.rotation))
            client.publish(`${topicRoomPrefix}/action/${room}/${username}`, JSON.stringify(newLocation))

            if(!storeTest.getState().reducerLocal.tank.actions) {
                endTurn(local)
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
            storeTest.dispatch(resetActionsLocalAction(false))
            if(finalTarget.length) {
                storeTest.dispatch(decrementHealthOnlineAction(finalTarget))
            }
            const kill = targetObject && !(targetObject.tank.health-1)
            if(kill) {
                storeTest.dispatch(addPointsLocalAction(1))
            }
            const win = kill && storeTest.getState().reducerOnline.filter(u => u.playing).every(u => !u.tank.health)

            client.publish(`${topicRoomPrefix}/shoot/${room}/${username}`, JSON.stringify({target: finalTarget, kill}))

            if(!storeTest.getState().reducerLocal.tank.actions) {
                endTurn(local)
            }
            if(local.cancelUser.length) {
                stopVoting()
            }

            if(win) {
                const score = storeTest.getState().reducerLocal.score
                storeTest.dispatch(setWinnerAction(username, score))
                storeTest.dispatch(setTurnLocalAction(false))
                storeTest.dispatch(setReadyLocalAction(false))
                storeTest.dispatch(setPlayingLocalAction(false))
                online.filter(u => u.playing).forEach(user => {
                    storeTest.dispatch(setTurnOnlineAction(false, user.username))
                    storeTest.dispatch(setReadyOnlineAction(false, user.username))
                    storeTest.dispatch(setPlayingOnlineAction(false, user.username))
                })
                client.publish(`${topicRoomPrefix}/win/${room}/${username}`, JSON.stringify({score}))
            }

        } else if(canAct && local.tank.actions<3 && !local.cancelUser.length && input==='/cancel'){
            storeTest.dispatch(setCancelLocalAction(true))
            storeTest.dispatch(setCancelUserAction(username))
            client.publish(`${topicRoomPrefix}/cancel/${room}/${username}`, '{}')

        } else if(local.playing && local.cancelUser.length && local.cancelUser!==username && !local.vote && (input==='/yes' || input==='/no')){
            const agree = input==='/yes'
            if(agree) {
                storeTest.dispatch(setVoteLocalAction(1))

            } else {
                stopVoting(local.cancelUser)
            }
            client.publish(`${topicRoomPrefix}/vote/${room}/${username}`, JSON.stringify({agree}))



        } else if(input.length && input[0]!=='/'){
            storeTest.dispatch(addMessageAction(username, input))
            client.publish(`${topicRoomPrefix}/message/${room}/${username}`, JSON.stringify({message: input}))
        }
    }
    renderWithStoreTest()
})