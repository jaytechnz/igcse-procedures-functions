/* ═══════════════════════════════════════════════════════
   IGCSE 0478 — Functions & Parameters — app.js
   ═══════════════════════════════════════════════════════ */

// ─── VIEW SWITCHING ───
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-' + btn.dataset.view).classList.add('active');
  });
});

/* ═══════════════════════════════════════════════════════
   SECTION 1 — INTERACTIVE DEMO (Drag & Drop)
   ═══════════════════════════════════════════════════════ */

const scenarios = [
  // 0 — Simple procedure
  {
    code:
`<span class="kw">PROCEDURE</span> <span class="fn">SayHello</span>()
    <span class="kw">OUTPUT</span> <span class="str">"Hello, World!"</span>
<span class="kw">ENDPROCEDURE</span>

<span class="cmt">// Calling the procedure:</span>
<span class="kw">CALL</span> <span class="fn">SayHello</span>()`,
    explanation: `A <b>procedure</b> is a named block of reusable code. It runs when you <b>call</b> it. This procedure takes <b>no parameters</b> — the parentheses are empty. Every time you call <code>SayHello()</code>, it outputs the same text.`,
    args: [],
    params: [],
    correctMap: {},
    returnMode: false,
    returnArgs: [],
    returnCorrect: null
  },
  // 1 — One argument
  {
    code:
`<span class="kw">PROCEDURE</span> <span class="fn">Greet</span>(<span class="param">Name</span> : <span class="kw">STRING</span>)
    <span class="kw">OUTPUT</span> <span class="str">"Hello, "</span> &amp; <span class="param">Name</span>
<span class="kw">ENDPROCEDURE</span>

<span class="cmt">// Calling with an argument:</span>
<span class="kw">CALL</span> <span class="fn">Greet</span>(<span class="hl">"Alice"</span>)`,
    explanation: `The procedure <code>Greet</code> has one <b>parameter</b> called <code>Name</code>. When we call <code>Greet("Alice")</code>, the <b>argument</b> <code>"Alice"</code> is passed into the parameter <code>Name</code>. Inside the procedure, <code>Name</code> holds the value <code>"Alice"</code>.<br><br><b>Drag "Alice"</b> onto the <b>Name</b> slot to see it in action.`,
    args: ['"Alice"'],
    params: ['Name'],
    correctMap: { 'Name': '"Alice"' },
    returnMode: false,
    returnArgs: [],
    returnCorrect: null
  },
  // 2 — Two arguments
  {
    code:
`<span class="kw">PROCEDURE</span> <span class="fn">AddNumbers</span>(<span class="param">X</span> : <span class="kw">INTEGER</span>, <span class="param">Y</span> : <span class="kw">INTEGER</span>)
    <span class="kw">OUTPUT</span> <span class="param">X</span> + <span class="param">Y</span>
<span class="kw">ENDPROCEDURE</span>

<span class="cmt">// Calling with two arguments:</span>
<span class="kw">CALL</span> <span class="fn">AddNumbers</span>(<span class="hl">5</span>, <span class="hl">3</span>)`,
    explanation: `<code>AddNumbers</code> has <b>two parameters</b>: <code>X</code> and <code>Y</code>. Arguments are matched <b>by position</b> — the first argument <code>5</code> goes into <code>X</code>, the second argument <code>3</code> goes into <code>Y</code>.<br><br><b>Drag each value</b> into the correct parameter slot. Order matters!`,
    args: ['5', '3'],
    params: ['X', 'Y'],
    correctMap: { 'X': '5', 'Y': '3' },
    returnMode: false,
    returnArgs: [],
    returnCorrect: null
  },
  // 3 — Function with RETURN
  {
    code:
`<span class="kw">FUNCTION</span> <span class="fn">Square</span>(<span class="param">Num</span> : <span class="kw">INTEGER</span>) <span class="kw">RETURNS INTEGER</span>
    <span class="ret">RETURN</span> <span class="param">Num</span> * <span class="param">Num</span>
<span class="kw">ENDFUNCTION</span>

<span class="cmt">// Using the function:</span>
Result ← <span class="fn">Square</span>(<span class="hl">4</span>)
<span class="cmt">// Result now holds 16</span>`,
    explanation: `A <b>function</b> is like a procedure but it <b>returns a value</b>. <code>Square(4)</code> passes <code>4</code> into <code>Num</code>, then the function computes <code>4 * 4</code> and <b>returns 16</b>.<br><br><b>Step 1:</b> Drag <code>4</code> into <code>Num</code>.<br><b>Step 2:</b> Drag <code>16</code> into the Return Value slot.`,
    args: ['4'],
    params: ['Num'],
    correctMap: { 'Num': '4' },
    returnMode: true,
    returnArgs: ['16'],
    returnCorrect: '16'
  },
  // 4 — ByVal vs ByRef concept
  {
    code:
`<span class="kw">PROCEDURE</span> <span class="fn">DoubleIt</span>(<span class="kw">BYREF</span> <span class="param">N</span> : <span class="kw">INTEGER</span>)
    <span class="param">N</span> ← <span class="param">N</span> * 2
<span class="kw">ENDPROCEDURE</span>

<span class="cmt">// Before call:</span>
MyNum ← <span class="num">7</span>
<span class="kw">CALL</span> <span class="fn">DoubleIt</span>(<span class="hl">MyNum</span>)
<span class="cmt">// After call: MyNum = 14 (changed!)</span>`,
    explanation: `<b>BYVAL</b> (by value) — the function gets a <b>copy</b>. Changes inside the procedure do NOT affect the original variable.<br><br><b>BYREF</b> (by reference) — the function gets a <b>reference</b> to the original variable. Changes inside the procedure DO affect the original.<br><br>Here, <code>MyNum</code> is passed <b>by reference</b>. Drag <code>MyNum→7</code> into <code>N</code>, then drag the result <code>14</code> into the Return slot to show the original variable was changed.`,
    args: ['MyNum→7'],
    params: ['N'],
    correctMap: { 'N': 'MyNum→7' },
    returnMode: true,
    returnArgs: ['14'],
    returnCorrect: '14'
  }
];

const scenarioSelect = document.getElementById('scenarioSelect');
const codeDisplay    = document.getElementById('codeDisplay');
const codeExplanation= document.getElementById('codeExplanation');
const argItems       = document.getElementById('argItems');
const paramItems     = document.getElementById('paramItems');
const returnZone     = document.getElementById('returnZone');
const returnSlot     = document.getElementById('returnSlot');
const demoFeedback   = document.getElementById('demoFeedback');
const passArrow      = document.getElementById('passArrow');
const arrowLabel     = document.getElementById('arrowLabel');
const resetDemoBtn   = document.getElementById('resetDemoBtn');

let currentScenario = null;
let filledSlots = {};

function loadScenario(index) {
  const s = scenarios[index];
  currentScenario = s;
  filledSlots = {};

  codeDisplay.innerHTML = s.code;
  codeExplanation.innerHTML = s.explanation;
  demoFeedback.textContent = '';
  demoFeedback.className = 'demo-feedback';

  // Args
  argItems.innerHTML = '';
  s.args.forEach(a => {
    const chip = document.createElement('div');
    chip.className = 'arg-chip';
    chip.textContent = a;
    chip.draggable = true;
    chip.dataset.value = a;
    chip.addEventListener('dragstart', onDragStart);
    chip.addEventListener('dragend', onDragEnd);
    argItems.appendChild(chip);
  });

  // Return args (appear with normal args but for the return slot)
  if (s.returnMode && s.returnArgs.length) {
    s.returnArgs.forEach(a => {
      const chip = document.createElement('div');
      chip.className = 'arg-chip';
      chip.style.background = '#f7768e';
      chip.textContent = a;
      chip.draggable = true;
      chip.dataset.value = a;
      chip.dataset.returnChip = '1';
      chip.addEventListener('dragstart', onDragStart);
      chip.addEventListener('dragend', onDragEnd);
      argItems.appendChild(chip);
    });
  }

  // Param slots
  paramItems.innerHTML = '';
  s.params.forEach(p => {
    const slot = document.createElement('div');
    slot.className = 'param-slot';
    slot.textContent = p;
    slot.dataset.param = p;
    slot.addEventListener('dragover', onDragOver);
    slot.addEventListener('dragleave', onDragLeave);
    slot.addEventListener('drop', onDrop);
    paramItems.appendChild(slot);
  });

  // Return zone
  if (s.returnMode) {
    returnZone.classList.remove('hidden');
    returnSlot.innerHTML = '<span class="placeholder">Drop result here</span>';
    returnSlot.classList.remove('filled');
    returnSlot.addEventListener('dragover', onDragOver);
    returnSlot.addEventListener('dragleave', onDragLeave);
    returnSlot.addEventListener('drop', onDropReturn);
  } else {
    returnZone.classList.add('hidden');
  }

  // Arrow label
  arrowLabel.textContent = s.params.length === 0 ? '(no params)' : 'pass';

  // If no args at all, show info
  if (s.args.length === 0 && !s.returnMode) {
    demoFeedback.textContent = 'This procedure has no parameters — nothing to drag!';
    demoFeedback.className = 'demo-feedback info';
  }
}

function onDragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.dataset.value);
  e.dataTransfer.setData('returnChip', e.target.dataset.returnChip || '');
  e.target.classList.add('dragging');
}
function onDragEnd(e) { e.target.classList.remove('dragging'); }
function onDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function onDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }

function onDrop(e) {
  e.preventDefault();
  const slot = e.currentTarget;
  slot.classList.remove('drag-over');
  const value = e.dataTransfer.getData('text/plain');
  const isReturn = e.dataTransfer.getData('returnChip') === '1';

  if (isReturn) {
    demoFeedback.textContent = 'That chip goes in the Return Value slot, not a parameter slot.';
    demoFeedback.className = 'demo-feedback error';
    return;
  }

  const paramName = slot.dataset.param;
  const correct = currentScenario.correctMap[paramName];

  slot.textContent = paramName + ' = ' + value;
  slot.classList.add('filled');
  filledSlots[paramName] = value;

  if (value === correct) {
    slot.classList.add('correct');
    slot.classList.remove('incorrect');
  } else {
    slot.classList.add('incorrect');
    slot.classList.remove('correct');
    demoFeedback.textContent = `Hmm — "${value}" doesn't match the expected argument for ${paramName}. Try again!`;
    demoFeedback.className = 'demo-feedback error';
    setTimeout(() => {
      slot.textContent = paramName;
      slot.className = 'param-slot';
      delete filledSlots[paramName];
    }, 1200);
    return;
  }

  // Remove used chip
  const chip = argItems.querySelector(`.arg-chip[data-value="${value}"]:not([data-return-chip="1"])`);
  if (chip) chip.remove();

  checkDemoComplete();
}

function onDropReturn(e) {
  e.preventDefault();
  returnSlot.classList.remove('drag-over');
  const value = e.dataTransfer.getData('text/plain');

  if (value === currentScenario.returnCorrect) {
    returnSlot.innerHTML = '';
    returnSlot.textContent = 'RETURN → ' + value;
    returnSlot.classList.add('filled');
    const chip = argItems.querySelector(`.arg-chip[data-value="${value}"]`);
    if (chip) chip.remove();
    checkDemoComplete();
  } else {
    demoFeedback.textContent = `That's not the correct return value. Think about what the function computes!`;
    demoFeedback.className = 'demo-feedback error';
  }
}

function checkDemoComplete() {
  const s = currentScenario;
  const allParamsFilled = s.params.every(p => filledSlots[p] === s.correctMap[p]);
  const returnOK = !s.returnMode || returnSlot.classList.contains('filled');

  if (allParamsFilled && returnOK) {
    demoFeedback.textContent = '✓ Correct! All values passed successfully.';
    demoFeedback.className = 'demo-feedback success';
  }
}

scenarioSelect.addEventListener('change', () => loadScenario(+scenarioSelect.value));
resetDemoBtn.addEventListener('click', () => loadScenario(+scenarioSelect.value));

// Init
loadScenario(0);


/* ═══════════════════════════════════════════════════════
   SECTION 2 — DISCUSSION QUESTIONS (Random order)
   ═══════════════════════════════════════════════════════ */

const questions = [
  {
    q: `What is the difference between a <b>procedure</b> and a <b>function</b>?`,
    a: `A <b>procedure</b> performs an action but does <b>not return a value</b>. A <b>function</b> performs an action and <b>returns a value</b> that can be used elsewhere (e.g., assigned to a variable or used in an expression).`
  },
  {
    q: `What is a <b>parameter</b>? How is it different from an <b>argument</b>?`,
    a: `A <b>parameter</b> is the variable name listed in the function/procedure definition — it's a placeholder. An <b>argument</b> is the actual value passed in when the function is called. Parameters are defined; arguments are supplied.`
  },
  {
    q: `Why do we use parameters instead of just using global variables inside a procedure?`,
    a: `Parameters make code <b>reusable</b> and <b>modular</b>. The procedure can work with different values each time. Global variables create tight coupling, making code harder to debug and maintain.`
  },
  {
    q: `Look at this call: <code>CalculateArea(5, 10)</code>. If the definition is <code>PROCEDURE CalculateArea(Length, Width)</code>, what value does <code>Width</code> hold?`,
    a: `<code>Width</code> holds <b>10</b>. Arguments are matched to parameters <b>by position</b>: the first argument (5) goes to <code>Length</code>, the second (10) goes to <code>Width</code>.`
  },
  {
    q: `What does <b>BYVAL</b> (by value) mean? Give an example of when you'd use it.`,
    a: `<b>BYVAL</b> means a <b>copy</b> of the argument is passed. Any changes inside the procedure do not affect the original. Use it when you need to read a value but must not change it — e.g., displaying a score without modifying the score variable.`
  },
  {
    q: `What does <b>BYREF</b> (by reference) mean? Why might it be useful?`,
    a: `<b>BYREF</b> means the procedure receives a <b>reference</b> to the original variable. Changes inside the procedure <b>do</b> affect the original. Useful when the procedure needs to update the caller's variable — e.g., swapping two values, or accumulating a running total.`
  },
  {
    q: `A function is defined as:<pre>FUNCTION Triple(N : INTEGER) RETURNS INTEGER\n    RETURN N * 3\nENDFUNCTION</pre>What does <code>Result ← Triple(Triple(2))</code> evaluate to?`,
    a: `First, <code>Triple(2)</code> returns <code>6</code>. Then <code>Triple(6)</code> returns <code>18</code>. So <code>Result = 18</code>. This shows that a function's return value can be used as an argument to another function call (or even the same function).`
  },
  {
    q: `What happens if you call a procedure with the <b>wrong number of arguments</b>?`,
    a: `You get an <b>error</b>. The number of arguments must match the number of parameters. If the function expects 2 parameters and you supply 1, the program will not run correctly.`
  },
  {
    q: `What is a <b>local variable</b>? How does it relate to parameters?`,
    a: `A <b>local variable</b> exists only inside the procedure/function. Parameters act like local variables — they are created when the procedure is called and destroyed when it ends. This means they don't conflict with variables of the same name elsewhere.`
  },
  {
    q: `Why is it considered good practice to use <b>meaningful parameter names</b>?`,
    a: `Meaningful names make code <b>self-documenting</b>. <code>CalculateArea(Length, Width)</code> is immediately understandable. <code>CalculateArea(A, B)</code> requires the reader to figure out what A and B represent.`
  },
  {
    q: `Can a function call another function? Give a pseudocode example.`,
    a: `Yes! For example:<pre>FUNCTION AddTax(Price : REAL) RETURNS REAL\n    RETURN Price * 1.15\nENDFUNCTION\n\nFUNCTION FinalBill(Price : REAL, Qty : INTEGER) RETURNS REAL\n    RETURN AddTax(Price * Qty)\nENDFUNCTION</pre>Here <code>FinalBill</code> calls <code>AddTax</code> inside its own return statement.`
  },
  {
    q: `What data type does this function return?<pre>FUNCTION IsEven(N : INTEGER) RETURNS ???\n    RETURN (N MOD 2 = 0)\nENDFUNCTION</pre>`,
    a: `It returns a <b>BOOLEAN</b>. The expression <code>N MOD 2 = 0</code> evaluates to <code>TRUE</code> or <code>FALSE</code>.`
  }
];

let shuffledQuestions = [];
let qIndex = -1;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const showQuestionBtn = document.getElementById('showQuestionBtn');
const revealAnswerBtn = document.getElementById('revealAnswerBtn');
const questionCard    = document.getElementById('questionCard');
const answerCard      = document.getElementById('answerCard');
const qCounter        = document.getElementById('qCounter');

showQuestionBtn.addEventListener('click', () => {
  if (shuffledQuestions.length === 0 || qIndex >= shuffledQuestions.length - 1) {
    shuffledQuestions = shuffleArray(questions);
    qIndex = -1;
  }
  qIndex++;
  const q = shuffledQuestions[qIndex];
  questionCard.innerHTML = q.q;
  answerCard.classList.add('hidden');
  answerCard.innerHTML = '';
  revealAnswerBtn.disabled = false;
  qCounter.textContent = `Question ${qIndex + 1} / ${shuffledQuestions.length}`;
});

revealAnswerBtn.addEventListener('click', () => {
  const q = shuffledQuestions[qIndex];
  answerCard.innerHTML = '<strong>Guidance:</strong> ' + q.a;
  answerCard.classList.remove('hidden');
  revealAnswerBtn.disabled = true;
});


/* ═══════════════════════════════════════════════════════
   SECTION 3 — STUDENT TASKS (Ordered easy → hard)
   ═══════════════════════════════════════════════════════ */

const tasks = [
  // ── EASY (1-6) ──
  {
    title: 'Task 1 — Identify the Parts',
    difficulty: 'easy',
    body: `Look at this pseudocode:
<pre>PROCEDURE Greet(Name : STRING)
    OUTPUT "Hello, " &amp; Name
ENDPROCEDURE

CALL Greet("Anika")</pre>
<b>Write down:</b>
<ol>
  <li>The name of the procedure</li>
  <li>The parameter</li>
  <li>The argument</li>
</ol>`
  },
  {
    title: 'Task 2 — Trace the Output',
    difficulty: 'easy',
    body: `What is the output of this code?
<pre>PROCEDURE ShowDouble(X : INTEGER)
    OUTPUT X * 2
ENDPROCEDURE

CALL ShowDouble(7)</pre>`
  },
  {
    title: 'Task 3 — Fill in the Blank',
    difficulty: 'easy',
    body: `Complete the missing parts:
<pre>PROCEDURE PrintStars(______ : INTEGER)
    FOR I ← 1 TO Count
        OUTPUT "*"
    NEXT I
ENDPROCEDURE

CALL PrintStars(______)</pre>
Choose a parameter name and an argument so the procedure prints 5 stars.`
  },
  {
    title: 'Task 4 — Spot the Error',
    difficulty: 'easy',
    body: `This code has one error. Find it and explain how to fix it.
<pre>PROCEDURE SayAge(Age : INTEGER)
    OUTPUT "You are " &amp; Age &amp; " years old"
ENDPROCEDURE

CALL SayAge("fifteen")</pre>`
  },
  {
    title: 'Task 5 — Write a Procedure Call',
    difficulty: 'easy',
    body: `A procedure is defined as:
<pre>PROCEDURE DisplayMessage(Msg : STRING, Times : INTEGER)
    FOR I ← 1 TO Times
        OUTPUT Msg
    NEXT I
ENDPROCEDURE</pre>
Write a <b>call statement</b> that displays <code>"Well done!"</code> three times.`
  },
  {
    title: 'Task 6 — Procedure vs Function',
    difficulty: 'easy',
    body: `In your own words, explain the difference between a procedure and a function. Give one example of when you would use each.`
  },

  // ── MEDIUM (7-14) ──
  {
    title: 'Task 7 — Write a Simple Procedure',
    difficulty: 'medium',
    body: `Write a procedure called <code>PrintBorder</code> that takes an <b>integer parameter</b> called <code>Length</code> and outputs a line of that many dash characters (<code>-</code>).<br><br>
Then write two calls: one that prints a border of length 10, and one of length 25.`
  },
  {
    title: 'Task 8 — Write a Simple Function',
    difficulty: 'medium',
    body: `Write a function called <code>AddVAT</code> that takes a <code>REAL</code> parameter <code>Price</code> and returns the price with 15% VAT added.<br><br>
Show how you would use it: <code>Total ← AddVAT(200.00)</code> — what value does <code>Total</code> hold?`
  },
  {
    title: 'Task 9 — Two Parameters',
    difficulty: 'medium',
    body: `Write a function called <code>Power</code> that takes two integer parameters, <code>Base</code> and <code>Exponent</code>, and returns <code>Base</code> raised to the power of <code>Exponent</code>.<br><br>
<b>Hint:</b> Use a loop that multiplies <code>Result</code> by <code>Base</code> a total of <code>Exponent</code> times.<br><br>
Trace through <code>Power(3, 4)</code> and show the value of <code>Result</code> after each iteration.`
  },
  {
    title: 'Task 10 — Trace Table',
    difficulty: 'medium',
    body: `Trace through this code and complete a trace table showing the values of <code>Total</code> and <code>Output</code> at each step:
<pre>FUNCTION SumRange(Start : INTEGER, Finish : INTEGER) RETURNS INTEGER
    Total ← 0
    FOR I ← Start TO Finish
        Total ← Total + I
    NEXT I
    RETURN Total
ENDFUNCTION

Result ← SumRange(3, 6)</pre>
What is the final value of <code>Result</code>?`
  },
  {
    title: 'Task 11 — Parameter Order Matters',
    difficulty: 'medium',
    body: `Consider:
<pre>PROCEDURE Subtract(A : INTEGER, B : INTEGER)
    OUTPUT A - B
ENDPROCEDURE

CALL Subtract(10, 4)
CALL Subtract(4, 10)</pre>
<ol>
  <li>What is the output of each call?</li>
  <li>Explain why the order of arguments matters.</li>
</ol>`
  },
  {
    title: 'Task 12 — Local vs Global',
    difficulty: 'medium',
    body: `Look at this code and predict the output. Explain your answer.
<pre>X ← 100

PROCEDURE ChangeX(X : INTEGER)
    X ← X + 50
    OUTPUT X
ENDPROCEDURE

CALL ChangeX(10)
OUTPUT X</pre>
<b>Hint:</b> Think about whether <code>X</code> inside the procedure is the same as the global <code>X</code>.`
  },
  {
    title: 'Task 13 — BYVAL Trace',
    difficulty: 'medium',
    body: `Trace this code. What are the final outputs?
<pre>PROCEDURE Halve(BYVAL N : INTEGER)
    N ← N DIV 2
    OUTPUT "Inside: " &amp; N
ENDPROCEDURE

MyNum ← 20
CALL Halve(MyNum)
OUTPUT "Outside: " &amp; MyNum</pre>
Explain why <code>MyNum</code> has not changed after the call.`
  },
  {
    title: 'Task 14 — BYREF Trace',
    difficulty: 'medium',
    body: `Now compare with BYREF. Trace this code and state the outputs:
<pre>PROCEDURE Halve(BYREF N : INTEGER)
    N ← N DIV 2
    OUTPUT "Inside: " &amp; N
ENDPROCEDURE

MyNum ← 20
CALL Halve(MyNum)
OUTPUT "Outside: " &amp; MyNum</pre>
Explain the difference from the BYVAL version in Task 13.`
  },

  // ── HARD (15-20) ──
  {
    title: 'Task 15 — Multi-Function Program',
    difficulty: 'hard',
    body: `Write three functions:
<ol>
  <li><code>GetArea(Length, Width)</code> — returns <code>Length * Width</code></li>
  <li><code>GetPerimeter(Length, Width)</code> — returns <code>2 * (Length + Width)</code></li>
  <li><code>DescribeRectangle(Length, Width)</code> — a <b>procedure</b> that calls both functions above and outputs the results in a formatted message.</li>
</ol>
Write a main program that asks the user for length and width, then calls <code>DescribeRectangle</code>.`
  },
  {
    title: 'Task 16 — Validation Function',
    difficulty: 'hard',
    body: `Write a function <code>ValidateAge(Age : INTEGER) RETURNS BOOLEAN</code> that returns <code>TRUE</code> if Age is between 0 and 150 (inclusive), and <code>FALSE</code> otherwise.<br><br>
Then write a procedure <code>GetValidAge()</code> that repeatedly asks the user for their age until <code>ValidateAge</code> returns <code>TRUE</code>. The valid age should be output at the end.`
  },
  {
    title: 'Task 17 — Swap Procedure (BYREF)',
    difficulty: 'hard',
    body: `Write a procedure <code>Swap(BYREF A : INTEGER, BYREF B : INTEGER)</code> that swaps the values of <code>A</code> and <code>B</code> using a temporary variable.<br><br>
Demonstrate it works by tracing:
<pre>X ← 5
Y ← 9
CALL Swap(X, Y)
OUTPUT X   // Should output 9
OUTPUT Y   // Should output 5</pre>
Explain why BYREF is essential here — what would happen with BYVAL?`
  },
  {
    title: 'Task 18 — Recursive Function',
    difficulty: 'hard',
    body: `Study this function:
<pre>FUNCTION Factorial(N : INTEGER) RETURNS INTEGER
    IF N <= 1 THEN
        RETURN 1
    ELSE
        RETURN N * Factorial(N - 1)
    ENDIF
ENDFUNCTION</pre>
<ol>
  <li>What is <code>Factorial(5)</code>? Show all recursive calls.</li>
  <li>What is the <b>base case</b> and why is it needed?</li>
  <li>What would happen if there were no base case?</li>
</ol>`
  },
  {
    title: 'Task 19 — String Processing Function',
    difficulty: 'hard',
    body: `Write a function <code>CountChar(Text : STRING, Target : CHAR) RETURNS INTEGER</code> that counts how many times <code>Target</code> appears in <code>Text</code>.<br><br>
Trace through <code>CountChar("banana", "a")</code> and show the count after each character is checked.<br><br>
Then write a main program that uses <code>CountChar</code> to count vowels in a user-input sentence (call the function five times — once for each vowel).`
  },
  {
    title: 'Task 20 — Array Parameter',
    difficulty: 'hard',
    body: `Write a function <code>FindMax(Numbers : ARRAY OF INTEGER, Size : INTEGER) RETURNS INTEGER</code> that returns the largest value in the array.<br><br>
Then write a procedure <code>DisplayStats(Numbers, Size)</code> that calls <code>FindMax</code> (and a similar <code>FindMin</code> function you write) to output the maximum, minimum, and range of the array.`
  },

  // ── CHALLENGE (21-24) ──
  {
    title: 'Task 21 — Bubble Sort Procedure',
    difficulty: 'challenge',
    body: `Write a procedure <code>BubbleSort(BYREF Arr : ARRAY OF INTEGER, Size : INTEGER)</code> that sorts the array in ascending order.<br><br>
<ol>
  <li>Why must the array be passed BYREF?</li>
  <li>Write a separate <code>Swap</code> procedure and call it from inside <code>BubbleSort</code>.</li>
  <li>Trace through sorting <code>[4, 2, 7, 1, 3]</code> showing the array after each pass.</li>
</ol>`
  },
  {
    title: 'Task 22 — Modular Password Checker',
    difficulty: 'challenge',
    body: `Design a modular password validation system using multiple functions:
<ol>
  <li><code>HasMinLength(Password, MinLen) RETURNS BOOLEAN</code></li>
  <li><code>HasUpperCase(Password) RETURNS BOOLEAN</code></li>
  <li><code>HasDigit(Password) RETURNS BOOLEAN</code></li>
  <li><code>CheckPassword(Password) RETURNS STRING</code> — calls all three functions above and returns <code>"Strong"</code>, <code>"Medium"</code>, or <code>"Weak"</code> depending on how many checks pass (3 = Strong, 2 = Medium, 0-1 = Weak).</li>
</ol>
Write the full pseudocode and trace through <code>CheckPassword("Hello1")</code>.`
  },
  {
    title: 'Task 23 — Menu-Driven Calculator',
    difficulty: 'challenge',
    body: `Create a menu-driven calculator program that uses <b>separate functions</b> for each operation:
<ol>
  <li><code>Add(A, B)</code>, <code>Subtract(A, B)</code>, <code>Multiply(A, B)</code>, <code>Divide(A, B)</code></li>
  <li>A <code>GetChoice()</code> function that displays a menu and returns the user's choice</li>
  <li>A <code>GetNumber(Prompt)</code> function that asks the user for a number with a custom prompt</li>
  <li>A main loop that calls the appropriate function based on the menu choice, with input validation</li>
</ol>
<code>Divide</code> must handle division by zero by returning an error message.`
  },
  {
    title: 'Task 24 — Exam-Style Question',
    difficulty: 'challenge',
    body: `<b>Exam-style:</b> A school stores student marks in an array. Write the following in pseudocode:
<ol>
  <li>A function <code>CalculateMean(Marks, Count) RETURNS REAL</code></li>
  <li>A function <code>CountAbove(Marks, Count, Threshold) RETURNS INTEGER</code> that counts how many marks are above a given threshold</li>
  <li>A procedure <code>PrintReport(Marks, Count)</code> that uses the two functions above to:
    <ul>
      <li>Output the mean mark</li>
      <li>Output the number of students scoring above the mean</li>
      <li>Output the number of students scoring above 75</li>
    </ul>
  </li>
</ol>
Explain why breaking this into multiple functions is better than writing one long procedure. [4 marks]`
  }
];

let currentTask = 0;
const taskCard      = document.getElementById('taskCard');
const taskCounter   = document.getElementById('taskCounter');
const prevTaskBtn   = document.getElementById('prevTaskBtn');
const nextTaskBtn   = document.getElementById('nextTaskBtn');
const taskProgressFill = document.getElementById('taskProgressFill');
const taskDots      = document.getElementById('taskDots');

function renderTaskDots() {
  taskDots.innerHTML = '';
  tasks.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'task-dot' + (i === currentTask ? ' current' : '');
    dot.textContent = i + 1;
    dot.addEventListener('click', () => { currentTask = i; renderTask(); });
    taskDots.appendChild(dot);
  });
}

function renderTask() {
  const t = tasks[currentTask];
  const badgeClass = {easy:'badge-easy',medium:'badge-medium',hard:'badge-hard',challenge:'badge-challenge'}[t.difficulty];
  taskCard.innerHTML = `<h3>${t.title} <span class="badge ${badgeClass}">${t.difficulty}</span></h3>${t.body}`;
  taskCounter.textContent = `Task ${currentTask + 1} / ${tasks.length}`;
  prevTaskBtn.disabled = currentTask === 0;
  nextTaskBtn.disabled = currentTask === tasks.length - 1;
  taskProgressFill.style.width = ((currentTask + 1) / tasks.length * 100) + '%';
  renderTaskDots();
}

prevTaskBtn.addEventListener('click', () => { if (currentTask > 0) { currentTask--; renderTask(); } });
nextTaskBtn.addEventListener('click', () => { if (currentTask < tasks.length - 1) { currentTask++; renderTask(); } });

renderTask();
