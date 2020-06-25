import React from "react";
import {signIn, signOut} from "../redux/actions";
import {connect} from "react-redux";

class GoogleAuth extends React.Component {
    state = {isSignedIn: null};

    componentDidMount() {
        window.gapi.load('client:auth2', () => {
            window.gapi.client.init({
                clientId: '<YOUR_CLIENT_ID>',
                scope: 'profile'
            }).then(() => {
                this.auth = window.gapi.auth2.getAuthInstance();
                this.auth.isSignedIn.listen(this.onAuthChanged);
                this.onAuthChanged();
            });
        });
    }

    onAuthChanged = () => {
        if (this.auth.isSignedIn.get()) {
            this.props.signIn(this.auth);
        } else {
            this.props.signOut();
        }
    }

    onSignIn = (e) => {
        this.auth.signIn();
        e.preventDefault();
    }

    onSignOut = (e) => {
        this.auth.signOut();
        e.preventDefault();
    }

    setActive = path => this.props.path === path ? 'active' : '';

    render() {
        if (this.props.isSignedIn === null) {
            return (
                <div className="item">
                    <button className="ui loading red button"/>
                </div>
            );
        } else if (this.props.isSignedIn) {
            return (
                <>
                    <div className="item">Score = {this.props.score}</div>
                    <div className="item">Hello, {this.props.userName}!</div>
                    <div className="item">
                        <button onClick={this.onSignOut} className="ui google red button">
                            <i className="google icon"/>
                            Sign Out
                        </button>
                    </div>
                </>
            );
        } else {
            return (
                <div className="item">
                    <button onClick={this.onSignIn} className="ui google red button">
                        <i className="google icon"/>
                        Sign In
                    </button>
                </div>
            );
        }
    }
}

const mapStateToProps = state => {
    return {
        isSignedIn: !!state.auth,
        userName: state.auth ? state.auth.name : '',
        score: state.auth ? state.auth.score : 0,
    };
};

export default connect(mapStateToProps, {signIn, signOut})(GoogleAuth);