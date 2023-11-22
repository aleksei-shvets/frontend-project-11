/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import ru from './locale/ru.js';
import {
  changesClasses, setAttributes, changesAttributes, generateHTMLElement,
} from './functions.js';
import parser from './parser.js';
import feedsRender from './feedsRender.js';
import postsRender from './postsRender.js';
import request from './request.js';
import feedbackMessageRender from './feedbackMessageRender.js';
import errorsRender from './errorsRender.js';

i18next.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru,
  },
});

const texts = {
  feedsListTitle: i18next.t('feedTitle'),
  postButtonText: i18next.t('viewing'),
  postsListTitleText: i18next.t('postTitle'),
  uploadRss: i18next.t('feedback.uploadRss'),
};

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
    formEl, feedbackEl, submitBtn, inputEl,
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
      feedbackMessageRender(current, staticElements, texts);
    }
    if (path === 'errors') {
      const errorText = (state.errors !== '') ? i18next.t(`errors.${state.errors}`) : '';
      errorsRender(errorText, staticElements);
    }
  });

  const showModal = () => {
    const {
      modalTitle, body, modalBody, readBtn, modal,
    } = staticElements;

    body.classList.add('modal-open');
    setAttributes(body, {
      role: 'dialog',
      style: 'overflow: hidden; padding-right: 13px;',
    });

    modal.classList.add('show', 'fade');
    changesAttributes(
      modal,
      ['aria-hidden'],
      {
        style: 'display: block',
        'data-bs-backdrop': true,
        'aria-modal': true,
      },
    );

    modalTitle.textContent = modalState.modalPostTitle;
    modalBody.textContent = modalState.modalPostDescription;
    readBtn.href = modalState.modalPostLink;

    const backdrop = generateHTMLElement('div', ['modal-backdrop', 'fade', 'show']);

    body.appendChild(backdrop);
  };

  const hideModal = () => {
    const { body, modal } = staticElements;
    const backdropDivEl = document.querySelector('.modal-backdrop');
    modal.classList.remove('show');
    body.classList.remove('modal-open', 'style');
    body.removeAttribute('style');

    changesAttributes(modal, ['aria-modal', 'style'], { 'aria-hidden': 'true' });
    backdropDivEl.remove();
    modalState.modalPostLink = '';
    modalState.modalPostTitle = '';
    modalState.modalPostDescription = '';
  };

  const modalWatcher = onChange(modalState, (path, current) => {
    if (path === 'visible') {
      if (current === 'showed') {
        showModal();
      }
      if (current === 'hidden') {
        hideModal();
      }
    }
  });

  const readLinksWatcher = onChange(postsState, (path) => {
    if (path === 'readPosts') {
      postsState.readPosts.forEach((idItem) => {
        const link = document.querySelector(`[data-post-id="${idItem}"]`);
        changesClasses(link, ['fw-bold'], ['fw-normal', 'link-secondary']);
      });
    }
  });

  const addListeners = () => {
    const aElements = document.querySelectorAll('.post-link');
    const buttonElements = document.querySelectorAll('.post-button');
    aElements.forEach((item) => {
      item.addEventListener('click', () => {
        const id = item.dataset.postId;
        readLinksWatcher.readPosts.push(id);
      });
    });
    buttonElements.forEach((item) => {
      item.addEventListener('click', () => {
        const id = item.dataset.postId;
        readLinksWatcher.readPosts.push(id);
        const clickedPost = postsState.postsData
          .find((post) => (Number(id) === Number(post.postId)));
        modalWatcher.modalPostLink = clickedPost.postLink;
        modalWatcher.modalPostTitle = clickedPost.postTitle;
        modalWatcher.modalPostDescription = clickedPost.postDescription;
        modalWatcher.visible = 'showed';
      });
    });
  };

  const postsWatcher = onChange(postsState, () => {
    postsRender(postsState.postsData, texts);
    postsState.readPosts.forEach((idItem) => {
      const link = document.querySelector(`[data-post-id="${idItem}"]`);
      changesClasses(link, ['fw-bold'], ['fw-normal', 'link-secondary']);
    });
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
    feedsRender(feedsState.feedItems, texts);
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

  staticElements.closeBtn.addEventListener('click', () => {
    modalWatcher.visible = 'hidden';
  });

  staticElements.closeIcon.addEventListener('click', () => {
    modalWatcher.visible = 'hidden';
  });

  staticElements.modal.addEventListener('click', (event) => {
    if (event.target.className !== 'modal') {
      modalWatcher.visible = 'hidden';
    }
  });
};
