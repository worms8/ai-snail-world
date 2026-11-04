import { bootstrap } from './index';

const root = document.querySelector<HTMLElement>('#app');
if (!root) {
  throw new Error('Missing #app root element');
}

bootstrap(root);
