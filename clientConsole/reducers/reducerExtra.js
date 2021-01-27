const {
    SET_CURRENT_CHAT,
    ADD_CHAT_NOTIFICATION,
    REMOVE_CHAT_NOTIFICATION
} = require('../types/typesExtra')

const reducerExtra = (state={currentChat: '', notifications: []}, action) => {
    switch (action.type) {
        case SET_CURRENT_CHAT: {
            return {...state, currentChat: action.payload.user}

        } case ADD_CHAT_NOTIFICATION: {
            return {...state, notifications: [...state.notifications, action.payload]}

        }  case REMOVE_CHAT_NOTIFICATION: {
            const payload = action.payload
            const oldNotification = state.notifications.find(n => n.user===payload.user)
            if(oldNotification) {
                clearTimeout(oldNotification.timer)
            }
            return {...state, notifications: state.notifications.filter(n => n.user!==payload.user)}

        } default: {
            return state
        }
    }
}
module.exports = reducerExtra