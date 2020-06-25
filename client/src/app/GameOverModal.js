import React from "react";
import {createPortal} from "react-dom";
import _ from "lodash"

const modalRoot = document.getElementById('modal');

class GameOverModal extends React.Component {
    element = document.createElement('div');

    componentDidMount() {
        modalRoot.appendChild(this.element);
    }

    componentWillUnmount() {
        modalRoot.removeChild(this.element);
    }

    onClose = e => {
        e.stopPropagation();

        if (_.isFunction(this.props.onClose))
            this.props.onClose();
    }

    render() {
        return createPortal(
            <div className="ui dimmer modals active" onClick={this.onClose}>
                <div className="ui standard modal active">
                    <div className="header">
                        Game over
                    </div>
                    <div className="content">
                        <div className="ui header">{this.props.children}</div>
                    </div>
                    <div className="actions">
                        <div className="ui positive right labeled icon button" onClick={this.onClose}>
                            Ok
                            <i className="checkmark icon"/>
                        </div>
                    </div>
                </div>
            </div>,
            this.element
        );
    }
}

export default GameOverModal;