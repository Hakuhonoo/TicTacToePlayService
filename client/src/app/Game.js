import React, {createRef} from "react";
import {withRouter} from "react-router-dom";
import io from "socket.io-client";
import {connect} from "react-redux";
import history from "../helpers/history";
import {gainScore} from "../redux/actions";
import _ from "lodash";
import "./game.scss";
import GameOverModal from "./GameOverModal";

class Game extends React.Component {
    state = {
        name: null,
        description: null,
        x: null,
        o: null,
        turn: '',
        side: '',
        desk: {},
        messages: [],
        modalText: null
    };

    socket = null;
    ready = false;
    messageRef = createRef();

    connect() {
        // Initialize socket
        if (!this.socket && this.props.auth) {
            console.log('connect');

            this.socket = io.connect(':4001', {transports: ['websocket']});
            this.socket.on('connect', () => {
                this.socket.emit('auth', {gameId: this.props.match.params.id, playerId: this.props.auth._id});
            });
            this.socket.on('err', data => {
                console.error(data);
            });
            this.socket.on('state', data => {
                this.onGotState(data);
            });
            this.socket.on('turn', data => {
                this.onGotTurn(data);
            });
            this.socket.on('win', data => {
                this.onGotWin(data);
            });
            this.socket.on('message', data => {
                this.onGotMessage(data);
            });
            this.socket.on('leave', () => {
                this.onGotLeave();
            });
        } else if (!this.props.auth)
            this.disconnect();
    }

    disconnect() {
        if (this.socket) {
            console.log('disconnect');

            this.socket.close();
            this.socket = null;
            this.ready = false;
        }
    }

    componentWillUnmount() {
        this.disconnect();
    }

    onGotState(data) {
        console.log('gotState');

        this.ready = true;

        const {name, description, turn, side, desk, x, o} = data;
        const xName = x ? x.name : null;
        const oName = o ? o.name : null;

        let newState = {
            name,
            description,
            x: xName,
            o: oName,
            turn,
            side,
            desk,
        };

        if (this.state.x !== xName || this.state.o !== oName) {
            const from = newState[this.invertSide(side)];
            if (from)
                newState.messages = [{
                    from,
                    message: <b>Joined the game</b>
                }, ...this.state.messages];
        }

        this.setState(newState);
    }

    onGotWin(data) {
        console.log('gotWin', data);

        if (data.side === this.state.side) { // Win
            this.props.gainScore();
            this.setState({modalText: 'You win!'});
        } else { // Lose
            this.setState({modalText: 'You lose...'});
        }
    }

    onGotTurn(data) {
        console.log('gotTurn');

        const turn = this.invertSide(this.state.turn);

        this.setState({
            desk: {...this.state.desk, [data.cellId]: data.side},
            turn,
        });
    }

    onGotMessage(message) {
        this.setState({
            messages: [{
                from: this.state[this.invertSide(this.state.side)],
                message
            }, ...this.state.messages]
        });
    }

    onGotLeave() {
        console.log('gotLeave');

        const side = this.invertSide(this.state.side);

        this.setState({
            messages: [{
                from: this.state[side],
                message: <b>Left the game</b>
            }, ...this.state.messages],
            [side]: null
        });
    }

    invertSide(side) {
        if(_.isEmpty(side))
            return side;

        return side === 'x' ? 'o' : 'x';
    }

    onMakeTurn(id) {
        if (this.ready && this.state.turn === this.state.side && !this.state.desk[id]) {
            console.log('turn');
            this.socket.emit('turn', {cellId: id});
        }
    }

    getCurrentTurnText() {
        return this.state.turn === this.state.side ? 'Your turn' : 'Opponent\'s turn';
    }

    getCurrentPlayerText() {
        const currentPlayerName = this.state[this.state.turn];
        if (!currentPlayerName)
            return this.state.turn.toUpperCase();

        return `${currentPlayerName} (${this.state.turn.toUpperCase()})`;
    }

    onSendMessage() {
        const message = this.messageRef.current.value;
        if (_.isEmpty(message) || !this.ready)
            return;

        this.setState({
            messages: [{
                from: this.state[this.state.side],
                message
            }, ...this.state.messages]
        });

        this.messageRef.current.value = '';
        this.socket.emit('message', message);
    }

    onMessageKeyPress = e => {
        if (e.key !== 'Enter')
            return;

        this.onSendMessage();
    }

    onLeave = () => {
        this.socket.emit('leave');
        history.push('/');
    }

    onModalClose = () => {
        history.push('/');
    }

    renderChatMessage(id, from, message) {
        return (
            <div className="item" key={id}>
                <i className="right comment outline icon"/>
                <div className="content">
                    <div className="header">{from}</div>
                    <div className="description">{message}</div>
                </div>
            </div>
        );
    }

    renderChat() {
        return (
            <div className="ui sixteen wide segment chat">
                <div className="wrapper">
                    <div className="ui list">
                        {this.state.messages.map((m, id) => this.renderChatMessage(id, m.from, m.message))}
                    </div>
                </div>
                <div className="ui action fluid input">
                    <input type="text" placeholder="Type message here..." ref={this.messageRef} onKeyPress={this.onMessageKeyPress}/>
                    <button className="ui primary button" onClick={this.onSendMessage.bind(this)}>Send</button>
                </div>
            </div>
        );
    }

    renderModal() {
        if (!this.state.modalText)
            return null;

        return (
            <GameOverModal onClose={this.onModalClose}>
                {this.state.modalText}
            </GameOverModal>
        );
    }

    render() {
        if (!this.props.auth) {
            this.disconnect();

            return (
                <div className="ui container">
                    <div>Please sign in</div>
                </div>
            );
        }

        this.connect();

        return (
            <div className="ui grid stackable container game">
                <h1 className="ui sixteen wide center aligned column">{this.state.name || 'Game'}</h1>
                {_.isEmpty(this.state.description) ||
                <h3 className="ui sixteen wide center aligned column">{this.state.description}</h3>}
                <div className="ui eleven wide column">
                    <div className="ui three column grid desk">
                        {[...Array(9).keys()].map(id =>
                            <div key={id} className={`column ${this.state.desk[id] ? '' : 'empty'}`}
                                 onClick={this.onMakeTurn.bind(this, id)}>
                                <b>{this.state.desk[id] || ''}</b>
                            </div>
                        )}
                    </div>
                </div>
                <div className="ui five wide column">
                    <h4 className="ui sub header">Players</h4>
                    <div className="ui small feed">
                        <div className="event">
                            <div className="content">
                                <div className="summary">
                                    X: {this.state.x ? this.state.x : <i>Waiting for a player...</i>}
                                </div>
                            </div>
                        </div>
                        <div className="event">
                            <div className="content">
                                <div className="summary">
                                    O: {this.state.o ? this.state.o : <i>Waiting for a player...</i>}
                                </div>
                            </div>
                        </div>
                    </div>
                    <h4 className="ui sub header">{this.getCurrentTurnText()}</h4>
                    <div className="ui small feed">
                        <div className="event">
                            <div className="content">
                                <div className="summary">
                                    {this.getCurrentPlayerText()}
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="ui button" onClick={this.onLeave}>Leave the game</button>
                    <hr className="ui divider"/>
                    {this.renderChat()}
                </div>
                {this.renderModal()}
            </div>
        );
    }
}

const mapStateToProps = state => ({
    auth: state.auth
});

export default connect(mapStateToProps, {gainScore})(withRouter(Game));
