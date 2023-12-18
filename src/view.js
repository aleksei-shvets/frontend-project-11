import onChange from 'on-change';

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

export default (appState, staticElements, i18next) => {
  const {
    modalTitle,
    body,
    modalBody,
    readBtn,
    modal,
    feedbackEl,
    inputEl,
    submitBtn,
  } = staticElements;

  const renderWatchedLinks = (watchedLinksList) => {
    watchedLinksList.forEach((idItem) => {
      const link = document.querySelector(`[data-post-id="${idItem}"]`);
      changesClasses(link, ['fw-bold'], ['fw-normal', 'link-secondary']);
    });
  };

  const renderPosts = (postsList) => {
    const { postsContainer } = staticElements;
    postsContainer.innerHTML = '';

    const postsColumn = generateHTMLElement('div', ['card', 'border-0']);
    const postsTitleDiv = generateHTMLElement('div', ['card-body']);
    const postsListTitleEl = generateHTMLElement('h2', ['card-title', 'h4']);
    postsListTitleEl.textContent = i18next('postTitle');

    postsTitleDiv.append(postsListTitleEl);

    const postsUlElement = generateHTMLElement('ul', ['list-group', 'border-0', 'rounded-0']);

    postsColumn.append(postsTitleDiv, postsUlElement);
    postsContainer.append(postsColumn);

    postsList.forEach((post) => {
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
      button.textContent = i18next('viewing');
      button.dataset.postId = post.postId;
      postItem.append(linkName, button);
      postsUlElement.append(postItem);
    });
  };

  const showModal = (state) => {
    const { visiblePostId } = state.modal;

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
    const clickedPost = state.content.postsData
      .find((post) => (Number(visiblePostId) === Number(post.postId)));
    readBtn.href = clickedPost.postLink;
    modalTitle.textContent = clickedPost.postTitle;
    modalBody.textContent = clickedPost.postDescription;

    const backdrop = generateHTMLElement('div', ['modal-backdrop', 'fade', 'show']);

    body.appendChild(backdrop);
  };

  const hideModal = () => {
    const backdropDivEl = document.querySelector('.modal-backdrop');
    modal.classList.remove('show');
    body.classList.remove('modal-open', 'style');
    body.removeAttribute('style');

    changesAttributes(modal, ['aria-modal', 'style'], { 'aria-hidden': 'true' });
    backdropDivEl.remove();
  };

  const renderModal = (currentStatus, state) => {
    const render = {
      showed: () => showModal(state),
      hidden: () => hideModal(),
    };
    render[currentStatus]();
  };

  const renderErrors = (formState) => {
    const { errorMessage } = formState;
    if (errorMessage !== '') {
      feedbackEl.textContent = i18next(`errors.${errorMessage}`);
      changesClasses(feedbackEl, ['text-success'], ['text-danger']);
      changesClasses(inputEl, ['is-valid'], ['is-invalid']);
    }
  };

  const renderFormState = (formState) => {
    const { state, inputText } = formState;
    const states = {
      filling: () => { submitBtn.disabled = false; },
      processing: () => { submitBtn.disabled = true; },
      failed: () => {
        inputEl.textContent = inputText;
        submitBtn.disabled = false;
      },
      processed: () => {
        submitBtn.disabled = false;
        feedbackEl.textContent = i18next('feedback.uploadRss');
        changesClasses(feedbackEl, ['text-danger'], ['text-success']);
        changesClasses(inputEl, ['is-invalid'], ['is-valid']);
        inputEl.value = inputText;
      },
    };
    states[state]();
  };

  const renderFeeds = (feedsState) => {
    const currentState = [...feedsState];
    const feedsContainer = document.querySelector('.feeds');
    feedsContainer.innerHTML = '';

    const feedsColumn = generateHTMLElement('div', ['card', 'border-0']);
    const feedTitleDiv = generateHTMLElement('div', ['card-body']);
    const feedsBlockTitle = generateHTMLElement('h2', ['card-title', 'h4']);
    feedsBlockTitle.textContent = i18next('feedTitle');

    const feeds = generateHTMLElement('ul', ['list-group', 'border-0', 'rounded-0']);

    feedTitleDiv.append(feedsBlockTitle);
    feedsColumn.append(feedTitleDiv, feeds);
    feedsContainer.append(feedsColumn);

    currentState.forEach((feed) => {
      const feedItem = generateHTMLElement('li', ['list-group-item', 'border-0', 'border-end-0']);
      const feedTitle = generateHTMLElement('h3', ['h6', 'm-0']);
      feedTitle.textContent = feed.feedTitle;
      const feedDescription = generateHTMLElement('p', ['m-0', 'small', 'text-black-50']);
      feedDescription.textContent = feed.feedDescription;

      feedItem.append(feedTitle, feedDescription);
      feeds.append(feedItem);
    });
  };

  return onChange(appState, (path, current) => {
    switch (path) {
      case 'modal.modalVisible':
        renderModal(current, appState);
        break;
      case 'form.errorMessage':
        renderErrors(appState.form);
        break;
      case 'form.state':
        renderFormState(appState.form);
        break;
      case 'content.readPosts':
        renderWatchedLinks(current);
        break;
      case 'content.postsData':
        renderPosts(current);
        renderWatchedLinks(appState.content.readPosts);
        break;
      case 'content.feedItems':
        renderFeeds(current);
        break;
      default:
        break;
    }
  });
};
