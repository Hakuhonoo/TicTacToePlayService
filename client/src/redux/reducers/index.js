import {combineReducers} from "redux"
import {reducer as formReducer} from "redux-form";
import authReducer from "./authReducer";
import gamesReducer from "./gamesReducer";

export default combineReducers({
    auth: authReducer,
    games: gamesReducer,
    form: formReducer
})