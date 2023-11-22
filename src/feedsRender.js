import { generateHTMLElement } from './functions.js';

export default (state, texts) => {
  const currentState = [...state];
  const { feedsListTitle } = texts;
  const feedsContainer = document.querySelector('.feeds');
  feedsContainer.innerHTML = '';

  const feedsColumn = generateHTMLElement('div', ['card', 'border-0']);
  const feedTitleDiv = generateHTMLElement('div', ['card-body']);
  const feedsBlockTitle = generateHTMLElement('h2', ['card-title', 'h4']);
  feedsBlockTitle.textContent = `${feedsListTitle}`;

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
