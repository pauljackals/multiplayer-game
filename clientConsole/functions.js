const render = store => () => {
    console.clear()
    const state = store.getState()
    const local = state.reducerLocal
    const online = state.reducerOnline
    const extra = state.reducerExtra
    const room = local.room

    if(local.username!=='' || room!=='') {
        console.log(`User: ${local.username}`)
    }

    if(extra.currentChat.length) {
        const currentChatUser = extra.currentChat
        console.log(`Chat User: ${currentChatUser}`)
        console.log()
        console.log("Messages:")
        const currentChat = local.chat.find(chat => chat.user===currentChatUser)
        if(currentChat) {
            currentChat.messages.slice(-15).forEach(message => console.log(`  /${message.username}/ ${message.text}`))
        }
        console.log()

    } else {
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

            const gameInProgress = allPlaying.length && allPlaying.find(u => u.turn)

            const printUser = user => {
                console.log(`${gameInProgress ? (user.turn ? '>' : ' ') : (user.ready ? '✓' : 'X')} ${user.username} | ${user.score}p | ${'+'.repeat(user.tank.health)}${'-'.repeat(3-user.tank.health)} | ${'a'.repeat(user.tank.actions)}${'_'.repeat(3-user.tank.actions)} | r${user.tank.row},c${user.tank.column}`)

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

            if(!local.winner.username.length) {
                console.log(local.board[0].reduce((accumulator, value, index) => `${accumulator}${index}`, '  '))
                const horizontalLine = local.board[0].reduce((accumulator) => `${accumulator}-`, '')
                console.log(` /${horizontalLine}\\`)
                const isLineOfSight = (row, column) => {
                    const tank = local.tank
                    const rotation = tank.rotation
                    if(rotation===0) {
                        return row < tank.row && column===tank.column;

                    } else if (rotation===1){
                        return column > tank.column && row===tank.row;

                    } else if (rotation===2){
                        return row > tank.row && column===tank.column;

                    } else if (rotation===3){
                        return column < tank.column && row===tank.row;
                    }
                }
                local.board.forEach((row, index) => {
                    const rowString = row.reduce((accumulator, field, indexField) => {
                        if(field.tank===''){
                            return `${accumulator}${local.turn && local.tank.actions && local.tank.health && isLineOfSight(index, indexField) ? '•' : ' '}`
                        } else {
                            const getArrow = (username) => {
                                const tankOwner = username===local.username ? local : online.find(user => user.username===username)
                                const tank = tankOwner && tankOwner.tank
                                const arrows = [
                                    // ['⇑', '⇗', '⇒', '⇘', '⇓', '⇙', '⇐', '⇖'],
                                    // ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'],
                                    ['⇑', '⇒', '⇓', '⇐'],
                                    ['↑', '→', '↓', '←']
                                ]
                                return tank ? (tank.health ? arrows[username===local.username ? 0 : 1][tank.rotation] : 'X') : '?'
                            }
                            return `${accumulator}${getArrow(field.tank)}`
                        }
                    }, '')
                    console.log(`${index}|${rowString}|`)
                })
                console.log(` \\${horizontalLine}/`)
                if(local.turn) {
                    console.log("*Your turn*")
                }

            } else {
                console.log(`*${local.winner.username} has won with a score of ${local.winner.score}*`)
            }
        }
        if(local.username!=='' || room!=='') {
            console.log()
        }
    }
}

module.exports= {render}