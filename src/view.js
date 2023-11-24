/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import ru from './locale/ru.js';
import { changesClasses } from './functions.js';
import parser from './parser.js';
import feedsRender from './feedsRender.js';
import postsRender from './postsRender.js';
import request from './request.js';
import feedbackMessageRender from './feedbackMessageRender.js';
import errorsRender from './errorsRender.js';
import modalRender from './modalRender.js';
import renderWatchedLinks from './renderWatchedLinks.js';

i18next.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru,
  },
});

let postIdCounter = 0;

const staticElements = {
  mainTitle: document.querySelector('h1'),
  feedbackEl: document.querySelector('.feedback'),
  inputEl: document.getElementById('url-input'),
  formEl: document.querySelector('.rss-form'),
  modal: document.getElementById('modal'),
  modalTitle: document.querySelector('.modal-title'),
  modalBody: document.querySelector('.modal-body'),
  readBtn: document.getElementById('read-btn'),
  closeBtn: document.getElementById('close-btn'),
  closeIcon: document.querySelector('.btn-close'),
  body: document.querySelector('body'),
  submitBtn: document.querySelector('[type="submit"]'),
  subTitleEl: document.querySelector('.lead'),
  labelEl: document.querySelector('[for="url-input"]'),
  exampleEl: document.getElementById('example'),
  addButtonEl: document.querySelector('[aria-label="add"]'),
  postsContainer: document.querySelector('.posts'),
};

const schema = yup.string().url();

staticElements.readBtn.textContent = i18next.t('readBtn');
staticElements.closeBtn.textContent = i18next.t('closeBtn');
staticElements.mainTitle.textContent = i18next.t('mainTitle');
staticElements.subTitleEl.textContent = i18next.t('subTitle');
staticElements.labelEl.textContent = i18next.t('inputHint');
staticElements.exampleEl.textContent = i18next.t('exampleLink');
staticElements.addButtonEl.textContent = i18next.t('add');

export default () => {
  const {
    formEl, feedbackEl, submitBtn, inputEl, modal,
  } = staticElements;

  const state = {
    linkValidation: 'none',
    errors: '',
  };

  const modalState = {
    visible: 'hidden',
    modalPostLink: '',
    modalPostTitle: '',
    modalPostDescription: '',
  };

  const feedsState = {
    addedFeeds: [],
    feedItems: [],
  };
  const postsState = {
    postsName: [],
    postsData: [],
    readPosts: [],
  };

  const stateWatcher = onChange(state, (path, current) => {
    if (path === 'linkValidation') {
      const uploadRssMessage = i18next.t('feedback.uploadRss');
      feedbackMessageRender(current, staticElements, uploadRssMessage);
    }
    if (path === 'errors') {
      const errorText = (state.errors !== '') ? i18next.t(`errors.${state.errors}`) : '';
      errorsRender(errorText, staticElements);
    }
  });

  const modalWatcher = onChange(modalState, (path, current) => {
    if (path === 'visible') {
      modalRender(current, modalState, staticElements);
    }
  });

  const readLinksWatcher = onChange(postsState, (path) => {
    if (path === 'readPosts') {
      renderWatchedLinks(postsState.readPosts);
    }
  });

  const addListeners = () => {
    const { postsContainer } = staticElements;
    postsContainer.addEventListener('click', (e) => {
      const clickedElement = e.target;
      const clickedElementName = clickedElement.nodeName;
      const id = clickedElement.dataset.postId;
      if (!postsState.readPosts.includes(id)) {
        readLinksWatcher.readPosts.push(id);
      }
      if (clickedElementName === 'BUTTON') {
        const clickedPost = postsState.postsData
          .find((post) => (Number(id) === Number(post.postId)));
        modalWatcher.modalPostLink = clickedPost.postLink;
        modalWatcher.modalPostTitle = clickedPost.postTitle;
        modalWatcher.modalPostDescription = clickedPost.postDescription;
        modalWatcher.visible = 'showed';
      }
    });
  };

  const postsWatcher = onChange(postsState, () => {
    const postButtonText = i18next.t('viewing');
    const postsListTitleText = i18next.t('postTitle');
    const { postsContainer } = staticElements;
    postsRender(postsContainer, postsState.postsData, postsListTitleText, postButtonText);
    renderWatchedLinks(postsState.readPosts);
    addListeners();
  });

  const updateFeed = (link) => {
    const delay = 5000;

    const update = () => {
      request(link, staticElements)
        .then((responseData) => {
          const [, , feedPosts] = parser(responseData.data.contents);

          feedPosts.forEach((item) => {
            if (!postsState.postsName.includes(item.postTitle)) {
              const newPost = item;
              newPost.postId = postIdCounter;
              postsWatcher.postsName.push(item.postTitle);
              postsWatcher.postsData.push(newPost);
              postIdCounter += 1;
            }
          });
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          setTimeout(update, delay);
        });
    };

    setTimeout(update, delay);
  };

  const feedsWatcher = onChange(feedsState, () => {
    const feedsListTitle = i18next.t('feedTitle');
    feedsRender(feedsState.feedItems, feedsListTitle);
    feedsState.addedFeeds.forEach((link) => {
      updateFeed(link);
    });
  });

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    feedbackEl.innerHTML = '';
    stateWatcher.linkValidation = 'none';
    stateWatcher.errors = '';
    const link = inputEl.value;
    submitBtn.disabled = true;
    try {
      if (link === '') {
        throw new Error('emptyField');
      }
      if (feedsState.addedFeeds.includes(link)) {
        throw new Error('doubledChannel');
      }
      schema.isValid(link).then((response) => {
        if (!response) {
          inputEl.value = link;
          throw new Error('invalidUrl');
        }
      }).then(() => request(link, staticElements))
        .then((responseData) => {
          const [feedTitle, feedDescription, newPosts] = parser(responseData.data.contents);
          feedsWatcher.feedItems.push({
            feedTitle, feedDescription,
          });
          feedsWatcher.addedFeeds.push(link);
          newPosts.forEach((item) => {
            postsWatcher.postsName.push(item.postTitle);
            item.postId = postIdCounter;
            postIdCounter += 1;
          });
          const posts = [...postsState.postsData, ...newPosts];
          postsWatcher.postsData = posts;
          stateWatcher.linkValidation = 'valid';
          inputEl.value = '';
          changesClasses(inputEl, ['is-invalid'], ['is-valid']);
        })
        .catch((error) => {
          stateWatcher.errors = error.message;
          submitBtn.disabled = false;
          inputEl.value = link;
        });
    } catch (err) {
      submitBtn.disabled = false;
      stateWatcher.errors = err.message;
      inputEl.value = link;
    }
  });

  modal.addEventListener('click', (event) => {
    if (event.target.className !== 'modal' || event.target.nodeName === 'BUTTON') {
      modalWatcher.visible = 'hidden';
    }
  });
};
