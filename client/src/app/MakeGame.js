import React from "react";
import {connect} from "react-redux";
import {Field, reduxForm} from "redux-form";
import {makeGame} from "../redux/actions";
import "./makeGame.scss";
import history from "../helpers/history";

class MakeGame extends React.Component {
    renderField(field) {
        const {meta: {touched, error}} = field;
        const showMessage = touched && error;

        return (
            <div className={`field ${showMessage ? 'error' : ''}`}>
                <label>{field.label}</label>
                <input
                    className="form-control"
                    type="text"
                    placeholder={field.label}
                    {...field.input}
                    autoComplete="off"
                />
                {showMessage && (
                    <div className="ui basic red pointing prompt label transition visible">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    renderRadioGroupField() {
        return (
            <div className="grouped fields">
                <label htmlFor="side">
                    Select your side:
                </label>
                <div className="field">
                    <label>
                        <Field name="side" value="x" component="input" type="radio"/>
                        X
                    </label>
                </div>
                <div className="field">
                    <label>
                        <Field name="side" value="o" component="input" type="radio"/>
                        O
                    </label>
                </div>
            </div>
        );
    }

    onSubmit = async values => {
        values[values.side] = this.props.auth._id;
        values[values.side === 'x' ? 'o' : 'x'] = null;
        delete values.side;

        values.turn = 'xo'[Math.floor(Math.random() * 2)];

        this.props.makeGame(values, id => {
            history.push(`/game/${id}`);
        });
    }

    render() {
        if (!this.props.auth)
            return <div className="ui stackable container">You should sign in first</div>;

        return (
            <div className="ui stackable container makeGameForm">
                <form className="ui form" onSubmit={this.props.handleSubmit(this.onSubmit)}>
                    <Field name="name" label="Name" component={this.renderField}/>
                    <Field name="description" label="Description (optional)" component={this.renderField}/>
                    {this.renderRadioGroupField()}
                    <button type="submit" className="ui primary button">Make the game</button>
                </form>
            </div>
        );
    }
}

function validate(values) {
    let errors = {};

    if (!values.name)
        errors.name = 'Please, enter a title for the game';

    return errors;
}

const mapStateToProps = state => {
    return {
        initialValues: {side: 'x'},
        auth: state.auth
    };
}

export default connect(mapStateToProps, {makeGame})(reduxForm({
    validate,
    form: 'makeGame'
})(MakeGame));
