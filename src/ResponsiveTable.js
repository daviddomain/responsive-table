import slottedStyles from '@/css/slotted-style.css?inline';
import liteDomStyles from '@/css/lite-dom-style.css?inline';
import {
	addColumnHeaders,
	cleanupCollapsibility,
	nextPaint,
	toggleResponsiveCSSClass,
	applyResponsiveStyles,
	applyCollapsibility,
	resetCollapsibility
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

	get collapsible() {
		return this.hasAttribute('collapsible');
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
		this.slotElement = slot;

		slot.addEventListener(
			'slotchange',
			applyResponsiveStyles.bind(this, addColumnHeaders, liteDomStyles, slot)
		);

		this.resizeObserver = new ResizeObserver(async (entries) => {
			for (const entry of entries) {
				const {
					contentRect: { width }
				} = entry;
				if (width < this.breakpoint) {
					if (!this.isResponsive) {
						toggleResponsiveCSSClass('add', slot);
						this.isResponsive = true;
						await nextPaint();
					}

					if (this.collapsible) {
						const tables = slot
							.assignedElements({ flatten: true })
							.filter((node) => node.tagName === 'TABLE');
						tables.forEach((table) => applyCollapsibility(table));
					}
				} else {
					if (this.isResponsive) {
						const tables = slot
							.assignedElements({ flatten: true })
							.filter((node) => node.tagName === 'TABLE');
						if (this.collapsible) {
							tables.forEach((table) => resetCollapsibility(table));
						}
						toggleResponsiveCSSClass('remove', slot);
						this.isResponsive = false;
					}
				}
			}
		});

		this.resizeObserver.observe(container);
	}

	disconnectedCallback() {
		this.resizeObserver?.disconnect();

		const tables =
			this.slotElement
				?.assignedElements({ flatten: true })
				.filter((node) => node.tagName === 'TABLE') ?? [];
		tables.forEach((table) => cleanupCollapsibility(table));
	}
}

customElements.define('responsive-table', ResponsiveTable);
