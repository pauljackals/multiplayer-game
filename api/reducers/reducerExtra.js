const {
    ADD_TOKEN
} = require('../types/typesExtra')

const reducerExtra = (state={}, action) => {
    switch (action.type) {
        case ADD_TOKEN: {
            const payload = action.payload
            return {...state, [payload.username]: payload.token}

        } default: {
            return state
        }
    }
}
module.exports = reducerExtra