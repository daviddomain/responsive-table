const nextPaint = () =>
	new Promise((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(resolve))
	);

let collapsibleRowId = 0;

const addColumnHeaders = (columnHeaders, liteDomStyles) => {
	const columnHeaderRules = columnHeaders
		.map((th, index) => {
			const content = JSON.stringify(th.textContent?.trim() + ':' ?? '');
			return `table[data-responsive-table].responsive td:nth-of-type(${index + 1})::before { display: block; content: ${content}; }`;
		})
		.filter(Boolean)
		.join('\n');

	if (!columnHeaderRules) {
		return liteDomStyles;
	}

	return `${liteDomStyles}\n${columnHeaderRules}\n`;
};

const getAssignedTables = (slot) =>
	slot
		.assignedElements({ flatten: true })
		.filter((node) => node.tagName === 'TABLE');

const toggleResponsiveCSSClass = (method, slot) => {
	getAssignedTables(slot).forEach((table) => {
		table.classList[method]('responsive');
	});
};

const getTableRows = (table) => {
	if (table.tBodies.length) {
		return Array.from(table.tBodies).flatMap((tbody) => Array.from(tbody.rows));
	}

	return Array.from(table.rows).filter((row) => row.closest('thead') !== table.tHead);
};

const isEligibleRow = (row) => {
	const firstCell = row.cells[0];
	return Boolean(firstCell) && firstCell.colSpan <= 1;
};

const updateToggleButtonState = (row, button) => {
	const isExpanded = row.classList.contains('is-expanded');
	button.setAttribute('aria-expanded', String(isExpanded));
	button.setAttribute(
		'aria-label',
		isExpanded ? 'Collapse row details' : 'Expand row details'
	);
};

const toggleRowExpansion = (row, button) => {
	row.classList.toggle('is-expanded');
	updateToggleButtonState(row, button);
};

const ensureToggleButton = (row) => {
	const firstCell = row.cells[0];
	if (!firstCell || firstCell.colSpan > 1) {
		return null;
	}

	if (!row.id) {
		collapsibleRowId += 1;
		row.id = `responsive-table-row-${collapsibleRowId}`;
	}

	let button = firstCell.querySelector('[data-collapsible-toggle]');
	if (!button) {
		button = document.createElement('button');
		button.type = 'button';
		button.className = 'responsive-table__toggle';
		button.dataset.collapsibleToggle = 'true';
		button.setAttribute('aria-controls', row.id);
		button.addEventListener('click', (event) => {
			event.stopPropagation();
			toggleRowExpansion(row, button);
		});
		firstCell.append(button);
	}

	updateToggleButtonState(row, button);
	return button;
};

const measureRowHeights = (row) => {
	const firstCell = row.cells[0];
	if (!firstCell) {
		return null;
	}

	const wasExpanded = row.classList.contains('is-expanded');

	row.classList.remove('is-expanded');
	row.style.setProperty('max-height', 'none');
	const collapsedHeight = Math.ceil(firstCell.getBoundingClientRect().height);

	row.classList.add('is-expanded');
	row.style.setProperty('max-height', 'none');
	const expandedHeight = Math.ceil(
		Math.max(row.scrollHeight, row.getBoundingClientRect().height)
	);

	row.classList.toggle('is-expanded', wasExpanded);
	row.style.removeProperty('max-height');

	return {
		collapsedHeight,
		expandedHeight: Math.max(collapsedHeight, expandedHeight)
	};
};

const syncCollapsibleRow = (row) => {
	if (!isEligibleRow(row)) {
		return;
	}

	const button = ensureToggleButton(row);
	if (!button) {
		return;
	}

	const measurements = measureRowHeights(row);
	if (!measurements) {
		return;
	}

	row.style.setProperty(
		'--row-collapsed-height',
		`${measurements.collapsedHeight}px`
	);
	row.style.setProperty(
		'--row-expanded-height',
		`${measurements.expandedHeight}px`
	);
	updateToggleButtonState(row, button);
};

const syncCollapsibleTable = (table) => {
	table.dataset.collapsible = 'true';
	getTableRows(table).forEach(syncCollapsibleRow);
};

const scheduleCollapsibleSync = (table) => {
	if (table._responsiveTableSyncFrame) {
		cancelAnimationFrame(table._responsiveTableSyncFrame);
	}

	table._responsiveTableSyncFrame = requestAnimationFrame(() => {
		table._responsiveTableSyncFrame = null;
		syncCollapsibleTable(table);
	});
};

const observeCollapsibleTable = (table) => {
	if (table._responsiveTableMutationObserver) {
		return;
	}

	table._responsiveTableMutationObserver = new MutationObserver(() => {
		if (table.classList.contains('responsive') && table.dataset.collapsible === 'true') {
			scheduleCollapsibleSync(table);
		}
	});

	table._responsiveTableMutationObserver.observe(table, {
		childList: true,
		characterData: true,
		subtree: true
	});

	if (document.fonts?.ready) {
		document.fonts.ready.then(() => {
			if (table.isConnected) {
				scheduleCollapsibleSync(table);
			}
		});
	}
};

function applyCollapsibility(table) {
	observeCollapsibleTable(table);
	syncCollapsibleTable(table);
}

function resetCollapsibility(table) {
	table.dataset.collapsible = 'false';

	if (table._responsiveTableSyncFrame) {
		cancelAnimationFrame(table._responsiveTableSyncFrame);
		table._responsiveTableSyncFrame = null;
	}

	getTableRows(table).forEach((row) => {
		row.classList.remove('is-expanded');
		row.style.removeProperty('--row-collapsed-height');
		row.style.removeProperty('--row-expanded-height');
		row.style.removeProperty('max-height');
		const button = row.querySelector('[data-collapsible-toggle]');
		if (button) {
			updateToggleButtonState(row, button);
		}
	});
}

function cleanupCollapsibility(table) {
	resetCollapsibility(table);
	table.removeAttribute('data-collapsible');

	if (table._responsiveTableMutationObserver) {
		table._responsiveTableMutationObserver.disconnect();
		table._responsiveTableMutationObserver = null;
	}
}

async function applyResponsiveStyles(addColumnHeaders, liteDomStyles, slot) {
	const tables = getAssignedTables(slot);

	for (const table of tables) {
		if (!table.hasAttribute('data-responsive-table')) {
			table.setAttribute('data-responsive-table', 'true');
		}

		if (!table.querySelector('style[data-responsive-table]')) {
			const columnHeaders = Array.from(
				table?.tHead?.firstElementChild?.children ?? []
			);
			const style = document.createElement('style');

			style.dataset.responsiveTable = 'display-block';
			style.textContent = columnHeaders.length
				? addColumnHeaders(columnHeaders, liteDomStyles)
				: liteDomStyles;
			table.insertBefore(style, table.firstChild);
		}

		table.style.visibility = 'visible';

		if (this.isResponsive && this.collapsible) {
			await nextPaint();
			applyCollapsibility(table);
		}
	}
}

export {
	addColumnHeaders,
	applyCollapsibility,
	applyResponsiveStyles,
	cleanupCollapsibility,
	nextPaint,
	resetCollapsibility,
	toggleResponsiveCSSClass
};
