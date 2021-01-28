const {
    SET_CURRENT_CHAT,
    ADD_CHAT_NOTIFICATION,
    REMOVE_CHAT_NOTIFICATION,
    SET_HELP,
    SET_CURRENT_USER
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
const setHelpAction = on => {
    return {type: SET_HELP, payload:{on}}
}
const setCurrentUserAction = currentUser => {
    return {type: SET_CURRENT_USER, payload:{currentUser}}
}

module.exports={
    setCurrentChatAction,
    addChatNotificationAction,
    removeChatNotificationAction,
    setHelpAction,
    setCurrentUserAction
}