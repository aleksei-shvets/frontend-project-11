/* eslint-disable no-param-reassign */
import axios from 'axios';
import i18next from 'i18next';
import uniqueId from 'lodash.uniqueid';
import * as yup from 'yup';
import xmlParser from './parser.js';
import watcher from './view.js';
import ru from './locale/ru.js';

const schema = yup.string().url();
const delay = 5000;

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
  const url = new URL(`https://allorigins.hexlet.app/get?disableCache=true&url=${link}`);
  return url.href;
};

const requestRssChannel = (link, watcheredState) => axios.get(getUrl(link))
  .then((responseData) => xmlParser(responseData.data.contents))
  .then((data) => {
    const { feedTitle, feedDescription, newPosts } = data;
    const feedId = uniqueId();
    watcheredState.content.feedItems.push({
      feedTitle, feedDescription, link, feedId,
    });
    newPosts.forEach((item) => {
      watcheredState.content.postsName.push(item.postTitle);
      item.postId = uniqueId();
    });
    const posts = [...watcheredState.content.postsData, ...newPosts];
    watcheredState.content.postsData = posts;
    watcheredState.form.errorMessage = '';
    watcheredState.form.state = 'processed';
    watcheredState.form.inputText = '';
  })
  .catch((error) => {
    if (axios.isAxiosError(error)) {
      watcheredState.form.errorMessage = 'notConnected';
      // throw new Error('notConnected');
    } else if (error.message === 'notRss') {
      watcheredState.form.errorMessage = 'notRss';
      // throw new Error('notRss');
    }
  });

const fetchNewPosts = (watcheredState) => {
  const makeRequest = (link) => axios.get(getUrl(link));

  const update = () => {
    const promises = watcheredState.content.feedItems.map((item) => makeRequest(item.link));

    Promise.all(promises)
      .then((responseData) => {
        responseData.forEach((item) => {
          const { newPosts } = xmlParser(item.data.contents);
          newPosts.forEach((post) => {
            if (!watcheredState.content.postsName.includes(post.postTitle)) {
              const newPost = post;
              newPost.postId = uniqueId();
              watcheredState.content.postsName.push(post.postTitle);
              watcheredState.content.postsData.push(newPost);
            }
          });
        });
      })
      .catch((error) => {
        throw error;
      })
      .finally(() => {
        setTimeout(update, delay);
      });
  };
  update();
};

const isValidLink = (link) => schema.isValid(link)
  .then((validLink) => {
    const { inputEl } = staticElements;
    if (!validLink) {
      inputEl.value = link;
      throw new Error('invalidUrl');
    }
  });

export default () => {
  const {
    formEl,
    inputEl,
    modal,
    postsContainer,
  } = staticElements;

  const initI18n = () => {
    const initanceI18n = i18next.createInstance();
    return initanceI18n.init({
      lng: 'ru',
      debug: true,
      resources: {
        ru,
      },
    });
  };

  const state = {
    form: {
      state: 'filling',
      inputText: '',
      errorMessage: '',
    },
    modal: {
      modalVisible: 'hidden',
      modalPostLink: '',
      modalPostTitle: '',
      modalPostDescription: '',
    },
    content: {
      feedItems: [],
      postsName: [],
      postsData: [],
      readPosts: [],
    },
  };

  initI18n().then((i18n) => {
    const watcheredState = watcher(state, staticElements, i18n);
    postsContainer.addEventListener('click', (e) => {
      const clickedElement = e.target;
      const clickedElementName = clickedElement.nodeName;
      const id = clickedElement.dataset.postId;
      if (!watcheredState.content.readPosts.includes(id)) {
        watcheredState.content.readPosts.push(id);
      }
      if (clickedElementName === 'BUTTON') {
        const clickedPost = watcheredState.content.postsData
          .find((post) => (Number(id) === Number(post.postId)));
        watcheredState.modal.modalPostLink = clickedPost.postLink;
        watcheredState.modal.modalPostTitle = clickedPost.postTitle;
        watcheredState.modal.modalPostDescription = clickedPost.postDescription;
        watcheredState.modal.modalVisible = 'showed';
      }
    });

    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const link = inputEl.value;
      Promise.resolve()
        .then(() => {
          watcheredState.form.state = 'filling';
          watcheredState.form.errorMessage = '';
          watcheredState.form.inputText = '';
          if (link === '') {
            throw new Error('emptyField');
          }
          const links = watcheredState.content.feedItems.map((feedItem) => feedItem.link);
          if (links.includes(link)) {
            throw new Error('doubledChannel');
          }
        })
        .then(() => isValidLink(link))
        .then(() => {
          watcheredState.form.state = 'processing';
          requestRssChannel(link, watcheredState);
        })
        .then(() => {
          fetchNewPosts(watcheredState);
        })
        .catch((error) => {
          console.log(error)
          watcheredState.form.errorMessage = error.message;
          watcheredState.form.inputText = link;
          watcheredState.form.state = 'failed';
          console.log(watcheredState)
        });
    });

    modal.addEventListener('click', (event) => {
      if (event.target.className !== 'modal' || event.target.nodeName === 'BUTTON') {
        watcheredState.modal.modalVisible = 'hidden';
      }
    });
  });
};
