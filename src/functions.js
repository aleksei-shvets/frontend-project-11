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

export {
  changesClasses,
  setAttributes,
  changesAttributes,
  generateHTMLElement,
};
