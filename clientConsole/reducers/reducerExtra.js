const {
    SET_CURRENT_CHAT
} = require('../types/typesExtra')

const reducerExtra = (state={currentChat: ''}, action) => {
    switch (action.type) {
        case SET_CURRENT_CHAT: {
            return {...state, currentChat: action.payload.user}

        } default: {
            return state
        }
    }
}
module.exports = reducerExtra