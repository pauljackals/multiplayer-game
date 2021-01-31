const {
    addMessageAction,
    setPlayingLocalAction,
    setTankLocalAction,
    setTankBoardAction,
    setTurnLocalAction,
    setPreviousNextLocalAction,
    setFirstLocalAction,
    setReadyLocalAction,
    resetActionsLocalAction,
    decrementHealthLocalAction,
    setWinnerAction,
    addChatMessageAction,
    setInitialPositionAction,
    setCancelUserAction,
    setCancelLocalAction,
    setVoteLocalAction,
    setUsernameAction,
    addTopicsAction,
    setRoomAction,
    removeTopicsAction,
    resetLocalAction
} = require('../tanks-game/actions/actionsLocal')
const {
    addUserAction,
    removeUserAction,
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
    setCancelOnlineAction,
    resetOnlineAction
} = require('../tanks-game/actions/actionsOnline')
const {
    topicRoomPrefix,
    topicChatPrefix
} = require('./prefixes')

const getDataForPublish = user => ({
    ...user,
    board: undefined,
    room: undefined,
    messages: undefined,
    chat: undefined,
    initialPosition: undefined,
    cancelUser: undefined,
    topics: undefined
})

const storeWithUser = (store, currentUser) => {
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
const messageLogic = async (client, store, topic, message) => {

    const subscribers = Object.values(store.getState().reducerLocal)
        .filter(subscriber => subscriber.topics.find(t => {
            const string = t.replace(/\//g, '\\/').replace(/\+/g, '\\w+').replace(/#/g, '\\w+(\\/?\\w+)*')
            const regex = new RegExp(`^${string}$`)
            return regex.test(topic)
        }))

    subscribers.forEach(subscriber => {
        const storeCurrentUser = subscriber.username
        const storeLoaded = storeWithUser(store, storeCurrentUser)

        const state = storeLoaded.getState()
        const local = state.reducerLocal
        const online = state.reducerOnline
        const localUsername = local.username
        const topicSplit = topic.split('/')

        const stopVoting = messageUser => {
            storeLoaded.dispatch(setCancelUserAction(''))
            storeLoaded.dispatch(setCancelOnlineAction(false, messageUser))
            storeLoaded.dispatch(setCancelLocalAction(false))
            const onlineVoting = storeLoaded.getState().reducerOnline.filter(o => o.playing && o.vote)
            onlineVoting.forEach(o => storeLoaded.dispatch(setVoteOnlineAction(0, o.username)))
            storeLoaded.dispatch(setVoteLocalAction(0))
        }
        const checkVotes = () => {
            if(local.cancelUser===localUsername) {
                const othersVoting = storeLoaded.getState().reducerOnline.filter(o => o.playing)
                if(othersVoting.every(o => o.vote===1)) {
                    stopVoting(localUsername)
                    const initialPosition = local.initialPosition
                    storeLoaded.dispatch(setTankLocalAction(initialPosition.row, initialPosition.column, initialPosition.rotation))
                    storeLoaded.dispatch(setTankBoardAction(initialPosition.row, initialPosition.column, localUsername))
                    storeLoaded.dispatch(resetActionsLocalAction(true))
                    client.publish(`${topicRoomPrefix}/success/${local.room}/${localUsername}`, JSON.stringify(initialPosition))
                }
            }
        }

        if(topicSplit[1]==='room') {
            const topicType = topicSplit[2]
            const messageUser = topicSplit[4]
            const notUserEcho = messageUser!==localUsername

            if(topicType === 'join' && notUserEcho){
                storeLoaded.dispatch(addUserAction(JSON.parse(message).user))
                client.publish(`${topicRoomPrefix}/info/${topicSplit[3]}/${messageUser}`, JSON.stringify({user: getDataForPublish(storeLoaded.getState().reducerLocal)}))

            } else if(topicType==='info' && !notUserEcho) {
                const messageUser = JSON.parse(message).user
                const winner = messageUser.winner
                storeLoaded.dispatch(addUserAction({...messageUser, winner: undefined}))
                if(messageUser.playing) {
                    storeLoaded.dispatch(setTankBoardAction(messageUser.tank.row, messageUser.tank.column, messageUser.username))
                }
                if(messageUser.cancel) {
                    storeLoaded.dispatch(setCancelUserAction(messageUser.username))
                }
                if(winner.username.length && winner.username!==local.winner.username) {
                    storeLoaded.dispatch(setWinnerAction(winner.username, winner.score))
                }

            } else if(topicType==='leave') {
                const userObject = online.find(userOnline => userOnline.username===messageUser)
                if(userObject && userObject.playing){
                    storeLoaded.dispatch(setTankBoardAction(-1, -1, messageUser))
                    const previous = userObject.previous
                    const next = userObject.next
                    const properFunctionPrevious = previous===localUsername ? setPreviousNextLocalAction : setPreviousNextOnlineAction
                    const properFunctionNext = next===localUsername ? setPreviousNextLocalAction : setPreviousNextOnlineAction
                    if(next===previous){
                        if(next!==messageUser){
                            storeLoaded.dispatch(properFunctionNext(next, next, next))
                        }
                    } else {
                        storeLoaded.dispatch(properFunctionPrevious(undefined, next, previous))
                        storeLoaded.dispatch(properFunctionNext(previous, undefined, next))
                    }
                    if(userObject.first && next!==messageUser) {
                        const properFunctionFirst = next===localUsername ? setFirstLocalAction : setFirstOnlineAction
                        storeLoaded.dispatch(properFunctionFirst(true, next))
                    }
                    if(userObject.turn && next!==messageUser) {
                        if(next===localUsername) {
                            storeLoaded.dispatch(setTurnLocalAction(true))
                            storeLoaded.dispatch(resetActionsLocalAction(true))
                        } else {
                            storeLoaded.dispatch(setTurnOnlineAction(true, next))
                            storeLoaded.dispatch(resetActionsOnlineAction(true, userObject.next))
                        }
                    }
                    if(messageUser===local.cancelUser) {
                        stopVoting(messageUser)
                    }
                }
                storeLoaded.dispatch(removeUserAction(messageUser))
                const currentState = storeLoaded.getState()
                const playing = [currentState.reducerLocal, ...currentState.reducerOnline].filter(p => p.playing)
                if(currentState.reducerLocal.turn && !currentState.reducerOnline.filter(u => u.playing && u.ready).length) {
                    storeLoaded.dispatch(setWinnerAction(localUsername, local.score))
                    storeLoaded.dispatch(setTurnLocalAction(false))
                    storeLoaded.dispatch(setReadyLocalAction(false))
                    storeLoaded.dispatch(setPlayingLocalAction(false))
                    client.publish(`${topicRoomPrefix}/win/${topicSplit[3]}/${localUsername}`, JSON.stringify({score: local.score}))

                } else if (playing.length>1 && !playing.find(p => p.turn) && playing.every(p => p.ready)) {
                    const first = playing.find(u => u.first)
                    if(first.username===localUsername) {
                        storeLoaded.dispatch(setTurnLocalAction(true))
                    } else {
                        storeLoaded.dispatch(setTurnOnlineAction(true, first.username))
                    }
                }
                if(local.cancelUser.length) {
                    checkVotes()
                }

            } else if(topicType==='message' && notUserEcho) {
                storeLoaded.dispatch(addMessageAction(messageUser, JSON.parse(message).message))

            } else if(topicType==='play' && notUserEcho) {
                const messageJson = JSON.parse(message)
                storeLoaded.dispatch(setPlayingOnlineAction(true, messageUser))
                storeLoaded.dispatch(setTankOnlineAction(messageJson.tank.row, messageJson.tank.column, messageJson.tank.rotation, messageUser))
                storeLoaded.dispatch(setTankBoardAction(messageJson.tank.row, messageJson.tank.column, messageUser))
                storeLoaded.dispatch(setFirstOnlineAction(messageJson.first, messageUser))
                storeLoaded.dispatch(setPreviousNextOnlineAction(messageJson.previous, messageJson.next, messageUser))
                if(messageJson.next!==messageUser && messageJson.previous!==messageUser){
                    const properFunctionPrevious = messageJson.previous===localUsername ? setPreviousNextLocalAction : setPreviousNextOnlineAction
                    const properFunctionNext = messageJson.next===localUsername ? setPreviousNextLocalAction : setPreviousNextOnlineAction
                    if(messageJson.next===messageJson.previous) {
                        storeLoaded.dispatch(properFunctionNext(messageUser, messageUser, messageJson.next))
                    } else {
                        storeLoaded.dispatch(properFunctionPrevious(undefined, messageUser, messageJson.previous))
                        storeLoaded.dispatch(properFunctionNext(messageUser, undefined, messageJson.next))
                    }
                }

            } else if (topicType==='ready' && notUserEcho) {
                storeLoaded.dispatch(setReadyOnlineAction(true, messageUser))
                const playing = [local, ...storeLoaded.getState().reducerOnline].filter(p => p.playing)
                if(playing.every(p => p.ready)) {
                    const first = playing.find(u => u.first)
                    if(first.username===localUsername) {
                        storeLoaded.dispatch(setTurnLocalAction(true))
                    } else {
                        storeLoaded.dispatch(setTurnOnlineAction(true, first.username))
                    }
                }

            } else if (topicType==='end' && notUserEcho) {
                storeLoaded.dispatch(setTurnOnlineAction(false, messageUser))
                if(local.previous===messageUser) {
                    storeLoaded.dispatch(setTurnLocalAction(true))
                    storeLoaded.dispatch(resetActionsLocalAction(true))
                    const tank = local.tank
                    storeLoaded.dispatch(setInitialPositionAction(tank.row, tank.column, tank.rotation))
                    if(!local.tank.health) {
                        endTurn(client, storeLoaded)
                    }
                } else {
                    const userObject = [local, ...online].find(u => u.username===messageUser)
                    storeLoaded.dispatch(setTurnOnlineAction(true, userObject.next))
                    storeLoaded.dispatch(resetActionsOnlineAction(true, userObject.next))
                }
                if(messageUser===local.cancelUser) {
                    stopVoting(messageUser)
                }

            } else if (topicType==='action' && notUserEcho) {
                const messageJson = JSON.parse(message)
                storeLoaded.dispatch(decrementActionsOnlineAction(messageUser))
                storeLoaded.dispatch(setTankOnlineAction(messageJson.row, messageJson.column, messageJson.rotation, messageUser))
                storeLoaded.dispatch(setTankBoardAction(messageJson.row, messageJson.column, messageUser))
                if(messageUser===local.cancelUser) {
                    stopVoting(messageUser)
                }

            } else if (topicType==='shoot' && notUserEcho) {
                const messageJson = JSON.parse(message)
                const target = messageJson.target
                storeLoaded.dispatch(resetActionsOnlineAction(false, messageUser))
                if(target.length) {
                    if(target===localUsername) {
                        storeLoaded.dispatch(decrementHealthLocalAction())
                    } else {
                        storeLoaded.dispatch(decrementHealthOnlineAction(target))
                    }
                    if(messageJson.kill) {
                        storeLoaded.dispatch(addPointsOnlineAction(1, messageUser))
                    }
                }
                if(messageUser===local.cancelUser) {
                    stopVoting(messageUser)
                }

            } else if (topicType==='win' && notUserEcho) {
                const messageJson = JSON.parse(message)
                storeLoaded.dispatch(setWinnerAction(messageUser, messageJson.score))
                if(local.playing) {
                    storeLoaded.dispatch(setTurnLocalAction(false))
                    storeLoaded.dispatch(setReadyLocalAction(false))
                    storeLoaded.dispatch(setPlayingLocalAction(false))
                }
                online.filter(u => u.playing).forEach(user => {
                    storeLoaded.dispatch(setTurnOnlineAction(false, user.username))
                    storeLoaded.dispatch(setReadyOnlineAction(false, user.username))
                    storeLoaded.dispatch(setPlayingOnlineAction(false, user.username))
                })
            } else if (topicType==='cancel' && notUserEcho) {
                storeLoaded.dispatch(setCancelUserAction(messageUser))
                storeLoaded.dispatch(setCancelOnlineAction(true, messageUser))

            } else if (topicType==='vote' && notUserEcho) {
                const agree = JSON.parse(message).agree
                if(!agree) {
                    stopVoting(local.cancelUser)

                } else{
                    storeLoaded.dispatch(setVoteOnlineAction(1, messageUser))
                    checkVotes()
                }
            } else if (topicType==='success' && notUserEcho) {
                const messageJson = JSON.parse(message)
                stopVoting(localUsername)
                storeLoaded.dispatch(setTankOnlineAction(messageJson.row, messageJson.column, messageJson.rotation, messageUser))
                storeLoaded.dispatch(setTankBoardAction(messageJson.row, messageJson.column, messageUser))
                storeLoaded.dispatch(resetActionsOnlineAction(true, messageUser))
            }
        } else if (topicSplit[1]==='chat') {
            const messageUser = topicSplit[3]
            const messageJson = JSON.parse(message)
            storeLoaded.dispatch(addChatMessageAction(messageUser, messageJson.message, messageUser))
        }
    })
    return true
}

const endTurn = (client, storeLoaded) => {
    const local = storeLoaded.getState().reducerLocal

    const next = local.next
    storeLoaded.dispatch(setTurnLocalAction(false))
    storeLoaded.dispatch(setTurnOnlineAction(true, next))
    storeLoaded.dispatch(resetActionsOnlineAction(true, next))
    client.publish(`${topicRoomPrefix}/end/${local.room}/${local.username}`, '{}')
}

const createUser = (client, store, username) => {
    store.dispatch(setUsernameAction(username))
    const storeLoaded = storeWithUser(store, username)
    const topic = `${topicChatPrefix}/${username}/#`
    client.subscribe(topic)
    storeLoaded.dispatch(addTopicsAction([topic]))
}
const sendChat = (client, storeLoaded, target, message, sender) => {
    const username = storeLoaded.getState().reducerLocal.username
    storeLoaded.dispatch(addChatMessageAction(target, message, sender))
    client.publish(`${topicChatPrefix}/${target}/${username}`, JSON.stringify({message}))
}
const joinRoom = (client, storeLoaded, localAll, room) => {
    const username = storeLoaded.getState().reducerLocal.username
    storeLoaded.dispatch(setRoomAction(room))
    const topic = `${topicRoomPrefix}/+/${room}/#`
    const howManySubscribed = Object.values(localAll).filter(user => user.topics.includes(topic)).length
    if(!howManySubscribed) {
        client.subscribe(topic)
    }
    storeLoaded.dispatch(addTopicsAction([topic]))
    client.publish(`${topicRoomPrefix}/join/${room}/${username}`, JSON.stringify({user: getDataForPublish(storeLoaded.getState().reducerLocal)}))
}
const leaveRoom = (client, storeLoaded, localAll) => {
    const local = storeLoaded.getState().reducerLocal
    const room = local.room
    const username = local.username
    const topic = `${topicRoomPrefix}/+/${room}/#`
    const howManySubscribed = Object.values(localAll).filter(user => user.topics.includes(topic)).length
    if(howManySubscribed<=1) {
        client.unsubscribe(topic)
    }
    storeLoaded.dispatch(removeTopicsAction([topic]))
    storeLoaded.dispatch(resetOnlineAction())
    storeLoaded.dispatch(resetLocalAction())
    client.publish(`${topicRoomPrefix}/leave/${room}/${username}`, '{}')
}

const sendRoomMessage = (client, storeLoaded, message) => {
    const local = storeLoaded.getState().reducerLocal
    const username = local.username
    const room = local.room
    storeLoaded.dispatch(addMessageAction(username, message))
    client.publish(`${topicRoomPrefix}/message/${room}/${username}`, JSON.stringify({message}))
}

const play = (client, storeLoaded) => {
    const state = storeLoaded.getState()
    const local = state.reducerLocal
    const online = state.reducerOnline
    const username = local.username
    const room = local.room

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
}

const ready = (client, storeLoaded) => {
    const state = storeLoaded.getState()
    const local = state.reducerLocal
    const online = state.reducerOnline
    const username = local.username
    const room = local.room

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
}

const endPlayerTurn = (client, storeLoaded) => {
    const local = storeLoaded.getState().reducerLocal

    endTurn(client, storeLoaded)
    if(local.cancelUser.length) {
        stopVoting()
    }
}

const stopVoting = storeLoaded => {
    const state = storeLoaded.getState()
    const local = state.reducerLocal
    const online = state.reducerOnline

    storeLoaded.dispatch(setCancelUserAction(''))
    storeLoaded.dispatch(setCancelLocalAction(false))
    const onlineVoting = online.filter(o => o.vote)
    onlineVoting.forEach(o => storeLoaded.dispatch(setVoteOnlineAction(0, o.username)))
    if(local.vote) {
        storeLoaded.dispatch(setVoteLocalAction(0))
    }
}
const vote = (client, storeLoaded, agree) => {
    const local = storeLoaded.getState().reducerLocal
    const room = local.room
    const username = local.username

    if(agree) {
        storeLoaded.dispatch(setVoteLocalAction(1))

    } else {
        stopVoting(storeLoaded)
    }
    client.publish(`${topicRoomPrefix}/vote/${room}/${username}`, JSON.stringify({agree}))
}
const cancel = (client, storeLoaded) => {
    const local = storeLoaded.getState().reducerLocal
    const username = local.username
    const room = local.room

    storeLoaded.dispatch(setCancelLocalAction(true))
    storeLoaded.dispatch(setCancelUserAction(username))
    client.publish(`${topicRoomPrefix}/cancel/${room}/${username}`, '{}')
}
const canAct = storeLoaded => {
    const local = storeLoaded.getState().reducerLocal
    return local.playing && local.turn && local.tank.actions && local.tank.health
}

module.exports= {
    messageLogic,
    storeWithUser,
    endTurn,
    getDataForPublish,
    createUser,
    sendChat,
    joinRoom,
    leaveRoom,
    sendRoomMessage,
    play,
    ready,
    endPlayerTurn,
    stopVoting,
    vote,
    cancel,
    canAct
}