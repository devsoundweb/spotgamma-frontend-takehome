class SpreadsheetApp {
    constructor() {
        this.cells = {};
        this.dependencies = {};
        this.formulas = {};
        this.currentEditingCell = null;
        this.errorMessageElement = document.getElementById('error-message');
        this.init();
    }

    init() {
        this.createGrid();
        this.initializeCells();
    }

    createGrid() {
        const spreadsheet = document.getElementById('spreadsheet');
        
        const corner = document.createElement('div');
        corner.className = 'cell corner';
        spreadsheet.appendChild(corner);

        for (let col = 0; col < 10; col++) {
            const header = document.createElement('div');
            header.className = 'cell header';
            header.textContent = String.fromCharCode(65 + col);
            spreadsheet.appendChild(header);
        }

        for (let row = 1; row <= 10; row++) {
            const rowHeader = document.createElement('div');
            rowHeader.className = 'cell row-header';
            rowHeader.textContent = row;
            spreadsheet.appendChild(rowHeader);

            for (let col = 0; col < 10; col++) {
                const cellId = this.getCellId(col, row);
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.cellId = cellId;
                
                const display = document.createElement('div');
                display.className = 'cell-display';
                display.textContent = '';
                cell.appendChild(display);

                cell.addEventListener('click', () => this.startEditing(cellId));
                
                spreadsheet.appendChild(cell);
            }
        }
    }

    initializeCells() {
        for (let row = 1; row <= 10; row++) {
            for (let col = 0; col < 10; col++) {
                const cellId = this.getCellId(col, row);
                this.cells[cellId] = {
                    rawValue: '',
                    displayValue: '',
                    isFormula: false
                };
                this.dependencies[cellId] = new Set();
            }
        }
    }

    getCellId(col, row) {
        return `${String.fromCharCode(65 + col)}${row}`;
    }

    parseCellId(cellId) {
        const match = cellId.match(/^([A-J])(\d+)$/);
        if (!match) return null;
        const col = match[1].charCodeAt(0) - 65;
        const row = parseInt(match[2]);
        if (row < 1 || row > 10 || col < 0 || col > 9) return null;
        return { col, row };
    }

    startEditing(cellId) {
        if (this.currentEditingCell) {
            this.stopEditing(this.currentEditingCell);
        }

        const cellElement = document.querySelector(`[data-cell-id="${cellId}"]`);
        const display = cellElement.querySelector('.cell-display');
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'cell-input';
        input.value = this.cells[cellId].rawValue;
        
        display.style.display = 'none';
        cellElement.appendChild(input);
        cellElement.classList.add('editing');
        
        input.focus();
        input.select();
        
        this.currentEditingCell = cellId;

        input.addEventListener('blur', () => this.stopEditing(cellId));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            } else if (e.key === 'Escape') {
                input.value = this.cells[cellId].rawValue;
                input.blur();
            }
        });
    }

    stopEditing(cellId) {
        const cellElement = document.querySelector(`[data-cell-id="${cellId}"]`);
        const input = cellElement.querySelector('.cell-input');
        const display = cellElement.querySelector('.cell-display');
        
        if (!input) return;

        const newValue = input.value;
        const oldValue = this.cells[cellId].rawValue;
        
        if (newValue !== oldValue) {
            this.updateCell(cellId, newValue);
        }
        
        input.remove();
        display.style.display = 'flex';
        cellElement.classList.remove('editing');
        this.currentEditingCell = null;
    }

    updateCell(cellId, value) {
        const oldDependencies = this.getDependenciesFromFormula(this.cells[cellId].rawValue);
        
        oldDependencies.forEach(depId => {
            this.dependencies[depId].delete(cellId);
        });

        const isFormula = value.startsWith('=');
        const newDependencies = isFormula ? this.getDependenciesFromFormula(value) : [];
        
        if (isFormula && this.wouldCreateCycle(cellId, newDependencies)) {
            this.showError(`Circular dependency detected! Cannot update ${cellId}.`);
            return;
        }

        this.cells[cellId].rawValue = value;
        this.cells[cellId].isFormula = isFormula;
        
        if (isFormula) {
            this.formulas[cellId] = value;
        } else {
            delete this.formulas[cellId];
        }

        newDependencies.forEach(depId => {
            if (!this.dependencies[depId]) {
                this.dependencies[depId] = new Set();
            }
            this.dependencies[depId].add(cellId);
        });

        this.clearError();
        this.recalculate(cellId);
        this.updateDependents(cellId);
    }

    getDependenciesFromFormula(formula) {
        if (!formula || !formula.startsWith('=')) return [];
        
        const dependencies = new Set();
        const cellRefPattern = /([A-J][1-9]|[A-J]10)/g;
        const matches = formula.match(cellRefPattern);
        
        if (matches) {
            matches.forEach(match => {
                if (this.parseCellId(match)) {
                    dependencies.add(match);
                }
            });
        }

        const functionNames = ['SUM', 'AVERAGE', 'AVG', 'MIN', 'MAX', 'COUNT', 'PRODUCT'];
        functionNames.forEach(funcName => {
            const rangePattern = new RegExp(`${funcName}\\(([A-J][1-9]|[A-J]10):([A-J][1-9]|[A-J]10)\\)`, 'gi');
            const rangeMatches = formula.matchAll(rangePattern);
            
            for (const match of rangeMatches) {
                const rangeCells = this.expandRange(match[1], match[2]);
                rangeCells.forEach(cell => dependencies.add(cell));
            }
        });
        
        return Array.from(dependencies);
    }

    wouldCreateCycle(cellId, newDependencies) {
        const visited = new Set();
        const recStack = new Set();

        const hasCycle = (current) => {
            if (recStack.has(current)) return true;
            if (visited.has(current)) return false;

            visited.add(current);
            recStack.add(current);

            const deps = current === cellId ? newDependencies : this.getDependenciesFromFormula(this.cells[current].rawValue);
            
            for (const dep of deps) {
                if (hasCycle(dep)) return true;
            }

            recStack.delete(current);
            return false;
        };

        return hasCycle(cellId);
    }

    expandRange(start, end) {
        const startParsed = this.parseCellId(start);
        const endParsed = this.parseCellId(end);
        
        if (!startParsed || !endParsed) return [];

        const cells = [];
        const minCol = Math.min(startParsed.col, endParsed.col);
        const maxCol = Math.max(startParsed.col, endParsed.col);
        const minRow = Math.min(startParsed.row, endParsed.row);
        const maxRow = Math.max(startParsed.row, endParsed.row);

        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                cells.push(this.getCellId(col, row));
            }
        }

        return cells;
    }

    recalculate(cellId) {
        const cell = this.cells[cellId];
        
        if (!cell.isFormula) {
            cell.displayValue = cell.rawValue;
        } else {
            try {
                cell.displayValue = this.evaluateFormula(cell.rawValue, cellId);
            } catch (error) {
                cell.displayValue = `#ERROR: ${error.message}`;
            }
        }

        this.renderCell(cellId);
    }

    evaluateFormula(formula, cellId) {
        let expression = formula.substring(1);

        expression = this.processRangeFunction(expression, 'SUM', (values) => {
            return values.reduce((acc, val) => acc + val, 0);
        });

        expression = this.processRangeFunction(expression, 'AVERAGE', (values) => {
            if (values.length === 0) return 0;
            return values.reduce((acc, val) => acc + val, 0) / values.length;
        });

        expression = this.processRangeFunction(expression, 'AVG', (values) => {
            if (values.length === 0) return 0;
            return values.reduce((acc, val) => acc + val, 0) / values.length;
        });

        expression = this.processRangeFunction(expression, 'MIN', (values) => {
            if (values.length === 0) return 0;
            return Math.min(...values);
        });

        expression = this.processRangeFunction(expression, 'MAX', (values) => {
            if (values.length === 0) return 0;
            return Math.max(...values);
        });

        expression = this.processRangeFunction(expression, 'COUNT', (values) => {
            return values.length;
        });

        expression = this.processRangeFunction(expression, 'PRODUCT', (values) => {
            if (values.length === 0) return 0;
            return values.reduce((acc, val) => acc * val, 1);
        });

        expression = this.processSingleArgFunction(expression, 'ABS', (value) => {
            return Math.abs(value);
        });

        expression = this.processSingleArgFunction(expression, 'SQRT', (value) => {
            if (value < 0) throw new Error('SQRT of negative number');
            return Math.sqrt(value);
        });

        expression = this.processSingleArgFunction(expression, 'ROUND', (value) => {
            return Math.round(value);
        });

        expression = this.processTwoArgFunction(expression, 'POWER', (base, exponent) => {
            return Math.pow(base, exponent);
        });

        expression = this.processTwoArgFunction(expression, 'POW', (base, exponent) => {
            return Math.pow(base, exponent);
        });

        const cellRefPattern = /([A-J][1-9]|[A-J]10)/g;
        expression = expression.replace(cellRefPattern, (match) => {
            if (match === cellId) {
                throw new Error('Self-reference');
            }
            const value = this.getCellNumericValue(match);
            return value;
        });

        try {
            const result = this.safeEval(expression);
            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                return result.toString();
            } else {
                throw new Error('Invalid calculation');
            }
        } catch (error) {
            throw new Error('Invalid formula');
        }
    }

    processRangeFunction(expression, functionName, callback) {
        const rangePattern = new RegExp(`${functionName}\\(([A-J][1-9]|[A-J]10):([A-J][1-9]|[A-J]10)\\)`, 'gi');
        return expression.replace(rangePattern, (match, start, end) => {
            const cells = this.expandRange(start, end);
            const values = cells.map(cell => this.getCellNumericValue(cell));
            return callback(values);
        });
    }

    processSingleArgFunction(expression, functionName, callback) {
        const singleArgPattern = new RegExp(`${functionName}\\(([^)]+)\\)`, 'gi');
        return expression.replace(singleArgPattern, (match, arg) => {
            const cellRefPattern = /^([A-J][1-9]|[A-J]10)$/;
            if (cellRefPattern.test(arg.trim())) {
                const value = this.getCellNumericValue(arg.trim());
                return callback(value);
            }
            const numValue = parseFloat(arg);
            if (!isNaN(numValue)) {
                return callback(numValue);
            }
            throw new Error(`Invalid argument for ${functionName}`);
        });
    }

    processTwoArgFunction(expression, functionName, callback) {
        const twoArgPattern = new RegExp(`${functionName}\\(([^,]+),([^)]+)\\)`, 'gi');
        return expression.replace(twoArgPattern, (match, arg1, arg2) => {
            const cellRefPattern = /^([A-J][1-9]|[A-J]10)$/;
            
            let val1, val2;
            
            if (cellRefPattern.test(arg1.trim())) {
                val1 = this.getCellNumericValue(arg1.trim());
            } else {
                val1 = parseFloat(arg1);
                if (isNaN(val1)) throw new Error(`Invalid first argument for ${functionName}`);
            }
            
            if (cellRefPattern.test(arg2.trim())) {
                val2 = this.getCellNumericValue(arg2.trim());
            } else {
                val2 = parseFloat(arg2);
                if (isNaN(val2)) throw new Error(`Invalid second argument for ${functionName}`);
            }
            
            return callback(val1, val2);
        });
    }

    safeEval(expression) {
        const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
        
        if (sanitized !== expression) {
            throw new Error('Invalid characters in expression');
        }

        try {
            return Function(`"use strict"; return (${sanitized})`)();
        } catch (error) {
            throw new Error('Evaluation failed');
        }
    }

    getCellNumericValue(cellId) {
        const cell = this.cells[cellId];
        if (!cell) return 0;
        
        const value = cell.displayValue || cell.rawValue;
        
        if (value === '' || value === null || value === undefined) {
            return 0;
        }
        
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    }

    updateDependents(cellId) {
        const dependents = this.dependencies[cellId];
        if (!dependents || dependents.size === 0) return;

        const visited = new Set();
        const queue = Array.from(dependents);

        while (queue.length > 0) {
            const dependent = queue.shift();
            
            if (visited.has(dependent)) continue;
            visited.add(dependent);

            this.recalculate(dependent);

            if (this.dependencies[dependent]) {
                this.dependencies[dependent].forEach(nextDep => {
                    if (!visited.has(nextDep)) {
                        queue.push(nextDep);
                    }
                });
            }
        }
    }

    renderCell(cellId) {
        const cellElement = document.querySelector(`[data-cell-id="${cellId}"]`);
        const display = cellElement.querySelector('.cell-display');
        const cell = this.cells[cellId];
        
        display.textContent = cell.displayValue;
        
        cellElement.classList.remove('has-formula', 'error');
        
        if (cell.isFormula) {
            cellElement.classList.add('has-formula');
        }
        
        if (cell.displayValue && cell.displayValue.startsWith('#ERROR')) {
            cellElement.classList.add('error');
        }
    }

    showError(message) {
        this.errorMessageElement.textContent = message;
        this.errorMessageElement.classList.remove('hidden');
        
        setTimeout(() => {
            this.clearError();
        }, 5000);
    }

    clearError() {
        this.errorMessageElement.classList.add('hidden');
        this.errorMessageElement.textContent = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SpreadsheetApp();
});
