const {
    SET_CURRENT_CHAT,
    ADD_CHAT_NOTIFICATION,
    REMOVE_CHAT_NOTIFICATION,
    SET_HELP,
    SET_CURRENT_USER,
    SET_NAME_CHECK_TIMEOUT_INTERVAL,
    CLEAR_NAME_CHECK_TIMEOUT_INTERVAL
} = require('../types/typesExtra')

const INITIAL_STATE = {
    currentChat: '',
    notifications: [],
    help: false,
    currentUser: '',
    timeout: undefined,
    interval: undefined
}
const reducerExtra = (state=INITIAL_STATE, action) => {
    switch (action.type) {
        case SET_CURRENT_CHAT: {
            return {...state, currentChat: action.payload.user}

        } case ADD_CHAT_NOTIFICATION: {
            return {...state, notifications: [...state.notifications, action.payload]}

        } case REMOVE_CHAT_NOTIFICATION: {
            const payload = action.payload
            const oldNotification = state.notifications.find(n => n.user===payload.user)
            if(oldNotification) {
                clearTimeout(oldNotification.timer)
            }
            return {...state, notifications: state.notifications.filter(n => n.user!==payload.user)}

        } case SET_HELP: {
            return {...state, help: action.payload.on}

        } case SET_CURRENT_USER: {
            return {...state, currentUser: action.payload.currentUser}

        } case SET_NAME_CHECK_TIMEOUT_INTERVAL: {
            const payload = action.payload
            return {...state, timeout: payload.timeout, interval: payload.interval}

        } case CLEAR_NAME_CHECK_TIMEOUT_INTERVAL: {
            return {...state, timeout: clearTimeout(state.timeout), interval: clearInterval(state.interval)}

        } default: {
            return state
        }
    }
}
module.exports = reducerExtra