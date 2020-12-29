const {ADD_USER, REMOVE_USER, RESET_ONLINE, SET_PLAYING_ONLINE} = require('../types/typesOnline')

const reducerOnline = (state=[], action) => {
    switch (action.type) {
        case ADD_USER: {
            return [...state, action.payload.user]
        } case REMOVE_USER: {
            return state.filter(user => user.username !== action.payload.username)
        } case RESET_ONLINE: {
            return []
        } case SET_PLAYING_ONLINE: {
            return state.map(user => user.username===action.payload.username ? {...user, playing: action.payload.playing} : user)
        } default: {
            return state
        }
    }
}
module.exports = reducerOnline