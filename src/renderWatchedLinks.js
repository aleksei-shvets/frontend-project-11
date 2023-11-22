import { changesClasses } from './functions.js';

export default (state) => {
  state.forEach((idItem) => {
    const link = document.querySelector(`[data-post-id="${idItem}"]`);
    changesClasses(link, ['fw-bold'], ['fw-normal', 'link-secondary']);
  });
};
