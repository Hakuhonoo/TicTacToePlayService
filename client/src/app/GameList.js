import React from "react";
import {connect} from "react-redux";
import _ from "lodash"
import {fetchGames} from "../redux/actions";
import GameOverview from "./GameOverview";

class GameList extends React.Component {
    handler = null;

    updateGames = () => {
        this.props.fetchGames();
    }

    componentDidMount() {
        this.handler = setInterval(this.updateGames, 1000);
        this.updateGames();
    }

    componentWillUnmount() {
        clearInterval(this.handler);
    }

    overviewListRender() {
        if (_.isEmpty(this.props.games))
            return <span className="ui sixteen wide center aligned column">There is no games</span>;

        return Object.values(this.props.games).map(game => <GameOverview key={game._id} game={game}/>);
    }

    render() {
        return (
            <div className="ui two column stackable grid container">
                {this.overviewListRender()}
            </div>
        );
    }
}

const mapStateToProps = state => ({
    games: state.games
});

export default connect(mapStateToProps, {fetchGames})(GameList);
