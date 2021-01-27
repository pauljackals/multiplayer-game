const {commonReducerUser, INITIAL_STATE, fieldInitial} = require('./common/commonReducerUser')
const {
    SET_ROOM,
    SET_USERNAME,
    RESET_LOCAL,
    ADD_MESSAGE,
    SET_PLAYING_LOCAL,
    SET_TANK_LOCAL,
    SET_TANK_BOARD,
    SET_TURN_LOCAL,
    SET_PREVIOUS_NEXT_LOCAL,
    SET_FIRST_LOCAL,
    SET_READY_LOCAL,
    DECREMENT_ACTIONS_LOCAL,
    RESET_ACTIONS_LOCAL,
    DECREMENT_HEALTH_LOCAL,
    ADD_POINTS_LOCAL,
    SET_WINNER,
    ADD_CHAT_MESSAGE
} = require('../types/typesLocal')

const reducerLocal = (state=INITIAL_STATE, action) => {
    switch (action.type) {
        case SET_ROOM: {
            return {...state, room: action.payload.room}

        } case SET_USERNAME: {
            return {...state, username: action.payload.username}

        } case RESET_LOCAL: {
            return {...INITIAL_STATE, username: state.username}

        } case ADD_MESSAGE: {
            return {...state, messages: [...state.messages, action.payload.message]}

        } case SET_TANK_BOARD: {
            const payload = action.payload
            const board = state.board.map(row =>
                row.map(field => {
                    if(field.indexRow===payload.row && field.indexColumn===payload.column) {
                        return {...field, tank: payload.username}
                    } else if (field.tank===payload.username){
                        return {...field, ...fieldInitial}
                    } else {
                        return field
                    }
                })
            )
            return {...state, board}

        } case SET_WINNER: {
            return {...state, winner: action.payload}

        } case ADD_CHAT_MESSAGE: {
            const payload = action.payload
            const message = {
                text: payload.message,
                username: payload.messageAuthor
            }
            const username = payload.username
            const chatExists = !!state.chat.find(chat => chat.user===username)
            return {
                ...state,
                chat: chatExists ?
                    state.chat.map(
                        chat => chat.user===username ?
                            {...chat, messages: [...chat.messages, message]} :
                            chat
                    ) :
                    [{user: username, messages: [message]}]
            }

        } case ADD_POINTS_LOCAL:
        case DECREMENT_HEALTH_LOCAL:
        case RESET_ACTIONS_LOCAL:
        case DECREMENT_ACTIONS_LOCAL:
        case SET_TANK_LOCAL:
        case SET_TURN_LOCAL:
        case SET_PREVIOUS_NEXT_LOCAL:
        case SET_FIRST_LOCAL:
        case SET_READY_LOCAL:
        case SET_PLAYING_LOCAL: {
            return commonReducerUser(state, action)
        }
        default: {
            return state
        }
    }
}
module.exports = reducerLocal