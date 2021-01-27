const {
    SET_CURRENT_CHAT,
    ADD_CHAT_NOTIFICATION,
    REMOVE_CHAT_NOTIFICATION
} = require('../types/typesExtra')

const setCurrentChatAction = user => {
    return {type: SET_CURRENT_CHAT, payload:{user}}
}
const addChatNotificationAction = (user, timer) => {
    return {type: ADD_CHAT_NOTIFICATION, payload:{user, timer}}
}
const removeChatNotificationAction = user => {
    return {type: REMOVE_CHAT_NOTIFICATION, payload:{user}}
}

module.exports={
    setCurrentChatAction,
    addChatNotificationAction,
    removeChatNotificationAction
}