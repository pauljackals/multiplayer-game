const {
    SET_PLAYING_LOCAL,
    SET_TANK_LOCAL,
    SET_TURN_LOCAL,
    SET_PREVIOUS_NEXT_LOCAL,
    SET_FIRST_LOCAL,
    SET_READY_LOCAL
} = require('../../types/typesLocal')
const {
    SET_PLAYING_ONLINE,
    SET_TANK_ONLINE,
    SET_TURN_ONLINE,
    SET_FIRST_ONLINE,
    SET_PREVIOUS_NEXT_ONLINE,
    SET_READY_ONLINE
} = require('../../types/typesOnline')

const commonReducerUser = (state, action) => {
    switch (action.type) {
        case SET_PLAYING_ONLINE:
        case SET_PLAYING_LOCAL: {
            return {...state, playing: action.payload.playing}

        } case SET_TANK_ONLINE:
        case SET_TANK_LOCAL: {
            const payload = action.payload
            const tank = {row: payload.row, column: payload.column, rotation: payload.rotation}
            return {...state, tank: {...state.tank, ...tank}}

        } case SET_TURN_ONLINE:
        case SET_TURN_LOCAL: {
            return {...state, turn: action.payload.turn}

        } case SET_PREVIOUS_NEXT_ONLINE:
        case SET_PREVIOUS_NEXT_LOCAL: {
            const previous = action.payload.previous
            const next = action.payload.next
            return {...state, previous: (previous!==undefined ? previous : state.previous), next: (next!==undefined ? next : state.next)}

        } case SET_FIRST_ONLINE:
        case SET_FIRST_LOCAL: {
            return {...state, first: action.payload.first}

        } case SET_READY_ONLINE:
        case SET_READY_LOCAL: {
            return {...state, ready: action.payload.ready}

        } default: {
            return state
        }
    }
}
module.exports = commonReducerUser