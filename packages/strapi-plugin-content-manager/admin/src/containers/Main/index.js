import React, { memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators, compose } from 'redux';
import { Switch, Route } from 'react-router-dom';
import { LoadingIndicatorPage, getQueryParameters } from 'strapi-helper-plugin';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import pluginId from '../../pluginId';

import DragLayer from '../../components/DragLayer';
import EditView from '../EditView';
import ListView from '../ListView';
import SettingViewModel from '../SettingViewModel';
import SettingViewGroup from '../SettingViewGroup';
import SettingsView from '../SettingsView';

import { getLayout } from './actions';
import reducer from './reducer';
import saga from './saga';
import makeSelectMain from './selectors';

function Main({
  admin: { currentEnvironment },
  emitEvent,
  getLayout,
  layouts,
  location: { pathname, search },
  global: { plugins },
}) {
  strapi.useInjectReducer({ key: 'main', reducer, pluginId });
  strapi.useInjectSaga({ key: 'main', saga, pluginId });
  const slug = pathname.split('/')[3];
  const source = getQueryParameters(search, 'source');

  const shouldShowLoader =
    slug !== 'ctm-configurations' && layouts[slug] === undefined;

  useEffect(() => {
    if (shouldShowLoader) {
      getLayout(slug, source);
    }
  }, [getLayout, shouldShowLoader, slug, source]);

  if (shouldShowLoader) {
    return <LoadingIndicatorPage />;
  }

  const renderRoute = (props, Component) => (
    <Component
      currentEnvironment={currentEnvironment}
      emitEvent={emitEvent}
      layouts={layouts}
      plugins={plugins}
      {...props}
    />
  );
  const routes = [
    {
      path: 'ctm-configurations/models/:name/:settingType',
      comp: SettingViewModel,
    },
    { path: 'ctm-configurations/groups/:name', comp: SettingViewGroup },
    { path: 'ctm-configurations/:type', comp: SettingsView },
    { path: ':slug/:id', comp: EditView },
    { path: ':slug', comp: ListView },
  ].map(({ path, comp }) => (
    <Route
      key={path}
      path={`/plugins/${pluginId}/${path}`}
      render={props => renderRoute(props, comp)}
    />
  ));

  return (
    <DndProvider backend={HTML5Backend}>
      <DragLayer />
      <Switch>{routes}</Switch>
    </DndProvider>
  );
}

Main.propTypes = {
  admin: PropTypes.shape({
    currentEnvironment: PropTypes.string.isRequired,
  }),
  emitEvent: PropTypes.func.isRequired,
  getLayout: PropTypes.func.isRequired,
  global: PropTypes.shape({
    plugins: PropTypes.object,
  }),
  layouts: PropTypes.object.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
    search: PropTypes.string,
  }),
};

const mapStateToProps = makeSelectMain();

export function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      getLayout,
    },
    dispatch
  );
}
const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps
);

export default compose(
  withConnect,
  memo
)(Main);
