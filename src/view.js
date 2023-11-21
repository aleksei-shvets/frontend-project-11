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

i18next.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru,
  },
});

let postIdCounter = 0;

const mainTitle = document.querySelector('h1');
const feedbackEl = document.querySelector('.feedback');
const inputEl = document.getElementById('url-input');
const formEl = document.querySelector('.rss-form');
const modal = document.getElementById('modal');
const modalTitle = document.querySelector('.modal-title');
const modalBody = document.querySelector('.modal-body');
const readBtn = document.getElementById('read-btn');
const closeBtn = document.getElementById('close-btn');
const closeIcon = document.querySelector('.btn-close');
const body = document.querySelector('body');
const submitBtn = document.querySelector('[type="submit"]');
const subTitleEl = document.querySelector('.lead');
const labelEl = document.querySelector('[for="url-input"]');
const exampleEl = document.getElementById('example');
const addButtonEl = document.querySelector('[aria-label="add"]');

const allOriginsLink = 'https://allorigins.hexlet.app/get?disableCache=true&url=';

const schema = yup.string().url();

readBtn.textContent = i18next.t('readBtn');
closeBtn.textContent = i18next.t('closeBtn');
mainTitle.textContent = i18next.t('mainTitle');
subTitleEl.textContent = i18next.t('subTitle');
labelEl.textContent = i18next.t('inputHint');
exampleEl.textContent = i18next.t('exampleLink');
addButtonEl.textContent = i18next.t('add');

const errorsRender = (state) => {
  feedbackEl.textContent = (state.errors !== '') ? i18next.t(`errors.${state.errors}`) : '';
  changesClasses(feedbackEl, ['text-success'], ['text-danger']);
};

const feedbackMessageRender = (currentStatus) => {
  if (currentStatus === 'none') {
    feedbackEl.textContent = '';
  }
  if (currentStatus === 'valid') {
    feedbackEl.textContent = i18next.t('feedback.uploadRss');
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

const feedsRender = (feedsState) => {
  const feedsContainer = document.querySelector('.feeds');
  feedsContainer.innerHTML = '';

  const feedsColumn = generateHTMLElement('div', ['card', 'border-0']);
  const feedTitleDiv = generateHTMLElement('div', ['card-body']);
  const feedsBlockTitle = generateHTMLElement('h2', ['card-title', 'h4']);
  feedsBlockTitle.textContent = i18next.t('feedTitle');

  const feeds = generateHTMLElement('ul', ['list-group', 'border-0', 'rounded-0']);

  feedTitleDiv.append(feedsBlockTitle);
  feedsColumn.append(feedTitleDiv, feeds);
  feedsContainer.append(feedsColumn);

  feedsState.forEach((feed) => {
    const feedItem = generateHTMLElement('li', ['list-group-item', 'border-0', 'border-end-0']);
    const feedTitle = generateHTMLElement('h3', ['h6', 'm-0']);
    feedTitle.textContent = feed.feedTitle;
    const feedDescription = generateHTMLElement('p', ['m-0', 'small', 'text-black-50']);
    feedDescription.textContent = feed.feedDescription;

    feedItem.append(feedTitle, feedDescription);
    feeds.append(feedItem);
  });
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
    console.log(response);
    submitBtn.disabled = false;
    return response;
  })
  .catch((error) => {
    submitBtn.disabled = false;
    if (axios.isAxiosError(error)) {
      throw new Error('notConnected');
    }
    error.message = 'unknownError';
    throw error;
  });

export default () => {
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
          console.log(responseData);
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
    feedsRender(feedsState.feedItems.reverse());
    if (feedsState.length > 0) {
      feedsState.addedFeeds.forEach((link) => {
        updateFeed(link);
      });
    }
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
        })
        .catch((error) => {
          const errorMessages = {
            invalidUrl: 'invalidUrl',
            notRss: 'notRss',
            notConnected: 'notConnected',
          };
          stateWatcher.errors = errorMessages[error.message];
          submitBtn.disabled = false;
        });
    } catch (err) {
      const errorMessages = {
        doubledChannel: 'doubledChannel',
        emptyField: 'emptyField',
      };
      submitBtn.disabled = false;
      stateWatcher.errors = errorMessages[err.message];
      inputEl.value = link;
    }
  });

  closeBtn.addEventListener('click', () => {
    modalWatcher.visible = 'hidden';
  });

  closeIcon.addEventListener('click', () => {
    modalWatcher.visible = 'hidden';
  });

  modal.addEventListener('click', (event) => {
    if (event.target.className !== 'modal') {
      modalWatcher.visible = 'hidden';
    }
  });
};
