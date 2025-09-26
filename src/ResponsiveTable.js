import styles from './css/style.css?inline';

export class ResponsiveTable extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {

		this.shadowRoot.innerHTML = /* HTML */ `
			<style>
				${styles}
			</style>
			<div id="container">
        <slot></slot>
			</div>
		`;    

  }
}

customElements.define('responsive-table', ResponsiveTable);