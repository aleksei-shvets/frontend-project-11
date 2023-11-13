import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import ru from './locale/ru.js';

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

const allOriginsLink = 'https://allorigins.hexlet.app/get?disableCache=true&url=';

let postIdCounter = 0;

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

const feedsState = [];
const postsState = {
  postsName: [],
  postsData: [],
  readPosts: [],
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

  feedsState.reverse().forEach((feed) => {
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

const stateWatcher = onChange(state, (path, current) => {
  if (path === 'linkValidation') {
    feedbackMessageRender(current);
  }
  if (path === 'errors') {
    errorsRender();
  }
});

const modalWatcher = onChange(modalState, (path, current) => {
  if (path === 'visible') {
    if (current === 'showed') {
      body.classList.add('modal-open');
      body.setAttribute('style', 'overflow: hidden; padding-right: 13px;');
      modal.classList.add('show');
      modal.setAttribute('style', 'display: block');
      modal.setAttribute('data-bs-backdrop', 'true');
      modal.setAttribute('aria-modal', 'true');
      modal.removeAttribute('aria-hidden');

      modalTitle.textContent = modalState.modalPostTitle;
      modalBody.textContent = modalState.modalPostDescription;
      readBtn.href = modalState.modalPostLink;
      const backdrop = document.createElement('div');
      backdrop.classList.add('modal-backdrop', 'fade', 'show');
      body.appendChild(backdrop);
    }
    if (current === 'hidden') {
      const backdropDivEl = document.querySelector('.modal-backdrop');
      modal.classList.remove('show');
      modal.removeAttribute('style', 'display: block');
      modal.removeAttribute('aria-modal');
      modal.setAttribute('aria-hidden', 'true');
      backdropDivEl.remove();
      modalState.modalPostLink = '';
      modalState.modalPostTitle = '';
      modalState.modalPostDescription = '';
    }
  }
});

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

  postsState.postsData.reverse().forEach((post) => {
    const postItem = document.createElement('li');
    postItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    const linkName = document.createElement('a');
    linkName.textContent = post.postTitle;
    linkName.classList.add('fw-bold');
    linkName.setAttribute('target', '_blank');
    linkName.setAttribute('rel', 'noopener noreferrer');
    linkName.href = post.postLink;

    linkName.addEventListener('click', () => {
      postsState.readPosts.push(post.postId);
      linkName.classList.remove('fw-bold');
      linkName.classList.add('fw-normal', 'link-secondary');
    });

    const button = document.createElement('button');
    button.textContent = i18next.t('viewing');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('rel', 'noopener noreferrer');

    postItem.append(linkName, button);
    posts.append(postItem);

    console.log(postsState);

    button.addEventListener('click', () => {
      linkName.classList.remove('fw-bold');
      linkName.classList.add('fw-normal', 'link-secondary');

      readBtn.textContent = i18next.t('readBtn');
      closeBtn.textContent = i18next.t('closeBtn');

      modalWatcher.modalPostLink = post.postLink;
      modalWatcher.modalPostTitle = post.postTitle;
      modalWatcher.modalPostDescription = post.postDescription;
      modalWatcher.visible = 'showed';
    });
  });
};

/*
const request = (link) => axios.get(`${allOriginsLink}${link}`)
  .then((response) => response)
  .catch((error) => {
    throw error;
  });
*/

const request = (link) => {
  const timeout = 1000;
  const source = axios.CancelToken.source();

  const timeoutId = setTimeout(() => {
    source.cancel('Timeout exceeded');
  }, timeout);

  return axios.get(`${allOriginsLink}${link}`)
    .then((response) => {
      if (!response) {
        clearTimeout(timeoutId);
        console.log(response);
      }
      console.log(response);
      submitBtn.disabled = false;
      return response;
    })
    .catch((error) => {
      submitBtn.disabled = false;
      if (axios.isCancel(error)) {
        throw new Error('networkError');
      }
      throw error;
    });
};

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
      feedPosts.push({
        postTitle,
        postDescription,
        postLink,
      });
    });
    return [feedTitle, feedDescription, feedPosts];
  } catch (e) {
    throw new Error(e.message = 'notRss');
  }
};

const postsWatcher = onChange(postsState, () => {
  postsRender();
});

const updateFeed = (link) => {
  const delay = 5000;
  let timer = setTimeout(function update() {
    axios.get(`${allOriginsLink}${link}`)
      .then((responseData) => {
        const [, , feedPosts] = parser(responseData.data.contents);
        feedPosts.forEach((item) => {
          if (!postsState.postsName.includes(item.postTitle)) {
            const newPost = item;
            newPost.postId = postIdCounter;
            postsWatcher.postsName.push(item.postTitle);
            postsWatcher.postsData.push(newPost);
            postIdCounter += 1;
            console.log(postsState);
          }
        });
        timer = setTimeout(update, delay);
      }).catch((err) => {
        console.log(err);
        stateWatcher.errors = 'unknownError';
      });
  }, delay);
};

const feedsWatcher = onChange(feedsState, () => {
  feedsRender();
  if (feedsState.length > 0) {
    feedsState.forEach((feed) => {
      const link = feed.feedLink;
      updateFeed(link);
    });
  }
});

export default () => {
  const subTitleEl = document.querySelector('.lead');
  const labelEl = document.querySelector('[for="url-input"]');
  const exampleEl = document.getElementById('example');
  const addButtonEl = document.querySelector('[aria-label="add"]');

  subTitleEl.textContent = i18next.t('subTitle');
  labelEl.textContent = i18next.t('inputHint');
  exampleEl.textContent = i18next.t('exampleLink');
  addButtonEl.textContent = i18next.t('add');

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

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    feedbackEl.innerHTML = '';
    stateWatcher.linkValidation = 'none';
    stateWatcher.errors = '';
    const link = inputEl.value;
    submitBtn.disabled = true;
    schema.isValid(link).then((response) => {
      if (!response) {
        inputEl.value = link;
        throw new Error('invalidUrl');
      }
    }).then(() => request(link)).then((responseData) => {
      const [feedTitle, feedDescription, feedPosts] = parser(responseData.data.contents);
      feedsState.forEach((item) => {
        if (item.feedTitle === feedTitle) {
          throw new Error('doubledChannel');
        }
      });
      feedsWatcher.push({
        feedTitle, feedLink: link, feedDescription,
      });
      feedPosts.forEach((item) => {
        postsWatcher.postsName.push(item.postTitle);
        item.postId = postIdCounter;
        postIdCounter += 1;
      });
      const posts = [...postsState.postsData, ...feedPosts];
      postsWatcher.postsData = posts;
      stateWatcher.linkValidation = 'valid';
      inputEl.value = '';
      inputEl.classList.remove('is-invalid');
      inputEl.classList.remove('is-valid');
      console.log(feedsState);
      console.log(postsState);
    })
      .catch((error) => {
        if (error.message === 'doubledChannel') {
          stateWatcher.errors = 'doubledChannel';
        }
        if (error.message === 'invalidUrl') {
          stateWatcher.errors = 'invalidUrl';
        }
        if (error.message === 'notRss') {
          stateWatcher.errors = 'notRss';
        }
        if (error.request || error.response) {
          stateWatcher.errors = 'notConnected';
        }
        inputEl.value = link;
      });
  });
};
