import axios from 'axios';
import i18next from 'i18next';
import uniqueId from 'lodash.uniqueid';
import * as yup from 'yup';
import xmlParser from './parser.js';
import watcher from './view.js';
import ru from './locale/ru.js';

const schema = yup.string().url('invalidUrl').notOneOf([''], 'emptyField');
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
  const url = new URL('https://allorigins.hexlet.app/get?disableCache=true');
  url.searchParams.set('url', link);
  return url.href;
};

const requestRssChannel = (link, watcheredState) => axios.get(getUrl(link))
  .then((responseData) => xmlParser(responseData.data.contents))
  .then((data) => {
    const { feedTitle, feedDescription, newPosts } = data;
    const feedId = uniqueId();
    watcheredState.content.feedItems.unshift({
      feedTitle, feedDescription, link, feedId,
    });
    newPosts.forEach((item) => {
      item.postId = uniqueId();
    });
    const posts = [...newPosts, ...watcheredState.content.postsData];
    watcheredState.content.postsData = posts;
    watcheredState.form.errorMessage = '';
    watcheredState.form.state = 'processed';
    watcheredState.form.inputText = '';
  })
  .catch((error) => {
    if (axios.isAxiosError(error)) {
      watcheredState.form.errorMessage = 'notConnected';
    }
    if (error.message === 'notRss') {
      watcheredState.form.errorMessage = 'notRss';
    }
  });

const fetchNewPosts = (watcheredState) => {
  const update = () => {
    const promises = watcheredState.content.feedItems.map((item) => axios.get(getUrl(item.link))
      .then((responseData) => {
        console.log(responseData);
        const { newPosts } = xmlParser(responseData.data.contents);
        newPosts.forEach((post) => {
          if (watcheredState.content.postsData.every((item) => item.postTitle !== post.postTitle)) {
            const newPost = post;
            newPost.postId = uniqueId();
            watcheredState.content.postsData.unshift(post);
          }
        });
      })
      .catch((error) => {
        throw error;
      }));
    Promise.all(promises)
      .finally(() => {
        setTimeout(update, delay);
      });
  };
  update();
};

const isValidLink = (link, watcheredState) => schema.validate(link)
  .then((validLink) => {
    if (validLink) {
      return validLink;
    }
  }).catch((error) => {
    watcheredState.form.inputText = link;
    throw error;
  });

export default () => {
  const {
    formEl,
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
      visiblePostId: '',
    },
    content: {
      feedItems: [],
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
        watcheredState.modal.visiblePostId = id;
        watcheredState.modal.modalVisible = 'showed';
      }
    });
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      const link = form.get('url');
      isValidLink(link, watcheredState)
        .then(() => {
          watcheredState.form.state = 'filling';
          watcheredState.form.errorMessage = '';
          watcheredState.form.inputText = '';
          const links = watcheredState.content.feedItems.map((feedItem) => feedItem.link);
          if (links.includes(link)) {
            throw new Error('doubledChannel');
          }
        })
        .then(() => {
          watcheredState.form.state = 'processing';
          requestRssChannel(link, watcheredState);
        })
        .catch((error) => {
          watcheredState.form.errorMessage = error.message;
          watcheredState.form.inputText = link;
          watcheredState.form.state = 'failed';
        });
    });

    modal.addEventListener('click', (event) => {
      if (event.target.className !== 'modal' || event.target.nodeName === 'BUTTON') {
        watcheredState.modal.modalVisible = 'hidden';
        watcheredState.modal.visiblePostId = '';
      }
    });
    fetchNewPosts(watcheredState);
  });
};
