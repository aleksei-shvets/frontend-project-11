/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import ru from './locale/ru.js';
import {
  changesClasses, setAttributes, changesAttributes, generateHTMLElement,
} from './functions.js';
import parser from './parser.js';
import feedsRender from './feedsRender.js';

i18next.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru,
  },
});

const texts = {
  feedsListTitle: i18next.t('feedTitle'),
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

const allOriginsLink = 'https://allorigins.hexlet.app/get?disableCache=true&url=';

const schema = yup.string().url();

staticElements.readBtn.textContent = i18next.t('readBtn');
staticElements.closeBtn.textContent = i18next.t('closeBtn');
staticElements.mainTitle.textContent = i18next.t('mainTitle');
staticElements.subTitleEl.textContent = i18next.t('subTitle');
staticElements.labelEl.textContent = i18next.t('inputHint');
staticElements.exampleEl.textContent = i18next.t('exampleLink');
staticElements.addButtonEl.textContent = i18next.t('add');

const errorsRender = (state) => {
  staticElements.feedbackEl.textContent = (state.errors !== '') ? i18next.t(`errors.${state.errors}`) : '';
  changesClasses(staticElements.feedbackEl, ['text-success'], ['text-danger']);
};

const feedbackMessageRender = (currentStatus) => {
  const { feedbackEl, inputEl } = staticElements;
  if (currentStatus === 'none') {
    feedbackEl.textContent = '';
  }
  if (currentStatus === 'valid') {
    staticElements.feedbackEl.textContent = i18next.t('feedback.uploadRss');
    changesClasses(feedbackEl, ['text-danger'], ['text-success']);
    changesClasses(inputEl, ['is-invalid'], ['is-valid']);
  }
};

const postElementsGen = (post, postsState) => {
  const postItem = generateHTMLElement('li', [
    'list-group-item',
    'd-flex',
    'justify-content-between',
    'align-items-start',
    'border-0',
    'border-end-0',
  ]);

  const linkName = generateHTMLElement(
    'a',
    ['fw-bold', 'pe-5'],
    { target: '_blank', rel: 'noopener noreferrer' },
  );

  linkName.textContent = post.postTitle;
  linkName.href = post.postLink;
  linkName.dataset.linkId = post.postId;
  if (postsState.readPosts.includes(post.postId)) {
    changesClasses(linkName, ['fw-bold'], ['fw-normal', 'link-secondary']);
  }

  const button = generateHTMLElement(
    'button',
    ['btn', 'btn-outline-primary', 'btn-sm'],
    { type: 'button', rel: 'noopener noreferrer' },
  );
  button.textContent = i18next.t('viewing');

  return [postItem, linkName, button];
};

/*
const request = (link) => axios.get(`${allOriginsLink}${link}`)
  .then((response) => response)
  .catch((error) => {
    throw error;
  });
*/

/*
const request = (link) => {
  const timeout = 10000;
  const source = axios.CancelToken.source();

  const timeoutId = setTimeout(() => {
    source.cancel('Timeout exceeded');
  }, timeout);

  return axios.get(`${allOriginsLink}${link}`)
    .then((response) => {
      if (!response) {
        clearTimeout(timeoutId);
      }
      submitBtn.disabled = false;
      return response;
    })
    .catch((error) => {
      submitBtn.disabled = false;
      if (error.request || error.response) {
        throw new Error('notConnected');
      }
      if (axios.isCancel(error)) {
        throw new Error('notConnected');
      }
      throw error;
    });
};
*/

const request = (link) => axios.get(`${allOriginsLink}${link}`)
  .then((response) => {
    staticElements.submitBtn.disabled = false;
    return response;
  })
  .catch((error) => {
    staticElements.submitBtn.disabled = false;
    if (axios.isAxiosError(error)) {
      throw new Error('notConnected');
    }
    error.message = 'unknownError';
    throw error;
  });

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
      feedbackMessageRender(current);
    }
    if (path === 'errors') {
      errorsRender(state);
    }
  });

  const modalWatcher = onChange(modalState, (path, current) => {
    const {
      modalTitle, body, modalBody, readBtn, modal,
    } = staticElements;

    if (path === 'visible') {
      if (current === 'showed') {
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
      }
      if (current === 'hidden') {
        const backdropDivEl = document.querySelector('.modal-backdrop');
        modal.classList.remove('show');
        body.classList.remove('modal-open', 'style');
        body.removeAttribute('style');

        changesAttributes(modal, ['aria-modal', 'style'], { 'aria-hidden': 'true' });
        backdropDivEl.remove();
        modalState.modalPostLink = '';
        modalState.modalPostTitle = '';
        modalState.modalPostDescription = '';
      }
    }
  });
  const readLinksWatcher = onChange(postsState, (path) => {
    if (path === 'readPosts') {
      postsState.readPosts.forEach((idItem) => {
        const link = document.querySelector(`[data-link-id="${idItem}"]`);
        changesClasses(link, ['fw-bold'], ['fw-normal', 'link-secondary']);
      });
    }
  });

  const postsRender = () => {
    const postsContainer = document.querySelector('.posts');
    postsContainer.innerHTML = '';

    const postsColumn = generateHTMLElement('div', ['card', 'border-0']);
    const postsTitleDiv = generateHTMLElement('div', ['card-body']);
    const postsBlockTitle = generateHTMLElement('h2', ['card-title', 'h4']);
    postsBlockTitle.textContent = i18next.t('postTitle');

    postsTitleDiv.append(postsBlockTitle);

    const postsUlElement = generateHTMLElement('ul', ['list-group', 'border-0', 'rounded-0']);

    postsColumn.append(postsTitleDiv, postsUlElement);
    postsContainer.append(postsColumn);

    postsState.postsData.reverse().forEach((post) => {
      const [postItem, linkName, button] = postElementsGen(post, postsState);
      linkName.addEventListener('click', () => {
        readLinksWatcher.readPosts.push(post.postId);
      });

      postItem.append(linkName, button);
      postsUlElement.append(postItem);

      button.addEventListener('click', () => {
        readLinksWatcher.readPosts.push(post.postId);

        modalWatcher.modalPostLink = post.postLink;
        modalWatcher.modalPostTitle = post.postTitle;
        modalWatcher.modalPostDescription = post.postDescription;
        modalWatcher.visible = 'showed';
      });
    });
  };

  const postsWatcher = onChange(postsState, () => {
    postsRender();
  });

  const updateFeed = (link) => {
    const delay = 5000;
    let timer = setTimeout(function update() {
      request(link)
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
          timer = setTimeout(update, delay);
        }).catch((err) => {
          throw err;
        });
    }, delay);
  };

  const feedsWatcher = onChange(feedsState, () => {
    feedsRender(feedsState.feedItems.reverse(), texts);
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
      }).then(() => request(link))
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
          console.log(feedsState);
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
