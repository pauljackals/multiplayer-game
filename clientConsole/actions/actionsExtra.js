const {
    SET_CURRENT_CHAT
} = require('../types/typesExtra')

const setCurrentChatAction = user => {
    return {type: SET_CURRENT_CHAT, payload:{user}}
}

module.exports={
    setCurrentChatAction
}