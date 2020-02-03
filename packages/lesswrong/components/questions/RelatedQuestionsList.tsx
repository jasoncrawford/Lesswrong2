import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
import * as _ from 'underscore';

const styles = theme => ({
  root: {
    width: 650 + (theme.spacing.unit*4),
    marginBottom: 100,
    [theme.breakpoints.down('md')]: {
      width: "unset",
      marginLeft: "auto",
      marginRight: "auto"
    }
  },
  itemIsLoading: {
    opacity: .4,
  },
  loading: {
    '&:after': {
      content: "''",
      marginLeft: 0,
      marginRight: 0,
    }
  },
  loadMore: {
    flexGrow: 1,
    textAlign: "left",
    '&:after': {
      content: "''",
      marginLeft: 0,
      marginRight: 0,
    }
  },
  header: {
    ...theme.typography.body2,
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit/2,
    color: theme.palette.grey[700]
  },
  subQuestion: {
    marginBottom: theme.spacing.unit,
  },
  hasSubSubQuestions: {
    borderLeft: "solid 2px rgba(0,0,0,.15)"
  },
  subSubQuestions: {
    marginLeft: theme.spacing.unit,
    background: "rgba(0,0,0,.05)"
  }
})

const RelatedQuestionsList = ({ post, classes }) => {
  const { PostsItem2, SectionTitle } = Components
  
  const sourcePostRelations = _.filter(post.sourcePostRelations, rel => !!rel.sourcePost)
  const targetPostRelations = _.filter(post.targetPostRelations, rel => (rel.sourcePostId === post._id && !!rel.targetPost))

  const totalRelatedQuestionCount = sourcePostRelations.length + targetPostRelations.length
  
  const showParentLabel = sourcePostRelations.length > 0
  const showSubQuestionLabel = (sourcePostRelations.length > 0) && (targetPostRelations.length > 0)

  return (
    <div className={classes.root}>

      {(totalRelatedQuestionCount > 0) && <SectionTitle title={`${totalRelatedQuestionCount} Related Questions`} />}
      
      {showParentLabel && <div className={classes.header}>Parent Question{(sourcePostRelations.length > 1) && "s"}</div>}
      {sourcePostRelations.map((rel, i) =>
        <PostsItem2
          key={rel._id}
          post={rel.sourcePost}
          index={i}
      />)}
      {showSubQuestionLabel && <div className={classes.header}>Sub-Questions</div>}
      {targetPostRelations.map((rel, i) => {
        const parentQuestionId = rel.targetPostId
        const subQuestionTargetPostRelations = _.filter(post.targetPostRelations, rel => rel.sourcePostId === parentQuestionId)

        const showSubQuestions = subQuestionTargetPostRelations.length >= 1
        return (
          <div key={rel._id} className={classNames(classes.subQuestion, {[classes.hasSubSubQuestions]:showSubQuestions})} >
            <PostsItem2 
              post={rel.targetPost} 
              index={i}
              showQuestionTag={false}
              showPostedAt={false}
              showIcons={false}
              showBottomBorder={!showSubQuestions}
              defaultToShowUnreadComments={true}
            />
            {showSubQuestions && <div className={classes.subSubQuestions}>
              {subQuestionTargetPostRelations.map((rel, i) => <PostsItem2 
                key={rel._id}
                post={rel.targetPost} 
                showQuestionTag={false}
                showPostedAt={false}
                showIcons={false}
                defaultToShowUnreadComments={true}
                index={i}
              />)}
            </div>}
          </div>
        )
      })}
    </div>
  )
}

const RelatedQuestionsListComponent = registerComponent('RelatedQuestionsList', RelatedQuestionsList, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    RelatedQuestionsList: typeof RelatedQuestionsListComponent
  }
}

