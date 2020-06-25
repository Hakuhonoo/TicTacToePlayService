import _ from "lodash";
import actions from "./actions";
import ticTacToeServer from "../../apis/ticTacToeServer";

export const signIn = auth => async dispatch => {
    const user = auth.currentUser.get();
    const payload = {
        _id: parseInt(user.getId()),
        name: user.getBasicProfile().getName()
    };

    const response = await ticTacToeServer.post('/signIn', payload);

    dispatch({
        type: actions.SIGN_IN,
        payload: response.data
    });
};

export const signOut = () => {
    return({
        type: actions.SIGN_OUT
    });
};

export const makeGame = (data, callback) => async dispatch => {
    const response = await ticTacToeServer.post(`/makeGame`, data);

    dispatch({
        type: actions.MAKE_GAME,
        payload: response.data
    });

    if (_.isFunction(callback))
        callback(response.data._id);
};

export const joinGame = (data, callback) => async dispatch => {
    const response = await ticTacToeServer.post('/joinGame', data);
    if (!response.data)
        return;

    dispatch({
        type: actions.JOIN_GAME,
        payload: data
    });

    if (_.isFunction(callback))
        callback();
};

export const gainScore = () => {
    return({
        type: actions.GAIN_SCORE
    });
};

export const fetchGames = () => async dispatch => {
    const response = await ticTacToeServer.get(`/fetchGames`);

    dispatch({
        type: actions.FETCH_GAMES,
        payload: response.data
    });
};
