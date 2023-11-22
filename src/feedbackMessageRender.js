import { changesClasses } from './functions.js';

export default (currentStatus, staticElements, uploadRssMessage) => {
  const { feedbackEl, inputEl } = staticElements;
  if (currentStatus === 'none') {
    feedbackEl.textContent = '';
  }
  if (currentStatus === 'valid') {
    feedbackEl.textContent = uploadRssMessage;
    changesClasses(feedbackEl, ['text-danger'], ['text-success']);
    changesClasses(inputEl, ['is-invalid'], ['is-valid']);
  }
};
