const {
    SET_HELP,
    SET_CURRENT_USER
} = require('../types/typesExtra')

const setHelpAction = on => {
    return {type: SET_HELP, payload:{on}}
}
const setCurrentUserAction = currentUser => {
    return {type: SET_CURRENT_USER, payload:{currentUser}}
}

module.exports={
    setHelpAction,
    setCurrentUserAction
}