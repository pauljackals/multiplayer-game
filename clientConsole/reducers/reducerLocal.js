const commonReducerUser = require('./common/commonReducerUser')
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
    RESET_ACTIONS_LOCAL
} = require('../types/typesLocal')

const fieldInitial = {tank: ''}
const generateBoard = side => Array(side).fill([]).map(
    (row, indexRow) => Array(side).fill({}).map(
        (field, indexColumn) => ({indexRow, indexColumn, ...fieldInitial})
    )
)

const INITIAL_STATE = {
    board: generateBoard(10),
    playing: false,
    tank: {
        health: 3,
        row: -1,
        column: -1,
        rotation: -1,
        actions: 3
    },
    score: 0,
    username: '',
    room: '',
    messages: [],
    turn: false,
    next: '',
    previous: '',
    first: true,
    ready: false
}

// const reducerLocal = (state=INITIAL_STATE, action) => {
//     switch (action.type) {
//         case SET_ROOM: {
//             return {...state, room: action.payload.room}
//
//         } case SET_USERNAME: {
//             return {...state, username: action.payload.username}
//
//         } case RESET_LOCAL: {
//             return {...INITIAL_STATE, username: state.username}
//
//         } case ADD_MESSAGE: {
//             return {...state, messages: [...state.messages, action.payload.message]}
//
//         } case SET_JOINING: {
//             return {...state, joining: action.payload.joining}
//
//         } case SET_PLAYING_LOCAL: {
//             return {...state, playing: action.payload.playing}
//
//         } case SET_TANK_LOCAL: {
//             const payload = action.payload
//             const tank = {row: payload.row, column: payload.column, rotation: payload.rotation}
//             return {...state, tank: {...state.tank, ...tank}}
//
//         } case SET_TANK_BOARD: {
//             const payload = action.payload
//             const board = state.board.map(row =>
//                 row.map(field => {
//                     if(field.indexRow===payload.row && field.indexColumn===payload.column) {
//                         return {...field, tank: payload.username}
//                     } else if (field.tank===payload.username){
//                         return {...field, ...fieldInitial}
//                     } else {
//                         return field
//                     }
//                 })
//             )
//             return {...state, board}
//
//         } case SET_TURN_LOCAL: {
//             return {...state, turn: action.payload.turn}
//
//         } case SET_PREVIOUS_NEXT_LOCAL: {
//             const previous = action.payload.previous
//             const next = action.payload.next
//             return {...state, previous: (previous!==undefined ? previous : state.previous), next: (next!==undefined ? next : state.next)}
//
//         } case SET_FIRST_LOCAL: {
//             return {...state, first: action.payload.first}
//
//         } case SET_READY_LOCAL: {
//             return {...state, ready: action.payload.ready}
//
//         } default: {
//             return state
//         }
//     }
// }
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

        } case RESET_ACTIONS_LOCAL:
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