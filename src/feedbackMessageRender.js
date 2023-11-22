import { changesClasses } from './functions.js';

export default (currentStatus, staticElements, texts) => {
  const { uploadRss } = texts;
  const { feedbackEl, inputEl } = staticElements;
  if (currentStatus === 'none') {
    feedbackEl.textContent = '';
  }
  if (currentStatus === 'valid') {
    feedbackEl.textContent = uploadRss;
    changesClasses(feedbackEl, ['text-danger'], ['text-success']);
    changesClasses(inputEl, ['is-invalid'], ['is-valid']);
  }
};
