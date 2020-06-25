import React from "react";
import {Link} from "react-router-dom";
import GoogleAuth from "../apis/GoogleAuth"
import history from "../helpers/history";

class MainMenu extends React.Component {
    state = {path: '/'};

    componentDidMount() {
        history.listen((e) => {
            this.setState({path: e.location.pathname});
        });
    }

    setActive = path => this.state.path === path ? 'active' : '';

    render() {
        return (
            <nav id="main-menu" className="ui massive attached stackable menu">
                <div className="ui container">
                    <Link to="/" className={`item ${this.setActive('/')}`}>TicTacToe</Link>
                    <Link to="/make" className={`item ${this.setActive('/make')}`}>New game</Link>
                    <div className="right menu">
                        <GoogleAuth path={this.state.path}/>
                    </div>
                </div>
            </nav>
        );
    }
}

export default MainMenu;
