const {
    SET_CURRENT_CHAT,
    ADD_CHAT_NOTIFICATION,
    REMOVE_CHAT_NOTIFICATION,
    SET_HELP,
    SET_CURRENT_USER
} = require('../types/typesExtra')

const INITIAL_STATE = {
    currentChat: '',
    notifications: [],
    help: false,
    currentUser: ''
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

        } default: {
            return state
        }
    }
}
module.exports = reducerExtra