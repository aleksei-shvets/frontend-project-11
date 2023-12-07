/* eslint-disable no-param-reassign */
import axios from 'axios';
import uniqueId from 'lodash.uniqueid';
import * as yup from 'yup';
import parser from './parser.js';
import watcher, { staticElements } from './View.js';

const schema = yup.string().url();

const {
  formEl,
  submitBtn,
  inputEl,
  modal,
  postsContainer,
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
    linkValidation: 'none',
    errorMessage: '',

    modalVisible: 'hidden',
    modalPostLink: '',
    modalPostTitle: '',
    modalPostDescription: '',

    feedLinks: [],
    feedItems: [],
    postsName: [],
    postsData: [],
    readPosts: [],
  };

  const instanceWatcher = watcher(state);

  postsContainer.addEventListener('click', (e) => {
    const clickedElement = e.target;
    const clickedElementName = clickedElement.nodeName;
    const id = clickedElement.dataset.postId;
    if (!instanceWatcher.readPosts.includes(id)) {
      instanceWatcher.readPosts.push(id);
    }
    if (clickedElementName === 'BUTTON') {
      const clickedPost = instanceWatcher.postsData
        .find((post) => (Number(id) === Number(post.postId)));
      instanceWatcher.modalPostLink = clickedPost.postLink;
      instanceWatcher.modalPostTitle = clickedPost.postTitle;
      instanceWatcher.modalPostDescription = clickedPost.postDescription;
      instanceWatcher.modalVisible = 'showed';
    }
  });

  const updateFeed = (link) => {
    const delay = 5000;

    const update = () => {
      request(link)
        .then((responseData) => {
          const [, , feedPosts] = parser(responseData.data.contents);

          feedPosts.forEach((item) => {
            if (!instanceWatcher.postsName.includes(item.postTitle)) {
              const newPost = item;
              newPost.postId = uniqueId();
              instanceWatcher.postsName.push(item.postTitle);
              instanceWatcher.postsData.push(newPost);
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

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    instanceWatcher.linkValidation = 'none';
    instanceWatcher.errorMessage = '';
    const link = inputEl.value;
    submitBtn.disabled = true;
    try {
      if (link === '') {
        throw new Error('emptyField');
      }
      if (instanceWatcher.feedLinks.includes(link)) {
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
          instanceWatcher.feedItems.push({
            feedTitle, feedDescription,
          });
          instanceWatcher.feedLinks.push(link);
          newPosts.forEach((item) => {
            instanceWatcher.postsName.push(item.postTitle);
            item.postId = uniqueId();
          });
          const posts = [...instanceWatcher.postsData, ...newPosts];
          instanceWatcher.postsData = posts;
          instanceWatcher.linkValidation = 'valid';
          inputEl.value = '';
          instanceWatcher.feedLinks.forEach((updatedLink) => {
            updateFeed(updatedLink);
          });
        })
        .catch((error) => {
          instanceWatcher.errorMessage = error.message;
          submitBtn.disabled = false;
          inputEl.value = link;
        });
    } catch (err) {
      submitBtn.disabled = false;
      instanceWatcher.errorMessage = err.message;
      inputEl.value = link;
    }
  });

  modal.addEventListener('click', (event) => {
    if (event.target.className !== 'modal' || event.target.nodeName === 'BUTTON') {
      instanceWatcher.modalVisible = 'hidden';
    }
  });
};
