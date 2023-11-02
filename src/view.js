import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import ru from './locale/ru.js';

const feedbackEl = document.querySelector('.feedback');
const inputEl = document.getElementById('url-input');
const formEl = document.querySelector('.rss-form');

const state = {
  linkValidation: 'none',
  errors: [],
};

const feeds = [];
const posts = [];

i18next.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru,
  },
});

const schema = yup.string().url();

const errorsRender = () => {
  if (state.errors.length > 0) {
    feedbackEl.textContent = i18next.t(`errors.${state.errors}`);
    feedbackEl.classList.add('text-danger');
    feedbackEl.classList.remove('text-success');
  }
};

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
};

const watcherValidation = onChange(state, (path, current) => {
  if (path === 'linkValidation') {
    feedbackRender(current);
  }
  if (path === 'errors') {
    feedbackRender(current);
    current.forEach(() => errorsRender());
  }
});

const parser = (xmlString) => {
  const newParser = new DOMParser();
  const doc = newParser.parseFromString(xmlString, 'application/xhtml+xml');
  const postItems = doc.querySelectorAll('channel > item');
  const feedName = doc.querySelector('channel > title').textContent;
  const feedLink = doc.querySelector('channel > link').textContent;
  postItems.forEach((post) => {
    const postTitle = post.querySelector('title').textContent;
    const postLink = post.querySelector('link').textContent;
    const postDescription = post.querySelector('description').textContent;
    const postCategory = (post.querySelector('category')) ? post.querySelector('category').textContent : '';
    posts.push({
      postTitle,
      postDescription,
      postCategory,
      postLink,
    });
  });
  return [feedName, feedLink, posts];
};

export default () => {
  let idCounter;
  if (feeds.length === 0) {
    idCounter = 0;
  }
  const headTitileEl = document.querySelector('h1');
  const subTitleEl = document.querySelector('.lead');
  const labelEl = document.querySelector('[for="url-input"]');
  const exampleEl = document.getElementById('example');

  headTitileEl.textContent = i18next.t('mainTitle');
  subTitleEl.textContent = i18next.t('subTitle');
  labelEl.textContent = i18next.t('inputHint');
  exampleEl.textContent = i18next.t('exampleLink');

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const link = inputEl.value;

    const response = schema.isValid(link)
      .then((data) => {
        if (!data) {
          watcherValidation.errors.push('invalidUrl');
          return link;
        }
        inputEl.value = '';
        return axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${link}`);
      });

    response.then((res) => {
      if (res === link) {
        inputEl.value = link;
        return;
      }
      const [feedName, feedLink, feedPosts] = parser(res.data.contents);

      feeds.forEach((item) => {
        if (item.feedName === feedName) {
          watcherValidation.errors.push('doubledChannel');
          return;
        }
      });
      const feedId = idCounter;
      idCounter += 1;
      feeds.push({ feedId, feedName, feedLink });
      posts.push({ feedId, feedPosts });
      watcherValidation.linkValidation = 'valid';
    }).catch(() => {
      watcherValidation.errors.push('notConnected');
    });
    console.log(feeds);
    console.log(posts);
  });
};
