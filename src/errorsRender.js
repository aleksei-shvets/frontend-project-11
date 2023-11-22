import { changesClasses } from './functions.js';

export default (errorText, staticElements) => {
  const { feedbackEl } = staticElements;
  feedbackEl.textContent = errorText;
  changesClasses(feedbackEl, ['text-success'], ['text-danger']);
};
