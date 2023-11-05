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
  errors: '',
};

const feedsState = [];
const postsState = {
  postsName: [],
  postsData: [],
};

i18next.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru,
  },
});

const schema = yup.string().url();

const errorsRender = () => {
  feedbackEl.textContent = (state.errors !== '') ? i18next.t(`errors.${state.errors}`) : '';
  feedbackEl.classList.add('text-danger');
  feedbackEl.classList.remove('text-success');
};

const feedsRender = () => {
  if (state.errors.length > 0) return;
  const feedsContainer = document.querySelector('.feeds');
  feedsContainer.innerHTML = '';

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
  if (state.errors.length > 0) return;
  const postsContainer = document.querySelector('.posts');
  postsContainer.innerHTML = '';

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

  postsState.postsData.forEach((item) => {
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

const feedbackMessageRender = (currentStatus) => {
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

const request = (link) => schema.isValid(link)
  .then((data) => {
    state.errors = '';
    if (!data) {
      throw new Error('Invalid link');
    }
  })
  .then(() => axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${link}`))
  .catch((error) => {
    throw error;
  });

const parser = (xmlString) => {
  try {
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
  } catch (e) {
    throw new Error(e.message = 'notRss');
  }
};

const watcherValidation = onChange(state, (path, current) => {
  if (path === 'linkValidation') {
    feedbackMessageRender(current);
  }
  if (path === 'errors') {
    errorsRender();
  }
});

const postsWatcher = onChange(postsState, () => {
  postsRender();
});

const updateFeed = (link, feedId) => {
  const delay = 5000;
  let timer = setTimeout(function update() {
    axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${link}`)
      .then((responseData) => {
        const [, , feedPosts] = parser(responseData.data.contents);
        feedPosts.forEach((item) => {
          if (!postsState.postsName.includes(item.postTitle)) {
            feedPosts.forEach((post) => {
              postsWatcher.postsName.push(post.postTitle);
            });
            postsWatcher.postsData.push({ feedId, feedPosts });
          }
        });
        timer = setTimeout(update, delay);
      });
  }, delay);
};

const feedsWatcher = onChange(feedsState, () => {
  feedsRender();
  if (feedsState.length > 0) {
    feedsState.forEach((feed) => {
      const link = feed.feedLink;
      const id = feed.feedId;
      updateFeed(link, id);
    });
  }
});

export default () => {
  let idCounter;
  if (feedsState.length === 0) {
    idCounter = 0;
  }
  const subTitleEl = document.querySelector('.lead');
  const labelEl = document.querySelector('[for="url-input"]');
  const exampleEl = document.getElementById('example');
  const addButtonEl = document.querySelector('[aria-label="add"]');

  subTitleEl.textContent = i18next.t('subTitle');
  labelEl.textContent = i18next.t('inputHint');
  exampleEl.textContent = i18next.t('exampleLink');
  addButtonEl.textContent = i18next.t('add');

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    feedbackEl.innerHTML = '';
    watcherValidation.linkValidation = 'none';
    const link = inputEl.value;
    schema.isValid(link).then((response) => {
      if (!response) {
        inputEl.value = link;
        throw new Error('Invalid');
      }
    }).then(() => request(link)).then((responseData) => {
      const [feedTitle, feedDescription, feedPosts] = parser(responseData.data.contents);

      feedsState.forEach((item) => {
        if (item.feedTitle === feedTitle) {
          throw new Error('doubledChannel');
        }
      });
      const feedId = idCounter;
      idCounter += 1;
      feedsWatcher.push({
        feedId, feedTitle, feedDescription, feedLink: link,
      });
      feedPosts.forEach((item) => {
        postsWatcher.postsName.push(item.postTitle);
      });
      postsWatcher.postsData.push({ feedId, feedPosts });
      watcherValidation.linkValidation = 'valid';
      inputEl.value = '';
      inputEl.classList.remove('is-invalid');
      inputEl.classList.remove('is-valid');
      console.log(feedsState);
      console.log(postsState);
    })
      .catch((error) => {
        if (error.message === 'Invalid') {
          watcherValidation.errors = 'invalidUrl';
        }
        if (error.message === 'doubledChannel') {
          watcherValidation.errors = 'doubledChannel';
        }
        if (error.message === 'Invalid link') {
          watcherValidation.errors = 'invalidUrl';
        }
        if (error.message === 'notRss') {
          watcherValidation.errors = 'notRss';
        }
        if (error.request || error.response) {
          watcherValidation.errors = 'notConnected';
        }
        inputEl.value = link;
      });
  });
};
