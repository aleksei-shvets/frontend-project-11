export default (xmlString) => {
  try {
    const newParser = new DOMParser();
    const doc = newParser.parseFromString(xmlString, 'application/xhtml+xml');
    const postItems = doc.querySelectorAll('channel > item');
    const feedTitle = doc.querySelector('channel > title').textContent;
    const feedDescription = doc.querySelector('channel > description').textContent;
    const newPosts = [];
    postItems.forEach((post) => {
      const postTitle = post.querySelector('title').textContent;
      const postLink = post.querySelector('link').textContent;
      const postDescription = post.querySelector('description').textContent;
      newPosts.push({
        postTitle,
        postDescription,
        postLink,
      });
    });
    return [feedTitle, feedDescription, newPosts];
  } catch (e) {
    throw new Error('notRss');
  }
};
