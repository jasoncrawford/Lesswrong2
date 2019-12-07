import React from 'react';
import { addCallback } from 'meteor/vulcan:core';
import JssProvider from 'react-jss/lib/JssProvider';
import { MuiThemeProvider, createGenerateClassName } from '@material-ui/core/styles';
import forumTheme from '../lib/themes/forumTheme';
import JssCleanup from '../components/themes/JssCleanup';


function wrapWithMuiTheme (app) {
  const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: true
  });
  
  return (
    <JssProvider generateClassName={generateClassName}>
      <MuiThemeProvider theme={forumTheme}>
        {app}
        <JssCleanup />
      </MuiThemeProvider>
    </JssProvider>
  );
}


addCallback('router.client.wrapper', wrapWithMuiTheme);
