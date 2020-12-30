const render = store => () => {
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
        const all = [local, ...online]
        const [allSpectating, allPlaying] = all.reduce(
            (accumulator, user) => !user.playing ? [[...accumulator[0], user], accumulator[1]] : [accumulator[0], [...accumulator[1], user]], [[], []]
        )
        const allSpectatingSorted = [...allSpectating].sort(
            (user1, user2) => user1.username > user2.username ? 1
                : (user1.username < user2.username ? -1
                    : 0)
        )
        console.log("Spectating:")
        allSpectatingSorted.forEach(user => console.log(`  ${user.username}`))
        console.log("Playing:")

        const printUser = (user) => {
            console.log(`  ${user.username} | ${user.score}p | ${'+'.repeat(user.tank.health)}${'-'.repeat(3-user.tank.health)} | ${'a'.repeat(user.tank.actions)}${'_'.repeat(3-user.tank.actions)} | r${user.tank.row},c${user.tank.column}`)

            if(user.next!==user.username) {
                const nextUser = allPlaying.find(userNext => userNext.username===user.next)
                if(nextUser && !nextUser.first){
                    printUser(nextUser)
                }
            }
        }
        const firstPlayer = allPlaying.find(user => user.first)
        if(firstPlayer){
            printUser(firstPlayer)
        }
        console.log()
        console.log("Messages:")
        local.messages.slice(-5).forEach(message => console.log(`  /${message.username}/ ${message.text}`))

        console.log()
        console.log(local.board[0].reduce((accumulator, value, index) => `${accumulator}${index}`, ' '))
        const horizontalLine = local.board[0].reduce((accumulator) => `${accumulator}-`, '')
        console.log(`/${horizontalLine}\\`)
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
                        return tank ? arrows[username===local.username ? 0 : 1][tank.rotation] : '?'
                    }
                    return `${accumulator}${getArrow(field.tank)}`
                }
            }, '')
            console.log(`|${rowString}|${index}`)
        })
        console.log(`\\${horizontalLine}/`)
    }
    if(local.username!=='' || room!=='') {
        console.log()
    }
}

module.exports= {render}