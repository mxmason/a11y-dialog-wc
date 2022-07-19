import { A11yDialog as A11yDialogElement } from './A11yDialog.js';

declare global {
  interface Window {
    A11yDialogElement: typeof A11yDialogElement
  }
}

if (!window.customElements.get('a11y-dialog')) {
  window.A11yDialogElement = A11yDialogElement
  window.customElements.define('a11y-dialog', A11yDialogElement)
}
