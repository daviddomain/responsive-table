import slottedStyles from '@/css/slotted-style.css?inline';
import liteDomStyles from '@/css/lite-dom-style.css?inline';
import {
	addColumnHeaders,
	toggleResponsiveCSSClass,
	applyResponsiveStyles
} from '@/utils';

export class ResponsiveTable extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	get breakpoint() {
		return this.getAttribute('breakpoint') || 768;
	}

  get type() {
    return this.getAttribute('type') || 'default';
  }

	connectedCallback() {
		this.shadowRoot.innerHTML = /* HTML */ `
			<style>
				${slottedStyles}
			</style>
			<div id="responsive-table-container">
				<slot></slot>
			</div>
		`;

		const container = this.shadowRoot.querySelector(
			'#responsive-table-container'
		);
		const slot = this.shadowRoot.querySelector('slot');

		slot.addEventListener(
			'slotchange',
			applyResponsiveStyles.bind(this, addColumnHeaders, liteDomStyles, slot)
		);

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const {
					contentRect: { width }
				} = entry;
				if (width < this.breakpoint) {
					toggleResponsiveCSSClass('add', slot);
				} else {
					toggleResponsiveCSSClass('remove', slot);
				}
			}
		});

		resizeObserver.observe(container);

	}
}

customElements.define('responsive-table', ResponsiveTable);
