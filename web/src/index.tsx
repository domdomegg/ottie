import React from 'react';
import ReactDOM from 'react-dom';
import a from './analytics';
import Main from './Main';

a({ name: 'load' });

ReactDOM.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>,
  document.getElementById('root')
);
