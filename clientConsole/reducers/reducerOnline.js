const {
    ADD_USER,
    REMOVE_USER,
    RESET_ONLINE,
    SET_PLAYING_ONLINE,
    SET_TANK_ONLINE,
    SET_TURN_ONLINE
} = require('../types/typesOnline')

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
        } case SET_TANK_ONLINE: {
            const payload = action.payload
            const tank = {row: payload.row, column: payload.column, rotation: payload.rotation}
            return state.map(user => user.username===payload.username ? {...user, tank: {...user.tank, ...tank}} : user)
        } case SET_TURN_ONLINE: {
            return state.map(user => user.username===action.payload.username ? {...user, turn: action.payload.turn} : user)
        } default: {
            return state
        }
    }
}
module.exports = reducerOnline