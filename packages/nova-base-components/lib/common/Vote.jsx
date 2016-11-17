import Telescope from 'meteor/nova:lib';
import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';
import Users from 'meteor/nova:users';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withVoteMutation } from 'meteor/nova:base-containers';
import { withCurrentUser } from 'meteor/nova:core';

class Vote extends Component {

  constructor() {
    super();
    this.upvote = this.upvote.bind(this);
    this.startLoading = this.startLoading.bind(this);
    this.stopLoading = this.stopLoading.bind(this);
    this.state = {
      loading: false
    }
  }

  startLoading() {
    this.setState({ loading: true });
  }

  stopLoading() {
    this.setState({ loading: false });
  }

  upvote(e) {
    e.preventDefault();

    this.startLoading();

    const post = this.props.post;
    const user = this.props.currentUser;

    if(!user){
      this.props.flash("Please log in first");
    } else {
      const voteType = Users.hasUpvoted(user, post) ? "cancelUpvote" : "upvote";
      this.props.vote({post, voteType, currentUser: this.props.currentUser}).then(result => {
        this.stopLoading();
      });
    } 
  }

  render() {

    const post = this.props.post;
    const user = this.props.currentUser;

    const hasUpvoted = Users.hasUpvoted(user, post);
    const hasDownvoted = Users.hasDownvoted(user, post);
    const actionsClass = classNames(
      "vote", 
      {voted: hasUpvoted || hasDownvoted},
      {upvoted: hasUpvoted},
      {downvoted: hasDownvoted}
    );

    return (
      <div className={actionsClass}>
        <a className="upvote-button" onClick={this.upvote}>
          {this.state.loading ? <Telescope.components.Icon name="spinner" /> : <Telescope.components.Icon name="upvote" /> }
          <div className="sr-only">Upvote</div>
          <div className="vote-count">{post.baseScore || 0}</div>
        </a>
      </div>
    )
  }

}

Vote.propTypes = {
  post: React.PropTypes.object.isRequired, // the current post
  vote: React.PropTypes.func, // mutate function with callback inside
  currentUser: React.PropTypes.object,
};

Vote.contextTypes = {
  actions: React.PropTypes.object,
  events: React.PropTypes.object,
};

// redux state + actions for messages
const mapStateToProps = state => ({ messages: state.messages });
const mapDispatchToProps = dispatch => bindActionCreators(Telescope.actions.messages, dispatch);

Telescope.registerComponent('Vote', Vote, withCurrentUser, connect(mapStateToProps, mapDispatchToProps), withVoteMutation);