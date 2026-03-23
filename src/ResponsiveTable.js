import slottedStyles from '@/css/slotted-style.css?inline';
import liteDomStyles from '@/css/lite-dom-style.css?inline';
import {
	addColumnHeaders,
	toggleResponsiveCSSClass,
	applyResponsiveStyles,
	applyCollapsibility
} from '@/utils';

export class ResponsiveTable extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.isResponsive = false;
	}

	get breakpoint() {
		return this.getAttribute('breakpoint') || 768;
	}

	get collapsable() {
		return this.hasAttribute('collapsable');
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
					if (!this.isResponsive) {
						toggleResponsiveCSSClass('add', slot);
						this.isResponsive = true;
						if (this.collapsable) {
							const tables = slot
								.assignedElements({ flatten: true })
								.filter((node) => node.tagName === 'TABLE');
							tables.forEach((table) => applyCollapsibility(table));
						}
					}
				} else {
					if (this.isResponsive) {
						toggleResponsiveCSSClass('remove', slot);
						this.isResponsive = false;
					}
				}
			}
		});

		resizeObserver.observe(container);

	}
}

customElements.define('responsive-table', ResponsiveTable);
