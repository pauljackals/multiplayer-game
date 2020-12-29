const {ADD_USER, REMOVE_USER, RESET_ONLINE} = require('../types/typesOnline')

const reducerOnline = (state=[], action) => {
    switch (action.type) {
        case ADD_USER: {
            return [...state, action.payload.user]
        } case REMOVE_USER: {
            return state.filter(user => user.username !== action.payload.username)
        } case RESET_ONLINE: {
            return []
        } default: {
            return state
        }
    }
}
module.exports = reducerOnline