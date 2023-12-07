/* eslint-disable no-param-reassign */
import axios from 'axios';
import onChange from 'on-change';
import uniqueId from 'lodash.uniqueid';
import * as yup from 'yup';
import parser from './parser.js';
import {
  feedbackMessageRender,
  feedsRender,
  postsRender,
  errorsRender,
  modalRender,
  renderWatchedLinks,
  staticElements,
} from './View.js';

const schema = yup.string().url();

const {
  formEl, feedbackEl, submitBtn, inputEl, modal,
} = staticElements;

const allOriginsLink = 'https://allorigins.hexlet.app/get?disableCache=true&url=';

const request = (link) => axios.get(`${allOriginsLink}${link}`)
  .then((response) => {
    submitBtn.disabled = false;
    return response;
  })
  .catch((error) => {
    if (axios.isAxiosError(error)) {
      throw new Error('notConnected');
    }
    error.message = 'unknownError';
    throw error;
  });

export default () => {
  const state = {
    linkValidation: { status: 'none' },
    errors: { message: '' },

    modalState: {
      visible: 'hidden',
      modalPostLink: '',
      modalPostTitle: '',
      modalPostDescription: '',
    },

    feedsState: {
      addedFeeds: [],
      feedItems: [],
    },

    postsState: {
      postsName: [],
      postsData: [],
      readPosts: [],
    },
  };

  const modalWatcher = onChange(state.modalState, (path, current) => {
    if (path === 'visible') {
      modalRender(current, state.modalState);
    }
  });

  const errorsWatcher = onChange(state.errors, () => {
    errorsRender(state.errors.message);
  });

  const linkValidationWatcher = onChange(state.linkValidation, () => {
    const { status } = state.linkValidation;
    feedbackMessageRender(status);
  });

  const readLinksWatcher = onChange(state.postsState, (path) => {
    if (path === 'readPosts') {
      renderWatchedLinks(state.postsState.readPosts);
    }
  });

  const addListeners = () => {
    const { postsContainer } = staticElements;
    postsContainer.addEventListener('click', (e) => {
      const clickedElement = e.target;
      const clickedElementName = clickedElement.nodeName;
      const id = clickedElement.dataset.postId;
      if (!state.postsState.readPosts.includes(id)) {
        readLinksWatcher.readPosts.push(id);
      }
      if (clickedElementName === 'BUTTON') {
        const clickedPost = state.postsState.postsData
          .find((post) => (Number(id) === Number(post.postId)));
        modalWatcher.modalPostLink = clickedPost.postLink;
        modalWatcher.modalPostTitle = clickedPost.postTitle;
        modalWatcher.modalPostDescription = clickedPost.postDescription;
        modalWatcher.visible = 'showed';
      }
    });
  };

  const postsWatcher = onChange(state.postsState, () => {
    postsRender(state.postsState.postsData);
    renderWatchedLinks(state.postsState.readPosts);
    addListeners();
  });

  const updateFeed = (link) => {
    const delay = 5000;

    const update = () => {
      request(link)
        .then((responseData) => {
          const [, , feedPosts] = parser(responseData.data.contents);

          feedPosts.forEach((item) => {
            if (!postsWatcher.postsName.includes(item.postTitle)) {
              const newPost = item;
              newPost.postId = uniqueId();
              postsWatcher.postsName.push(item.postTitle);
              postsWatcher.postsData.push(newPost);
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

  const feedsWatcher = onChange(state.feedsState, () => {
    feedsRender(state.feedsState.feedItems);
  });

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    feedbackEl.innerHTML = '';
    state.linkValidation.status = 'none';
    state.errors.message = '';
    const link = inputEl.value;
    submitBtn.disabled = true;
    try {
      if (link === '') {
        throw new Error('emptyField');
      }
      if (state.feedsState.addedFeeds.includes(link)) {
        throw new Error('doubledChannel');
      }
      schema.isValid(link).then((validLink) => {
        if (!validLink) {
          inputEl.value = link;
          throw new Error('invalidUrl');
        }
      }).then(() => request(link))
        .then((responseData) => {
          console.log(responseData);
          const [feedTitle, feedDescription, newPosts] = parser(responseData.data.contents);
          feedsWatcher.feedItems.push({
            feedTitle, feedDescription,
          });
          state.feedsState.addedFeeds.push(link);
          newPosts.forEach((item) => {
            postsWatcher.postsName.push(item.postTitle);
            item.postId = uniqueId();
          });
          const posts = [...postsWatcher.postsData, ...newPosts];
          postsWatcher.postsData = posts;
          linkValidationWatcher.status = 'valid';
          inputEl.value = '';
          feedsWatcher.addedFeeds.forEach((updatedLink) => {
            updateFeed(updatedLink);
          });
        })
        .catch((error) => {
          errorsWatcher.message = error.message;
          submitBtn.disabled = false;
          inputEl.value = link;
        });
    } catch (err) {
      submitBtn.disabled = false;
      errorsWatcher.message = err.message;
      inputEl.value = link;
    }
  });

  modal.addEventListener('click', (event) => {
    if (event.target.className !== 'modal' || event.target.nodeName === 'BUTTON') {
      modalWatcher.visible = 'hidden';
    }
  });
};
