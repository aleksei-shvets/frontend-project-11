/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-param-reassign */

import onChange from 'on-change';
import i18next from 'i18next';
import ru from './locale/ru.js';

i18next.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru,
  },
});

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

staticElements.readBtn.textContent = i18next.t('readBtn');
staticElements.closeBtn.textContent = i18next.t('closeBtn');
staticElements.mainTitle.textContent = i18next.t('mainTitle');
staticElements.subTitleEl.textContent = i18next.t('subTitle');
staticElements.labelEl.textContent = i18next.t('inputHint');
staticElements.exampleEl.textContent = i18next.t('exampleLink');
staticElements.addButtonEl.textContent = i18next.t('add');

const changesClasses = (element, deletedClasses = [], addedClasses = []) => {
  deletedClasses.forEach((deletedClass) => element.classList.remove(deletedClass));
  addedClasses.forEach((addedClass) => element.classList.add(addedClass));
};

const setAttributes = (element, attributes = {}) => {
  Object.keys(attributes).forEach((key) => element.setAttribute(key, attributes[key]));
};

const changesAttributes = (element, deletedAttributes = [], addedAttributes = {}) => {
  deletedAttributes.forEach((deletedAttribute) => element.removeAttribute(deletedAttribute));
  setAttributes(element, addedAttributes);
};

const generateHTMLElement = (elementName, classes = [], attributes = {}) => {
  const newElement = document.createElement(elementName);
  newElement.classList.add(...classes);
  setAttributes(newElement, attributes);
  return newElement;
};

const renderWatchedLinks = (watchedLinksList) => {
  watchedLinksList.forEach((idItem) => {
    const link = document.querySelector(`[data-post-id="${idItem}"]`);
    changesClasses(link, ['fw-bold'], ['fw-normal', 'link-secondary']);
  });
};

const postsRender = (postsList) => {
  const { postsContainer } = staticElements;
  postsContainer.innerHTML = '';

  const postsColumn = generateHTMLElement('div', ['card', 'border-0']);
  const postsTitleDiv = generateHTMLElement('div', ['card-body']);
  const postsListTitleEl = generateHTMLElement('h2', ['card-title', 'h4']);
  postsListTitleEl.textContent = i18next.t('postTitle');

  postsTitleDiv.append(postsListTitleEl);

  const postsUlElement = generateHTMLElement('ul', ['list-group', 'border-0', 'rounded-0']);

  postsColumn.append(postsTitleDiv, postsUlElement);
  postsContainer.append(postsColumn);

  postsList.reverse().forEach((post) => {
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
      ['fw-bold'],
      { target: '_blank', rel: 'noopener noreferrer' },
    );

    linkName.textContent = post.postTitle;
    linkName.href = post.postLink;
    linkName.dataset.postId = post.postId;

    const button = generateHTMLElement(
      'button',
      ['btn', 'btn-outline-primary', 'btn-sm', 'post-button'],
      { type: 'button', rel: 'noopener noreferrer' },
    );
    button.textContent = i18next.t('viewing');
    button.dataset.postId = post.postId;
    postItem.append(linkName, button);
    postsUlElement.append(postItem);
  });
};

const showModal = (state) => {
  const { modalPostTitle, modalPostDescription, modalPostLink } = state;
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

  modalTitle.textContent = modalPostTitle;
  modalBody.textContent = modalPostDescription;
  readBtn.href = modalPostLink;

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
};

const modalRender = (currentStatus, state) => {
  const render = {
    showed: () => showModal(state),
    hidden: () => hideModal(),
  };
  render[currentStatus]();
};

const errorsRender = (errorMessage) => {
  const { feedbackEl, inputEl } = staticElements;
  feedbackEl.textContent = (errorMessage !== '') ? i18next.t(`errors.${errorMessage}`) : '';
  changesClasses(feedbackEl, ['text-success'], ['text-danger']);
  changesClasses(inputEl, ['is-valid'], ['is-invalid']);
};

const feedbackMessageRender = (currentStatus) => {
  const { feedbackEl, inputEl } = staticElements;
  const validation = {
    none: () => {
      feedbackEl.textContent = '';
    },
    valid: () => {
      feedbackEl.textContent = i18next.t('feedback.uploadRss');
      changesClasses(feedbackEl, ['text-danger'], ['text-success']);
      changesClasses(inputEl, ['is-invalid'], ['is-valid']);
    },
  };
  return validation[currentStatus]();
};

const feedsRender = (feedsState) => {
  const currentState = [...feedsState];
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

  currentState.reverse().forEach((feed) => {
    const feedItem = generateHTMLElement('li', ['list-group-item', 'border-0', 'border-end-0']);
    const feedTitle = generateHTMLElement('h3', ['h6', 'm-0']);
    feedTitle.textContent = feed.feedTitle;
    const feedDescription = generateHTMLElement('p', ['m-0', 'small', 'text-black-50']);
    feedDescription.textContent = feed.feedDescription;

    feedItem.append(feedTitle, feedDescription);
    feeds.append(feedItem);
  });
};

export default (state) => onChange(state, (path, current) => {
  switch (path) {
    case 'modalVisible':
      modalRender(current, state);
      break;
    case 'errorMessage':
      errorsRender(current);
      break;
    case 'linkValidation':
      feedbackMessageRender(current);
      break;
    case 'readPosts':
      renderWatchedLinks(current);
      break;
    case 'postsData':
      postsRender(current);
      renderWatchedLinks(state.readPosts);
      break;
    case 'feedItems':
      feedsRender(current);
      break;
    default:
      break;
  }
});

export { staticElements };
