const {
    START_NAME_CHECK,
    CLEAR_NAME_CHECK,
    REMOVE_NAME_CHECK
}=require('../types/typesNameCheck')

const reducerNameCheck = (state={}, action) => {
    switch (action.type) {
        case START_NAME_CHECK: {
            const payload = action.payload
            return {
                ...state,
                [payload.id]: {
                    interval: payload.interval,
                    timeout: payload.timeout,
                    free: false,
                    finished: false
                }
            }
        } case CLEAR_NAME_CHECK: {
            const payload = action.payload
            const items = state[payload.id]
            if(items) {
                clearTimeout(items.timeout)
                clearInterval(items.interval)
                return {
                    ...state,
                    [payload.id]: {
                        ...state[payload.id],
                        free: payload.free,
                        finished: true
                    }
                }
            } else {
                return state
            }
        } case REMOVE_NAME_CHECK: {
            return {
                ...state,
                [action.payload.id]: undefined
            }
        } default: {
            return state
        }
    }
}
module.exports=reducerNameCheck