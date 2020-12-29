const readline = require('readline')
const mqtt = require('mqtt')
const {setRoomAction, setUsernameAction, resetLocalAction} = require('./actions/actionsLocal')
const {addUserAction, removeUserAction, resetOnlineAction} = require('./actions/actionsOnline')

const arguments = process.argv.slice(2)
if (arguments.length !== 1){
    console.log('You must provide a broker address')
    process.exit(1)
}

const hostAddress = arguments[0]

const client = mqtt.connect(`mqtt://${hostAddress}`)

client.on('error', error => {
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
        all.forEach(user => console.log(user.username))
    }
    if(local.username!=='' || room!=='') {
        console.log()
    }
}

const getDataForPublish = (user) => ({
    username: user.username,
    playing: user.playing
})

const askQuestion = async questionString => new Promise(resolve => {
    rl.question(questionString, resolve)
})

const getTopics = (room, username) => [
    `${topicPrefix}/action/${room}/#`,
    `${topicPrefix}/message/${room}/#`,
    `${topicPrefix}/info/${room}/${username}`,
    `${topicPrefix}/join/${room}/#`,
    `${topicPrefix}/leave/${room}/#`
]

const joinRoom = async () => {
    render()
    const username = store.getState().reducerLocal.username
    const room = await askQuestion("Type room: ")
    store.dispatch(setRoomAction(room))

    client.subscribe(getTopics(room, username), () => {
        client.publish(`${topicPrefix}/join/${room}/${username}`, JSON.stringify({user: getDataForPublish(store.getState().reducerLocal)}), () => {
                setTimeout(() => {
                    client.unsubscribe(`${topicPrefix}/info/${room}/${username}`)
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

    if(topicSplit[1] === 'join'){
        const user = topicSplit[3]
        if(user !== store.getState().reducerLocal.username) {
            store.dispatch(addUserAction(JSON.parse(message).user))
            client.publish(topic.replace('join', 'info'), JSON.stringify({user: getDataForPublish(store.getState().reducerLocal)}))
        }

    } else if(topicSplit[1]==='info') {
        store.dispatch(addUserAction(JSON.parse(message).user))

    } else if(topicSplit[1]==='leave') {
        const user = topicSplit[3]
        store.dispatch(removeUserAction(user))
    }
})

rl.on('line', input => {
    const room = store.getState().reducerLocal.room
    const username = store.getState().reducerLocal.username
    if(input==='/exit' && room === ''){
        rl.close()
        client.end()
        console.clear()
        console.log("Stopping client...")
        process.exit()

    } else if(input==='/exit' && room !== '') {
        client.unsubscribe(getTopics(room, username))
        client.publish(`${topicPrefix}/leave/${room}/${username}`, '{}')
        store.dispatch(resetOnlineAction())
        store.dispatch(resetLocalAction())

    } else if(input==='/join' && room===''){
        joinRoom()
    } else if(input[0]!=='/' && room!==''){
        client.publish(`${topicPrefix}/leave/${room}/${username}`, JSON.stringify({message: input}))
    } else {
        render()
    }
})