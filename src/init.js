import { Modal } from 'bootstrap';
import axios from 'axios';
import i18next from 'i18next';
import uniqueId from 'lodash.uniqueid';
import * as yup from 'yup';
import xmlParser from './parser.js';
import watcher from './view.js';
import resources from './locale/index.js';
import validationErrors from './locale/validationErrors.js';

const initI18n = () => {
  const initanceI18n = i18next.createInstance();
  return initanceI18n.init({
    lng: 'ru',
    debug: true,
    resources,
  });
};

const delay = 5000;

const isValidLink = (link, schema) => schema.validate(link)
  .then((validate) => validate)
  .catch((error) => {
    error.message = error.errors.map((err) => err.key) || 'unknownError';
    throw error;
  });

const makeShema = (addedLinks) => yup.string().url().required().notOneOf(addedLinks);

const staticElements = {
  feedbackEl: document.querySelector('.feedback'),
  inputEl: document.getElementById('url-input'),
  formEl: document.querySelector('.rss-form'),
  modal: document.getElementById('modal'),
  modalTitle: document.querySelector('.modal-title'),
  modalBody: document.querySelector('.modal-body'),
  closeIcon: document.querySelector('.btn-close'),
  body: document.querySelector('body'),
  submitBtn: document.querySelector('[type="submit"]'),
  postsContainer: document.querySelector('.posts'),
  readBtn: document.getElementById('read-btn'),
};

const getUrl = (link) => {
  const url = new URL('https://allorigins.hexlet.app/get');
  url.searchParams.set('disableCache', 'true');
  url.searchParams.set('url', link);
  return url.href;
};

const requestRssChannel = (link, watchedState) => axios.get(getUrl(link))
  .then((responseData) => xmlParser(responseData.data.contents))
  .then((data) => {
    const { feedTitle, feedDescription, newPosts } = data;
    const feedId = uniqueId();
    watchedState.content.feedItems.unshift({
      feedTitle, feedDescription, link, feedId,
    });
    newPosts.forEach((item) => {
      item.postId = uniqueId();
    });
    const posts = [...newPosts, ...watchedState.content.postsData];
    watchedState.content.postsData = posts;
    watchedState.form.errorMessage = '';
    watchedState.form.state = 'processed';
    watchedState.form.inputText = '';
  })
  .catch((error) => {
    watchedState.form.state = 'failed';
    if (axios.isAxiosError(error)) {
      watchedState.form.errorMessage = 'notConnected';
    }
    if (error.isParsingError) {
      watchedState.form.errorMessage = 'notRss';
    }
  });

const fetchNewPosts = (watchedState) => {
  const update = () => {
    const promises = watchedState.content.feedItems.map((item) => axios.get(getUrl(item.link))
      .then((responseData) => {
        const { newPosts } = xmlParser(responseData.data.contents);
        newPosts.forEach((post) => {
          if (watchedState.content.postsData
            .every((postItem) => postItem.postTitle !== post.postTitle)) {
            const newPost = post;
            newPost.postId = uniqueId();
            watchedState.content.postsData.unshift(post);
          }
        });
      })
      .catch((error) => {
        if (error.isParsingError) {
          console.log('notRss');
        } else {
          throw error;
        }
      }));

    Promise.all(promises)
      .finally(() => {
        setTimeout(update, delay);
      });
  };
  update();
};

export default () => {
  const {
    formEl,
    modal,
    postsContainer,
  } = staticElements;

  const state = {
    form: {
      state: 'filling',
      inputText: '',
      errorMessage: '',
    },
    modal: {
      modalVisible: 'hidden',
      visiblePostId: '',
    },
    content: {
      feedItems: [],
      postsData: [],
      readPosts: [],
    },
  };

  initI18n()
    .then((i18n) => {
      const watchedState = watcher(state, staticElements, i18n, Modal);
      yup.setLocale(validationErrors);
      watchedState.content.readPosts = new Set();
      postsContainer.addEventListener('click', (e) => {
        const clickedElement = e.target;
        const clickedElementName = clickedElement.nodeName;
        if (clickedElement.hasAttribute('data-post-id')) {
          const id = clickedElement.dataset.postId;
          watchedState.content.readPosts.add(id);
          if (clickedElementName === 'BUTTON') {
            watchedState.modal.visiblePostId = id;
            watchedState.modal.modalVisible = 'showed';
          }
        }
      });
      formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        const link = form.get('url');
        const addedLinks = watchedState.content.feedItems.map((feed) => feed.link);
        const schema = makeShema(addedLinks);

        isValidLink(link, schema)
          .then(() => {
            watchedState.form.state = 'filling';
            watchedState.form.errorMessage = '';
            watchedState.form.inputText = '';
          })
          .then(() => {
            watchedState.form.state = 'processing';
            requestRssChannel(link, watchedState);
          })
          .catch((error) => {
            watchedState.form.errorMessage = error.message;
            watchedState.form.inputText = link;
            watchedState.form.state = 'failed';
          });
      });

      modal.addEventListener('hidden.bs.modal', () => {
        watchedState.modal.modalVisible = 'hidden';
        watchedState.modal.visiblePostId = '';
      });
      fetchNewPosts(watchedState);
    });
};
