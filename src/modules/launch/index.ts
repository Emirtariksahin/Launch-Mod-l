export * from './pages';
export * from './components';
export * from './services';
export * from './store';


export const LaunchModuleConfig = {
  name: 'Launch',
  routes: [
    {
      path: '/admin-panel/launch-list',
      component: 'LaunchListPage'
    },
  ]
}; 