import React, { PureComponent } from 'react';
import { Components, registerComponent, getSetting } from '../../lib/vulcan-lib';
import Tooltip from '@material-ui/core/Tooltip';
import withUser from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper'
import { getRecommendationSettings } from './RecommendationsAlgorithmPicker'

const recommendedName = getSetting('forumType') === 'EAForum' ? 'Community Favorites' : 'Recommended'

interface ExternalProps {
  configName: string,
}
interface ConfigurableRecommendationsListProps extends ExternalProps, WithUserProps {
}
interface ConfigurableRecommendationsListState {
  settingsVisible: boolean,
  settings: any,
}

class ConfigurableRecommendationsList extends PureComponent<ConfigurableRecommendationsListProps,ConfigurableRecommendationsListState> {
  state = {
    settingsVisible: false,
    settings: null
  }

  toggleSettings = () => {
    this.setState({
      settingsVisible: !this.state.settingsVisible,
    });
  }

  changeSettings = (newSettings) => {
    this.setState({
      settings: newSettings
    });
  }

  render() {
    const { currentUser, configName } = this.props;
    const { SingleColumnSection, SectionTitle, RecommendationsAlgorithmPicker,
      RecommendationsList, SettingsIcon } = Components;
    const settings = getRecommendationSettings({settings: this.state.settings, currentUser, configName})

    return <SingleColumnSection>
      <SectionTitle
        title={<Tooltip
          title={`A weighted, randomized sample of the highest karma posts${settings.onlyUnread ? " that you haven't read yet" : ""}.`}
        >
          <Link to={'/recommendations'}>
            {recommendedName}
          </Link>
        </Tooltip>}
      >
        <SettingsIcon onClick={this.toggleSettings}/>
      </SectionTitle>
      { this.state.settingsVisible &&
        <RecommendationsAlgorithmPicker
          configName={configName}
          settings={settings}
          onChange={(newSettings) => this.changeSettings(newSettings)}
        /> }
      <RecommendationsList
        algorithm={settings}
      />
    </SingleColumnSection>
  }
}

const ConfigurableRecommendationsListComponent = registerComponent<ExternalProps>(
  "ConfigurableRecommendationsList", ConfigurableRecommendationsList, {
    hocs: [withUser]
  }
);

declare global {
  interface ComponentTypes {
    ConfigurableRecommendationsList: typeof ConfigurableRecommendationsListComponent
  }
}

