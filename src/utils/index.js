const addColumnHeaders = (columnHeaders, liteDomStyles) => {
	const columnHeaderRules = columnHeaders
		.map((th, index) => {
			const content = JSON.stringify(th.textContent?.trim()+':' ?? '');
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

const applyResponsiveStyles = (addColumnHeaders, liteDomStyles, slot) => {
  console.log('slot changed')
	slot
		.assignedElements({ flatten: true })
		.filter((node) => node.tagName === 'TABLE')
		.forEach((table) => {
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
      table.style.visibility = "visible"
		});
};

export { addColumnHeaders, toggleResponsiveCSSClass, applyResponsiveStyles };
