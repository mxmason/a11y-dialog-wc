import { A11yDialog } from './a11y-dialog';

if (!window.customElements.get('a11y-dialog')) {
	window.A11yDialog = A11yDialog;
	window.customElements.define('a11y-dialog', A11yDialog);
}


