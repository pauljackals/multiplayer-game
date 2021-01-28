const {
    SET_CURRENT_CHAT,
    ADD_CHAT_NOTIFICATION,
    REMOVE_CHAT_NOTIFICATION,
    SET_HELP,
    SET_CURRENT_USER,
    SET_NAME_CHECK_TIMEOUT_INTERVAL,
    CLEAR_NAME_CHECK_TIMEOUT_INTERVAL
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
const setNameCheckTimeoutIntervalAction = (timeout, interval) => {
    return {type: SET_NAME_CHECK_TIMEOUT_INTERVAL, payload:{timeout, interval}}
}
const clearNameCheckTimeoutIntervalAction = () => {
    return {type: CLEAR_NAME_CHECK_TIMEOUT_INTERVAL}
}

module.exports={
    setCurrentChatAction,
    addChatNotificationAction,
    removeChatNotificationAction,
    setHelpAction,
    setCurrentUserAction,
    setNameCheckTimeoutIntervalAction,
    clearNameCheckTimeoutIntervalAction
}