const commonReducerUser = require('./common/commonReducerUser')
const {
    ADD_USER,
    REMOVE_USER,
    RESET_ONLINE,
    SET_PLAYING_ONLINE,
    SET_TANK_ONLINE,
    SET_TURN_ONLINE,
    SET_FIRST_ONLINE,
    SET_PREVIOUS_NEXT_ONLINE,
    SET_READY_ONLINE
} = require('../types/typesOnline')

// const reducerOnline = (state=[], action) => {
//     switch (action.type) {
//         case ADD_USER: {
//             return [...state, action.payload.user]
//
//         } case REMOVE_USER: {
//             return state.filter(user => user.username !== action.payload.username)
//
//         } case RESET_ONLINE: {
//             return []
//
//         } case SET_PLAYING_ONLINE: {
//             return state.map(user => user.username===action.payload.username ? {...user, playing: action.payload.playing} : user)
//
//         } case SET_TANK_ONLINE: {
//             const payload = action.payload
//             const tank = {row: payload.row, column: payload.column, rotation: payload.rotation}
//             return state.map(user => user.username===payload.username ? {...user, tank: {...user.tank, ...tank}} : user)
//
//         } case SET_TURN_ONLINE: {
//             return state.map(user => user.username===action.payload.username ? {...user, turn: action.payload.turn} : user)
//
//         } case SET_FIRST_ONLINE: {
//             return state.map(user => user.username===action.payload.username ? {...user, first: action.payload.first} : user)
//
//         } case SET_PREVIOUS_NEXT_ONLINE: {
//             const previous = action.payload.previous
//             const next = action.payload.next
//             return state.map(user => user.username===action.payload.username ? {...user, previous: (previous!==undefined ? previous : user.previous), next: (next!==undefined ? next : user.next)} : user)
//
//         } case SET_READY_ONLINE: {
//             return state.map(user => user.username===action.payload.username ? {...user, ready: action.payload.ready} : user)
//
//         } default: {
//             return state
//         }
//     }
// }
const reducerOnline = (state=[], action) => {
    switch (action.type) {
        case ADD_USER: {
            return [...state, action.payload.user]

        } case REMOVE_USER: {
            return state.filter(user => user.username !== action.payload.username)

        } case RESET_ONLINE: {
            return []

        } case SET_PLAYING_ONLINE:
        case SET_TANK_ONLINE:
        case SET_TURN_ONLINE:
        case SET_FIRST_ONLINE:
        case SET_PREVIOUS_NEXT_ONLINE:
        case SET_READY_ONLINE: {
            return state.map(
                user => user.username===action.payload.username ?
                    commonReducerUser(user, action) : user
            )
        } default: {
            return state
        }
    }
}
module.exports = reducerOnline