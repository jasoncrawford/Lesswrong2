import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import withHover from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import { useTagBySlug } from './useTag';

const styles = theme => ({
  card: {
    padding: 16,
    width: 600,
  },
});

const TagHoverPreview = ({href, targetLocation, innerHTML, classes, hover, anchorEl}) => {
  const { params: {slug} } = targetLocation;
  const { tag } = useTagBySlug(slug);
  const { PopperCard, TagPreview } = Components;
  
  return <span>
    <PopperCard open={hover} anchorEl={anchorEl}>
      <div className={classes.card}>
        <TagPreview tag={tag}/>
      </div>
    </PopperCard>
    <Link to={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
  </span>;
}

const TagHoverPreviewComponent = registerComponent("TagHoverPreview", TagHoverPreview, {
  styles, hocs: [withHover()]
});

declare global {
  interface ComponentTypes {
    TagHoverPreview: typeof TagHoverPreviewComponent
  }
}
