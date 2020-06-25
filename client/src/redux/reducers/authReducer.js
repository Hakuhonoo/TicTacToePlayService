import actions from "../actions/actions";

export default (state = null, action) => {
    switch (action.type) {
        case actions.GAIN_SCORE:
            return {...state, score: state.score + 1};
        case actions.SIGN_IN:
            return action.payload;
        case actions.SIGN_OUT:
            return null;
        default:
    }
    return state;
};
