/* eslint-disable no-param-reassign */
import axios from 'axios';

const allOriginsLink = 'https://allorigins.hexlet.app/get?disableCache=true&url=';

export default (link, staticElements) => {
  const { submitBtn } = staticElements;
  return axios.get(`${allOriginsLink}${link}`)
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
};
