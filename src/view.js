import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import ru from './locale/ru.js';

const feedbackEl = document.querySelector('.feedback');
const inputEl = document.getElementById('url-input');
const formEl = document.querySelector('.rss-form');

/*
const headTitileEl = document.querySelector('h1');
const subTitleEl = document.querySelector('.lead');
const labelEl = document.querySelector('[for="url-input"]');
const exampleEl = formEl.nextElementSibling();

headTitileEl.textContent = i18next.t('mainTitle');
subTitleEl.textContent = i18next.t('subTitle');
labelEl.textContent = i18next.t('inputHint');
exampleEl.textContent = i18next.t('examplLink');
*/

const state = {
  linkValidation: 'none',
  channels: {
    feeds: [],
    feedLinks: [],
  },
};

i18next.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru,
  },
});

const schema = yup.string().url();

const feedbackRender = (currentStatus) => {
  if (currentStatus === 'none') {
    feedbackEl.textContent = '';
  }
  if (currentStatus === 'valid') {
    feedbackEl.textContent = i18next.t('feedback.uploadRss');
    feedbackEl.classList.remove('text-danger');
    feedbackEl.classList.add('text-success');
    inputEl.classList.remove('is-invalid');
    inputEl.classList.add('is-valid');
  }
  if (currentStatus === 'invalid') {
    feedbackEl.textContent = i18next.t('errors.invalidUrl');
    feedbackEl.classList.add('text-danger');
    feedbackEl.classList.remove('text-success');
    inputEl.classList.add('is-invalid');
    inputEl.classList.remove('is-valid');
  }
};

const watcherValidation = onChange(state, (path, current) => {
  if (path === 'linkValidation') {
    feedbackRender(current);
  }
});

export default () => {
  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const link = inputEl.value;

    schema.isValid(link)
      .then((data) => {
        const status = data ? 'valid' : 'invalid';
        watcherValidation.linkValidation = status;
        if (data) {
          inputEl.value = '';
        } else {
          inputEl.value = link;
        }
      });
  });
};
