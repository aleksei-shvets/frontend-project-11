import {
  setAttributes, changesAttributes, generateHTMLElement,
} from './functions.js';

const showModal = (state, staticElements) => {
  const { modalPostTitle, modalPostDescription, modalPostLink } = state;
  const {
    modalTitle, body, modalBody, readBtn, modal,
  } = staticElements;

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

  modalTitle.textContent = modalPostTitle;
  modalBody.textContent = modalPostDescription;
  readBtn.href = modalPostLink;

  const backdrop = generateHTMLElement('div', ['modal-backdrop', 'fade', 'show']);

  body.appendChild(backdrop);
};

const hideModal = (staticElements) => {
  const { body, modal } = staticElements;
  const backdropDivEl = document.querySelector('.modal-backdrop');
  modal.classList.remove('show');
  body.classList.remove('modal-open', 'style');
  body.removeAttribute('style');

  changesAttributes(modal, ['aria-modal', 'style'], { 'aria-hidden': 'true' });
  backdropDivEl.remove();
};

export default (currentStatus, state, staticElements) => {
  const modalRender = {
    showed: () => showModal(state, staticElements),
    hidden: () => hideModal(staticElements),
  };
  modalRender[currentStatus]();
};
