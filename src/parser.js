export default (xmlString) => {
  const newParser = new DOMParser();
  const doc = newParser.parseFromString(xmlString, 'application/xhtml+xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError !== null) {
    const error = new Error(parseError);
    error.isParsingError = true;
    error.message = 'notRss';
    console.error(JSON.stringify(error));
    throw error;
  }
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
  return { feedTitle, feedDescription, newPosts };
};
