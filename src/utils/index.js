const nextPaint = () =>
	new Promise((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(resolve))
	);

const addColumnHeaders = (columnHeaders, liteDomStyles) => {
	const columnHeaderRules = columnHeaders
		.map((th, index) => {
			const content = JSON.stringify(th.textContent?.trim() + ':' ?? '');
			return `table[data-responsive-table].responsive td:nth-of-type(${
				index + 1
			})::before { display: block; content: ${content}; }`;
		})
		.filter(Boolean)
		.join('\n');

	if (!columnHeaderRules) {
		return liteDomStyles;
	}
	return `${liteDomStyles}\n${columnHeaderRules}\n`;
};

const toggleResponsiveCSSClass = (method, slot) => {
	slot
		.assignedElements({ flatten: true })
		.filter((node) => node.tagName === 'TABLE')
		.forEach((table) => {
			table.classList[method]('responsive');
		});
};

function applyCollapsibility(table) {
	const row = table.tBodies?.[0]?.rows?.[0] ?? table.rows?.[0];
	if (!row) return;
	const { height } = row.getBoundingClientRect();
	this.style.setProperty('--table-column-count', row.cells.length);
	this.style.setProperty('--table-row-height', `${height}px`);
}

function applyResponsiveStyles(addColumnHeaders, liteDomStyles, slot) {
	slot
		.assignedElements({ flatten: true })
		.filter((node) => node.tagName === 'TABLE')
		.forEach(async (table) => {
			if (!table.hasAttribute('data-responsive-table')) {
				table.setAttribute('data-responsive-table', 'true');
			}

			if (table.querySelector('style[data-responsive-table]')) {
				return;
			}

			const columnHeaders = Array.from(
				table?.tHead?.firstElementChild?.children
			);
			const style = document.createElement('style');

			style.dataset.responsiveTable = 'display-block';
			style.textContent = columnHeaders.length
				? addColumnHeaders(columnHeaders, liteDomStyles)
				: `${liteDomStyles}`;
			table.insertBefore(style, table.firstChild);
			await nextPaint();
			if (this.collapsable) {
				applyCollapsibility.call(this, table);
			}

			table.style.visibility = 'visible';
		});
}

export { addColumnHeaders, toggleResponsiveCSSClass, applyResponsiveStyles };
