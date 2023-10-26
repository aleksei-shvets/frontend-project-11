import onChange from 'on-change';

import * as yup from 'yup';

const state = {
  linkValidation: 'none',
  channels: {
    feeds: [],
    feedLinks: [],
  },
};

const schema = yup.string().url();
const feedbackEl = document.querySelector('.feedback');

const feedbackRender = (currentStatus) => {
  if (currentStatus === 'none') {
    feedbackEl.textContent = '';
  }
  if (currentStatus === 'valid') {
    feedbackEl.textContent = 'RSS успешно загружен';
    feedbackEl.classList.remove('text-danger');
    feedbackEl.classList.add('text-success');
  }
  if (currentStatus === 'invalid') {
    feedbackEl.textContent = 'Ссылка должна быть валидным URL';
    feedbackEl.classList.add('text-danger');
    feedbackEl.classList.remove('text-success');
  }
};

const watcherValidation = onChange(state, (path, current) => {
  if (path === 'linkValidation') {
    feedbackRender(current);
  }
});

export default () => {
  const inputEl = document.getElementById('url-input');
  const formEl = document.querySelector('.rss-form');
  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const link = inputEl.value;

    schema.isValid(link)
      .then((data) => {
        const status = data ? 'valid' : 'invalid';
        watcherValidation.linkValidation = status;
      });
  });
};
