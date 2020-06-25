import React from "react";
import {Link} from "react-router-dom";
import {connect} from "react-redux";
import {joinGame} from "../redux/actions";
import history from "../helpers/history";

class GameOverview extends React.Component {
    onJoinGame = e => {
        this.props.joinGame({
            playerId: this.props.auth._id,
            gameId: this.props.game._id,
            side: this.props.game.x ? 'o' : 'x'
        }, () => {
            history.push(`/game/${this.props.game._id}`);
        });
        e.preventDefault();
    }

    renderButton() {
        if (!this.props.auth) { // No auth
            return (
                <Link to="" className='ui button disabled'>
                    Game in progress...
                </Link>
            );
        }

        const alreadyJoined =
            (this.props.game.x && this.props.game.x._id === this.props.auth._id) ||
            (this.props.game.o && this.props.game.o._id === this.props.auth._id);

        const haveFreeSpace = !this.props.game.x || !this.props.game.o;

        if (haveFreeSpace && !alreadyJoined) { // Can join
            return (
                <Link to={`/game/${this.props.game._id}`} className='ui button' onClick={this.onJoinGame}>
                    Join Game
                </Link>
            );
        } else if (alreadyJoined) { // Can resume
            return (
                <Link to={`/game/${this.props.game._id}`} className='ui button'>
                    Resume Game
                </Link>
            );
        } else { // Full game
            return (
                <Link to="" className='ui button disabled'>
                    Join Game
                </Link>
            );
        }
    }

    render() {
        return (
            <div className="centered column">
                <div className="ui fluid card">
                    <div className="content">
                        <div className="header">{this.props.game.name}</div>
                    </div>
                    <div className="content">
                        <h4 className="ui sub header">Description</h4>
                        <div className="ui small feed">
                            <div className="event">
                                <div className="content">
                                    <div className="summary">
                                        {this.props.game.description ? this.props.game.description : 'No description'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h4 className="ui sub header">Players</h4>
                        <div className="ui small feed">
                            <div className="event">
                                <div className="content">
                                    <div className="summary">
                                        X: {this.props.game.x ? this.props.game.x.name : <i>Waiting for a player...</i>}
                                    </div>
                                </div>
                            </div>
                            <div className="event">
                                <div className="content">
                                    <div className="summary">
                                        O: {this.props.game.o ? this.props.game.o.name : <i>Waiting for a player...</i>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="extra content">
                        {this.renderButton()}
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => ({
    auth: state.auth
});

export default connect(mapStateToProps, {joinGame})(GameOverview);
