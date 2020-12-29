const readline = require('readline')
const mqtt = require('mqtt')
const {setRoomAction, setUsernameAction, resetLocalAction, addMessageAction, setJoiningAction, setPlayingLocalAction, setTankLocalAction, setTankBoardAction} = require('./actions/actionsLocal')
const {addUserAction, removeUserAction, resetOnlineAction, setPlayingOnlineAction, setTankOnlineAction} = require('./actions/actionsOnline')

const arguments = process.argv.slice(2)
if (arguments.length !== 1){
    console.log('You must provide a broker address')
    process.exit(1)
}

const hostAddress = arguments[0]

const client = mqtt.connect(`mqtt://${hostAddress}`)

client.on('error', error => {
    console.clear()
    console.log(`Can't connect to ${error.address}`)
    client.end()
    process.exit()
})

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const topicPrefix = 'game'

const store = require('./store')

const render = () => {
    console.clear()
    const state = store.getState()
    const local = state.reducerLocal
    const online = state.reducerOnline
    const room = local.room

    if(local.username!=='' || room!=='') {
        console.log(`User: ${local.username}`)
    }
    if(room !== '') {
        console.log(`Room: ${room}`)
        console.log()
        const all = [local, ...online].sort(
            (user1, user2) => user1.username > user2.username ? 1
                : (user1.username < user2.username ? -1
                    : 0)
        )
        const [allSpectating, allPlaying] = all.reduce(
            (accumulator, user) => !user.playing ? [[...accumulator[0], user], accumulator[1]] : [accumulator[0], [...accumulator[1], user]], [[], []]
        )
        console.log("Spectating:")
        allSpectating.forEach(user => console.log(`  ${user.username}`))
        console.log("Playing:")
        allPlaying.forEach(user => console.log(`  ${user.username} (${user.score})`))
        console.log()
        console.log("Messages:")
        local.messages.slice(-5).forEach(message => console.log(`  /${message.username}/ ${message.text}`))

        console.log()
        console.log(local.board[0].reduce((accumulator, value, index) => `${accumulator}${index}`, ''))
        const horizontalLine = local.board[0].reduce((accumulator) => `${accumulator}-`, '')
        console.log(`${horizontalLine}\\`)
        local.board.forEach((row, index) => {
            const rowString = row.reduce((accumulator, field) => {
                if(field.tank===''){
                    return `${accumulator} `
                } else {
                    const getArrow = (username) => {
                        const tankOwner = username===local.username ? local : online.find(user => user.username===username)
                        const tank = tankOwner && tankOwner.tank
                        const arrows = [
                            ['⇑', '⇗', '⇒', '⇘', '⇓', '⇙', '⇐', '⇖'],
                            ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖']
                        ]
                        return tank ? arrows[username===local.username ? 0 : 1][tank.rotation] : ' '
                    }
                    return `${accumulator}${getArrow(field.tank)}`
                }
            }, '')
            console.log(`${rowString}|${index}`)
        })
        console.log(`${horizontalLine}/`)
    }
    if(local.username!=='' || room!=='') {
        console.log()
    }
}

const getDataForPublish = user => ({
    username: user.username,
    playing: user.playing,
    tank: user.tank,
    score: user.score
})

const askQuestion = async questionString => new Promise(resolve => {
    rl.question(questionString, resolve)
})

// const getTopics = (room, username) => [
//     `${topicPrefix}/action/${room}/#`,
//     `${topicPrefix}/message/${room}/#`,
//     `${topicPrefix}/info/${room}/${username}`,
//     `${topicPrefix}/join/${room}/#`,
//     `${topicPrefix}/leave/${room}/#`
// ]

const joinRoom = async () => {
    render()
    const username = store.getState().reducerLocal.username
    const room = await askQuestion("Type room: ")
    store.dispatch(setRoomAction(room))

    client.subscribe(`${topicPrefix}/+/${room}/#`, () => {
    // client.subscribe(getTopics(room, username), () => {
        client.publish(`${topicPrefix}/join/${room}/${username}`, JSON.stringify({user: getDataForPublish(store.getState().reducerLocal)}), () => {
                setTimeout(() => {
                    // client.unsubscribe(`${topicPrefix}/info/${room}/${username}`)
                    store.dispatch(setJoiningAction(false))
                }, 1000)
            }
        )
    })
}

const start = async () => {
    render()
    store.subscribe(render)

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
            const messageTank = JSON.parse(message).tank
            store.dispatch(setPlayingOnlineAction(true, user))
            store.dispatch(setTankOnlineAction(messageTank.row, messageTank.column, messageTank.rotation, user))
            store.dispatch(setTankBoardAction(messageTank.row, messageTank.column, user))
        }
    }
})

rl.on('line', input => {
    const local = store.getState().reducerLocal
    const all = [local, ...store.getState().reducerOnline]
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
            // client.unsubscribe(getTopics(room, username))
            client.unsubscribe(`${topicPrefix}/+/${room}/#`)
            store.dispatch(resetOnlineAction())
            store.dispatch(resetLocalAction())
            client.publish(`${topicPrefix}/leave/${room}/${username}`, '{}')
        }

    } else if(input==='/join' && room===''){
        joinRoom()

    } else if(input==='/play' && room!=='' && !local.playing && all.filter(user => user.playing).length<4) {
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
        store.dispatch(setTankLocalAction(chosenField.indexRow, chosenField.indexColumn, rotation))
        store.dispatch(setTankBoardAction(chosenField.indexRow, chosenField.indexColumn, username))
        client.publish(`${topicPrefix}/play/${room}/${username}`, JSON.stringify({tank: {row: chosenField.indexRow, column: chosenField.indexColumn, rotation}}))

    } else if(input[0]!=='/' && room!==''){
        store.dispatch(addMessageAction(username, input))
        client.publish(`${topicPrefix}/message/${room}/${username}`, JSON.stringify({message: input}))

    } else {
        render()
    }
})