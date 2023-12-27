export default {
  string: {
    url: () => ({ key: 'invalidUrl' }),
  },
  mixed: {
    required: () => ({ key: 'emptyField' }),
    notOneOf: () => ({ key: 'doubledChannel' }),
  },
};
