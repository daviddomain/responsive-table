import slottedStyles from './css/slotted-style.css?inline';
import liteDomStyles from './css/lite-dom-style.css?inline';

export class ResponsiveTable extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		this.shadowRoot.innerHTML = /* HTML */ `
			<style>
				${slottedStyles}
			</style>
			<div id="container">
				<slot></slot>
			</div>
		`;

		const slot = this.shadowRoot.querySelector('slot');
		const applySlottedStyles = () => {
			slot
				.assignedElements({ flatten: true })
				.filter((node) => node.tagName === 'TABLE')
				.forEach((table) => {
					if (table.querySelector('style[data-responsive-table]')) {
						return;
					}
					const columnHeaders = Array.from(
						table?.tHead?.firstElementChild?.children
					);

          const addColumnHeaders = () => {
						const labelsFromColumnHeaders = columnHeaders
							.map((th) => th.textContent)
							.reduce((acc, next, index) => {
								return (
									acc +
									`td:nth-of-type(${index + 1}):before { content: "${next.trim()}"; }`
								);
							}, '');
              return liteDomStyles + labelsFromColumnHeaders
          }

					const style = document.createElement('style');
					style.dataset.responsiveTable = 'display-block';
					style.textContent = columnHeaders.length ? addColumnHeaders() : `${liteDomStyles}`;
          console.log(style.textContent)
					table.insertBefore(style, table.firstChild);
				});
		};

		applySlottedStyles();
		slot.addEventListener('slotchange', applySlottedStyles);
	}
}

customElements.define('responsive-table', ResponsiveTable);
