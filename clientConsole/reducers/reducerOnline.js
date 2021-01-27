const {commonReducerUser} = require('./common/commonReducerUser')
const {
    ADD_USER,
    REMOVE_USER,
    RESET_ONLINE,
    SET_PLAYING_ONLINE,
    SET_TANK_ONLINE,
    SET_TURN_ONLINE,
    SET_FIRST_ONLINE,
    SET_PREVIOUS_NEXT_ONLINE,
    SET_READY_ONLINE,
    DECREMENT_ACTIONS_ONLINE,
    RESET_ACTIONS_ONLINE,
    DECREMENT_HEALTH_ONLINE,
    ADD_POINTS_ONLINE
} = require('../types/typesOnline')

const reducerOnline = (state=[], action) => {
    switch (action.type) {
        case ADD_USER: {
            return [...state, action.payload.user]

        } case REMOVE_USER: {
            return state.filter(user => user.username !== action.payload.username)

        } case RESET_ONLINE: {
            return []

        } case ADD_POINTS_ONLINE:
        case DECREMENT_HEALTH_ONLINE:
        case RESET_ACTIONS_ONLINE:
        case DECREMENT_ACTIONS_ONLINE:
        case SET_PLAYING_ONLINE:
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