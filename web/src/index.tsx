import React from 'react';
import {createRoot} from 'react-dom/client';
import a from './analytics';
import Main from './Main';

a({name: 'load'});

const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><Main /></React.StrictMode>);
