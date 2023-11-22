import { generateHTMLElement } from './functions.js';

export default (container, postsList, postsListTitleText, postButtonText) => {
  const postsContainer = container;
  postsContainer.innerHTML = '';

  const postsColumn = generateHTMLElement('div', ['card', 'border-0']);
  const postsTitleDiv = generateHTMLElement('div', ['card-body']);
  const postsListTitleEl = generateHTMLElement('h2', ['card-title', 'h4']);
  postsListTitleEl.textContent = postsListTitleText;

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
      ['fw-bold', 'pe-5', 'post-link'],
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
    button.textContent = postButtonText;
    button.dataset.postId = post.postId;
    postItem.append(linkName, button);
    postsUlElement.append(postItem);
  });
};
