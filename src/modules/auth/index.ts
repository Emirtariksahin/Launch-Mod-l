
export * from './pages';
export * from './components';
export * from './utils';


export const AuthModuleConfig = {
  name: 'Auth',
  routes: [
    {
      path: '/admin-login',
      component: 'AdminLogin'
    }
  ]
};