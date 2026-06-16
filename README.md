# Live-Calculating Matrix UI

A professional web-based spreadsheet application with real-time formula evaluation and circular dependency detection.

**Live Demo:** [View on GitHub Pages](https://devsoundweb.github.io/spotgamma-frontend-takehome/)

![Live-Calculating Matrix Screenshot](https://img.shields.io/badge/status-active-success)
![JavaScript](https://img.shields.io/badge/javascript-ES6+-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### 1. Grid Layout
- 10x10 grid rendered using CSS Grid
- Columns labeled A-J
- Rows labeled 1-10
- Modern, responsive design with gradient styling

### 2. Formula Support
- **Raw Text**: Each cell accepts plain text or numbers
- **Basic Math**: Start with `=` to create formulas
  - Examples: `=A1+B2`, `=C3*2`, `=A1-B2/4`
- **Range Functions**: Operate on cell ranges (e.g., A1:A5)
  - `SUM(range)` - Sum all values in range
  - `AVERAGE(range)` or `AVG(range)` - Calculate average
  - `MIN(range)` - Find minimum value
  - `MAX(range)` - Find maximum value
  - `COUNT(range)` - Count number of cells
  - `PRODUCT(range)` - Multiply all values
- **Single Argument Functions**:
  - `ABS(value)` - Absolute value
  - `SQRT(value)` - Square root
  - `ROUND(value)` - Round to nearest integer
- **Two Argument Functions**:
  - `POWER(base, exponent)` or `POW(base, exponent)` - Exponentiation
- **Automatic Evaluation**: All formulas are evaluated instantly

### 3. Circular Dependency Detection
- Implements a cycle-detection graph algorithm
- Prevents circular references (e.g., A1→B1, B1→A1)
- Shows error message when circular dependency is detected
- Does not crash or allow invalid updates

### 4. Real-Time Updates
- Changing a cell instantly updates all dependent cells
- Uses a dependency graph to track cell relationships
- Efficient recalculation using breadth-first traversal
- Visual feedback for cells with formulas

## How to Use

1. **Open the Application**
   - Open `index.html` in a modern web browser
   - No build process or dependencies required

2. **Enter Values**
   - Click any cell to edit
   - Type a value or text
   - Press Enter to save or Escape to cancel

3. **Create Formulas**
   - Start with `=` to create a formula
   - **Basic Math Examples:**
     - `=A1+B2` - Add two cells
     - `=C3*2-D4/2` - Complex math operations
   - **Range Function Examples:**
     - `=SUM(A1:A5)` - Sum a range
     - `=AVERAGE(B1:B10)` - Calculate average
     - `=MAX(C1:C5)` - Find maximum value
     - `=PRODUCT(A1:A3)` - Multiply all values
   - **Single Argument Examples:**
     - `=ABS(A1)` - Absolute value of A1
     - `=SQRT(B2)` - Square root of B2
     - `=ROUND(C3)` - Round C3 to nearest integer
   - **Two Argument Examples:**
     - `=POWER(A1,2)` - Square A1
     - `=POW(B1,3)` - Cube B1

4. **Visual Indicators**
   - Blue background: Cell contains a formula
   - Red background: Cell has an error
   - Yellow background: Cell is being edited

## Technical Implementation

### Architecture
- **Pure JavaScript** - No frameworks or dependencies
- **Object-Oriented Design** - Single `SpreadsheetApp` class
- **Event-Driven** - Responsive to user interactions

### Key Algorithms

#### Dependency Graph
- Tracks which cells depend on other cells
- Built using JavaScript `Set` data structure
- Updated automatically when formulas change

#### Cycle Detection
- Uses depth-first search with recursion stack
- Detects cycles before applying changes
- Prevents invalid updates that would create circular dependencies

#### Formula Evaluation
- Parses cell references (A1, B2, etc.)
- Expands range notation (A1:A5)
- Safely evaluates mathematical expressions
- Handles errors gracefully

#### Recalculation Engine
- Uses breadth-first search to update dependents
- Prevents duplicate calculations with visited tracking
- Ensures all affected cells are updated in correct order

### Performance
- Instant updates for all dependent cells
- Efficient O(V+E) cycle detection where V=cells, E=dependencies
- No unnecessary recalculations
- Smooth user experience even with complex dependencies

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Example Use Cases

### Example 1: Simple Addition
```
A1: 10
B1: 20
C1: =A1+B1
Result: C1 displays "30"
```

### Example 2: Range Functions
```
A1: 5
A2: 10
A3: 15
A4: 20
A5: 25
B1: =SUM(A1:A5)     → displays "75"
B2: =AVERAGE(A1:A5) → displays "15"
B3: =MIN(A1:A5)     → displays "5"
B4: =MAX(A1:A5)     → displays "25"
B5: =PRODUCT(A1:A3) → displays "750"
```

### Example 3: Circular Dependency (Blocked)
```
A1: =B1
B1: =A1
Result: Error message "Circular dependency detected!"
```

### Example 4: Math Functions
```
A1: -25
B1: =ABS(A1)     → displays "25"
C1: =SQRT(B1)    → displays "5"
D1: =POWER(C1,2) → displays "25"
E1: =ROUND(3.7)  → displays "4"
```

### Example 5: Chain Dependencies
```
A1: 10
B1: =A1*2
C1: =B1+5
D1: =C1/5
Result: A1→B1(20)→C1(25)→D1(5)
Changing A1 to 20 updates all: B1(40)→C1(45)→D1(9)
```

## Project Structure

```
SpotGammaAssignment/
├── index.html      # HTML structure
├── styles.css      # CSS styling and grid layout
├── app.js          # JavaScript application logic
└── README.md       # Documentation
```

## Deployment

This application is deployed on GitHub Pages. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/devsoundweb/spotgamma-frontend-takehome.git
git push -u origin main
```

Then enable GitHub Pages in repository Settings.

## License

MIT License - This project is created for the SpotGamma assignment.
