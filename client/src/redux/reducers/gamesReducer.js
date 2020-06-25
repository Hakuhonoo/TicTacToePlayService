import actions from "../actions/actions";
import _ from "lodash"

export default (state = {}, action) => {
    switch (action.type) {
        case actions.FETCH_GAMES:
            return _.reduce(action.payload, (res, game) => {
                res[game._id] = game;
                return res;
            }, {});
        default:
    }
    return state;
};
