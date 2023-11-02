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

const feedsState = [];
const postsState = [];

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

const feedsRender = () => {
  const feedsContainer = document.querySelector('.feeds');

  const feedsColumn = document.createElement('div');
  feedsColumn.classList.add('card', 'border-0');

  const feedTitleDiv = document.createElement('div');
  feedTitleDiv.classList.add('card-body');

  const feedsBlockTitle = document.createElement('h2');
  feedsBlockTitle.classList.add('card-title', 'h4');
  feedsBlockTitle.textContent = i18next.t('feedTitle');

  const feeds = document.createElement('ul');
  feeds.classList.add('list-group', 'border-0', 'rounded-0');

  feedTitleDiv.append(feedsBlockTitle);
  feedsColumn.append(feedTitleDiv, feeds);
  feedsContainer.append(feedsColumn);
  //feedsContainer.append(feeds);

  feedsState.forEach((feed) => {
    const feedItem = document.createElement('li');
    feedItem.classList.add('list-group-item', 'border-0', 'border-end-0');
    const feedTitle = document.createElement('h3');
    feedTitle.classList.add('h6', 'm-0');
    const feedDescription = document.createElement('p');
    feedDescription.classList.add('m-0', 'small', 'text-black-50');
    feedTitle.textContent = feed.feedTitle;
    feedDescription.textContent = feed.feedDescription;
    feedItem.append(feedTitle, feedDescription);
    feeds.append(feedItem);
  });
};

const postsRender = () => {
  const postsContainer = document.querySelector('.posts');

  const postsColumn = document.createElement('div');
  postsColumn.classList.add('card', 'border-0');

  const postsTitleDiv = document.createElement('div');
  postsTitleDiv.classList.add('card-body');

  const postsBlockTitle = document.createElement('h2');
  postsBlockTitle.classList.add('card-title', 'h4');
  postsBlockTitle.textContent = i18next.t('postTitle');

  postsTitleDiv.append(postsBlockTitle);

  const posts = document.createElement('ul');
  posts.classList.add('list-group', 'border-0', 'rounded-0');

  postsColumn.append(postsTitleDiv);
  postsColumn.append(posts);
  postsContainer.append(postsColumn);

  postsState.forEach((item) => {
    item.feedPosts.forEach((post) => {
      const postItem = document.createElement('li');
      postItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
      const linkName = document.createElement('a');
      linkName.textContent = post.postTitle;
      linkName.classList.add('fw-bold');
      linkName.setAttribute('target', '_blank');
      linkName.setAttribute('rel', 'noopener noreferrer');
      linkName.href = post.postLink;

      const button = document.createElement('button');
      button.textContent = 'Просмотр';
      button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      button.setAttribute('type', 'button');
      button.setAttribute('rel', 'noopener noreferrer');

      postItem.append(linkName, button);
      posts.append(postItem);
    });
  });
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

const feedsWatcher = onChange(feedsState, () => {
  feedsRender();
});

const postsWatcher = onChange(postsState, () => {
  postsRender();
});

const parser = (xmlString) => {
  const newParser = new DOMParser();
  const doc = newParser.parseFromString(xmlString, 'application/xhtml+xml');
  const postItems = doc.querySelectorAll('channel > item');
  const feedTitle = doc.querySelector('channel > title').textContent;
  const feedDescription = doc.querySelector('channel > description').textContent;
  const feedPosts = [];
  postItems.forEach((post) => {
    const postTitle = post.querySelector('title').textContent;
    const postLink = post.querySelector('link').textContent;
    const postDescription = post.querySelector('description').textContent;
    const postCategory = (post.querySelector('category')) ? post.querySelector('category').textContent : '';
    feedPosts.push({
      postTitle,
      postDescription,
      postCategory,
      postLink,
    });
  });
  return [feedTitle, feedDescription, feedPosts];
};

export default () => {
  let idCounter;
  if (feedsState.length === 0) {
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
      const [feedTitle, feedDescription, feedPosts] = parser(res.data.contents);

      feedsState.forEach((item) => {
        if (item.feedName === feedTitle) {
          watcherValidation.errors.push('doubledChannel');
          // return;
        }
      });
      const feedId = idCounter;
      idCounter += 1;
      feedsWatcher.push({ feedId, feedTitle, feedDescription });
      postsWatcher.push({ feedId, feedPosts });
      watcherValidation.linkValidation = 'valid';
    }).catch((err) => {
      console.log(err);
      watcherValidation.errors.push('notConnected');
    });
    console.log(feedsState);
    console.log(postsState);
  });
};
