import React from "react";
import {Route, Router, Switch} from "react-router-dom";
import {Provider} from "react-redux";
import {applyMiddleware, createStore} from "redux";
import {composeWithDevTools} from "redux-devtools-extension";
import thunk from "redux-thunk";
import reducers from "../redux/reducers"
import history from "../helpers/history";
import MainMenu from "./MainMenu";
import GameList from "./GameList";
import MakeGame from "./MakeGame";
import Game from "./Game";

const store = createStore(
    reducers,
    composeWithDevTools(applyMiddleware(thunk))
);

class App extends React.Component {
    render() {
        return (
            <Router history={history}>
                <Provider store={store}>
                    <MainMenu/>
                    <div className="ui vertical segment">
                        <Switch>
                            <Route path="/game/:id">
                                <Game/>
                            </Route>
                            <Route path="/make">
                                <MakeGame/>
                            </Route>
                            <Route path="/">
                                <GameList/>
                            </Route>
                        </Switch>
                    </div>
                </Provider>
            </Router>
        );
    }
}

export default App;