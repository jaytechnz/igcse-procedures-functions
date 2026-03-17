/* ═══════════════════════════════════════════════════════
   IGCSE 0478 — Functions & Parameters — app.js
   ═══════════════════════════════════════════════════════ */

// ─── VIEW SWITCHING ───
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-' + btn.dataset.view).classList.add('active');
  });
});


/* ═══════════════════════════════════════════════════════
   SECTION 1 — INTERACTIVE DEMO
   ═══════════════════════════════════════════════════════ */

const scenarios = [
  /* ── 0: No parameters ── */
  {
    pseudo:
`<span class="kw">PROCEDURE</span> <span class="fn">SayHello</span>()
    <span class="kw">OUTPUT</span> <span class="str">"Hello, World!"</span>
<span class="kw">ENDPROCEDURE</span>

<span class="cmt">// Call it:</span>
<span class="kw">CALL</span> <span class="fn">SayHello</span>()`,
    java:
`<span class="j-kw">public static void</span> <span class="j-fn">sayHello</span>() {
    System.out.println(<span class="j-str">"Hello, World!"</span>);
}

<span class="j-cmt">// Call it:</span>
<span class="j-fn">sayHello</span>();`,
    explain: `A <b>procedure</b> (CIE) or <b>void method</b> (Java) is a named block of code you can reuse. This one has <b>no parameters</b> — the parentheses <code>()</code> are empty. Every call does exactly the same thing.`,
    fnTitle: 'PROCEDURE SayHello()',
    fnBody: 'OUTPUT "Hello, World!"',
    args: [],
    params: [],
    correctMap: {},
    returnMode: false,
    returnOptions: [],
    returnCorrect: null,
    instrDone: 'No data to pass — this procedure needs no input!',
    arrowWord: 'no params',
  },

  /* ── 1: One parameter ── */
  {
    pseudo:
`<span class="kw">PROCEDURE</span> <span class="fn">Greet</span>(<span class="param">Name</span> : <span class="tp">STRING</span>)
    <span class="kw">OUTPUT</span> <span class="str">"Hello, "</span> &amp; <span class="param">Name</span>
<span class="kw">ENDPROCEDURE</span>

<span class="cmt">// Call it:</span>
<span class="kw">CALL</span> <span class="fn">Greet</span>(<span class="hl">"Alice"</span>)`,
    java:
`<span class="j-kw">public static void</span> <span class="j-fn">greet</span>(<span class="j-tp">String</span> <span class="j-param">name</span>) {
    System.out.println(<span class="j-str">"Hello, "</span> + <span class="j-param">name</span>);
}

<span class="j-cmt">// Call it:</span>
<span class="j-fn">greet</span>(<span class="j-str">"Alice"</span>);`,
    explain: `<code>Greet</code> has one <b>parameter</b> called <code>Name</code> — a placeholder waiting for data. When we write <code>Greet("Alice")</code>, the value <code>"Alice"</code> is the <b>argument</b>. It gets copied into <code>Name</code> so the procedure can use it.<br><br><b>Parameter</b> = the label in the definition.&ensp;<b>Argument</b> = the actual value you send.`,
    fnTitle: 'PROCEDURE Greet(Name : STRING)',
    fnBody: 'OUTPUT "Hello, " & Name',
    args: [{ label: '"Alice"', value: '"Alice"' }],
    params: ['Name'],
    correctMap: { Name: '"Alice"' },
    returnMode: false,
    returnOptions: [],
    returnCorrect: null,
    instrDone: null,
    arrowWord: 'pass',
  },

  /* ── 2: Two parameters ── */
  {
    pseudo:
`<span class="kw">PROCEDURE</span> <span class="fn">Add</span>(<span class="param">X</span> : <span class="tp">INTEGER</span>, <span class="param">Y</span> : <span class="tp">INTEGER</span>)
    <span class="kw">OUTPUT</span> <span class="param">X</span> + <span class="param">Y</span>
<span class="kw">ENDPROCEDURE</span>

<span class="cmt">// Call it:</span>
<span class="kw">CALL</span> <span class="fn">Add</span>(<span class="hl">5</span>, <span class="hl">3</span>)
<span class="cmt">// Outputs: 8</span>`,
    java:
`<span class="j-kw">public static void</span> <span class="j-fn">add</span>(<span class="j-tp">int</span> <span class="j-param">x</span>, <span class="j-tp">int</span> <span class="j-param">y</span>) {
    System.out.println(<span class="j-param">x</span> + <span class="j-param">y</span>);
}

<span class="j-cmt">// Call it:</span>
<span class="j-fn">add</span>(<span class="j-num">5</span>, <span class="j-num">3</span>);
<span class="j-cmt">// Outputs: 8</span>`,
    explain: `When there are <b>multiple parameters</b>, arguments are matched <b>by position</b> — left to right. The first argument <code>5</code> fills the first parameter <code>X</code>; the second argument <code>3</code> fills <code>Y</code>.<br><br>Swapping them would give a different result for subtraction or division!`,
    fnTitle: 'PROCEDURE Add(X : INTEGER, Y : INTEGER)',
    fnBody: 'OUTPUT X + Y',
    args: [
      { label: '5', value: '5' },
      { label: '3', value: '3' },
    ],
    params: ['X', 'Y'],
    correctMap: { X: '5', Y: '3' },
    returnMode: false,
    returnOptions: [],
    returnCorrect: null,
    instrDone: null,
    arrowWord: 'pass',
  },

  /* ── 3: Return value ── */
  {
    pseudo:
`<span class="kw">FUNCTION</span> <span class="fn">Square</span>(<span class="param">Num</span> : <span class="tp">INTEGER</span>) <span class="kw">RETURNS</span> <span class="tp">INTEGER</span>
    <span class="ret">RETURN</span> <span class="param">Num</span> * <span class="param">Num</span>
<span class="kw">ENDFUNCTION</span>

<span class="cmt">// Use it:</span>
Result &#8592; <span class="fn">Square</span>(<span class="hl">4</span>)
<span class="cmt">// Result = 16</span>`,
    java:
`<span class="j-kw">public static</span> <span class="j-tp">int</span> <span class="j-fn">square</span>(<span class="j-tp">int</span> <span class="j-param">num</span>) {
    <span class="j-ret">return</span> <span class="j-param">num</span> * <span class="j-param">num</span>;
}

<span class="j-cmt">// Use it:</span>
<span class="j-tp">int</span> result = <span class="j-fn">square</span>(<span class="j-num">4</span>);
<span class="j-cmt">// result = 16</span>`,
    explain: `A <b>function</b> (CIE) or a method with a <b>return type</b> (Java) sends a value back to the caller. <code>Square(4)</code> passes <code>4</code> into <code>Num</code>, computes <code>4 × 4 = 16</code>, and <b>returns 16</b>. The caller can store it in a variable.<br><br><b>Step 1:</b> Drag <code>4</code> → <code>Num</code>.&ensp;<b>Step 2:</b> Drag <code>16</code> → Return slot.`,
    fnTitle: 'FUNCTION Square(Num) RETURNS INTEGER',
    fnBody: 'RETURN Num * Num',
    args: [{ label: '4', value: '4' }],
    params: ['Num'],
    correctMap: { Num: '4' },
    returnMode: true,
    returnOptions: [
      { label: '8', value: '8' },
      { label: '16', value: '16' },
      { label: '4', value: '4r' },
    ],
    returnCorrect: '16',
    instrDone: null,
    arrowWord: 'pass',
  },

  /* ── 4: ByVal vs ByRef ── */
  {
    pseudo:
`<span class="cmt">// BY REFERENCE — original variable IS changed</span>
<span class="kw">PROCEDURE</span> <span class="fn">DoubleIt</span>(<span class="kw">BYREF</span> <span class="param">N</span> : <span class="tp">INTEGER</span>)
    <span class="param">N</span> &#8592; <span class="param">N</span> * 2
<span class="kw">ENDPROCEDURE</span>

MyNum &#8592; <span class="num">7</span>
<span class="kw">CALL</span> <span class="fn">DoubleIt</span>(<span class="hl">MyNum</span>)
<span class="cmt">// MyNum is now 14  (changed!)</span>

<span class="cmt">// Compare: BY VALUE — original is NOT changed</span>
<span class="cmt">// PROCEDURE DoubleIt(BYVAL N : INTEGER)</span>
<span class="cmt">//   would leave MyNum still at 7</span>`,
    java:
`<span class="j-cmt">// Java primitives are always passed by value,</span>
<span class="j-cmt">// so you can't directly replicate BYREF with int.</span>
<span class="j-cmt">// But arrays/objects ARE passed by reference:</span>

<span class="j-kw">public static void</span> <span class="j-fn">doubleIt</span>(<span class="j-tp">int</span>[] <span class="j-param">arr</span>) {
    <span class="j-param">arr</span>[<span class="j-num">0</span>] = <span class="j-param">arr</span>[<span class="j-num">0</span>] * <span class="j-num">2</span>;
}

<span class="j-tp">int</span>[] myNum = {<span class="j-num">7</span>};
<span class="j-fn">doubleIt</span>(myNum);
<span class="j-cmt">// myNum[0] is now 14</span>`,
    explain: `<b>BYVAL</b> (by value) — the procedure gets a <b>copy</b>. Changes inside do <b>NOT</b> affect the original.<br><b>BYREF</b> (by reference) — the procedure gets a <b>link to the original</b>. Changes inside <b>DO</b> affect it.<br><br>Here <code>MyNum</code> starts at 7 and is passed BYREF, so the procedure doubles the original to <b>14</b>.<br><br>In Java, primitives (<code>int</code>) are always by value, but arrays/objects are effectively by reference.`,
    fnTitle: 'PROCEDURE DoubleIt(BYREF N : INTEGER)',
    fnBody: 'N ← N * 2',
    args: [{ label: 'MyNum = 7', value: 'MyNum=7' }],
    params: ['N'],
    correctMap: { N: 'MyNum=7' },
    returnMode: true,
    returnOptions: [
      { label: '7  (unchanged)', value: '7' },
      { label: '14  (doubled!)', value: '14' },
    ],
    returnCorrect: '14',
    instrDone: null,
    arrowWord: 'pass BYREF',
  },
];

// DOM refs
const codePseudo     = document.getElementById('codePseudo');
const codeJava       = document.getElementById('codeJava');
const explainCard    = document.getElementById('explainCard');
const instrStep      = document.getElementById('instrStep');
const instrText      = document.getElementById('instrText');
const callerTray     = document.getElementById('callerTray');
const fnMachineTitle = document.getElementById('fnMachineTitle');
const fnMachineSlots = document.getElementById('fnMachineSlots');
const fnMachineBody  = document.getElementById('fnMachineBody');
const returnArrow    = document.getElementById('returnArrow');
const returnArea     = document.getElementById('returnArea');
const returnDrop     = document.getElementById('returnDrop');
const returnOptions  = document.getElementById('returnOptions');
const feedbackToast  = document.getElementById('feedbackToast');
const arrowWordEl    = document.getElementById('arrowWord');
const resetBtn       = document.getElementById('resetBtn');

let activeScenario = null;
let filled = {};
let returnFilled = false;

function loadScenario(idx) {
  const s = scenarios[idx];
  activeScenario = s;
  filled = {};
  returnFilled = false;

  // Code panes
  codePseudo.innerHTML = s.pseudo;
  codeJava.innerHTML   = s.java;
  explainCard.innerHTML = s.explain;

  // Machine title & body
  fnMachineTitle.textContent = s.fnTitle;
  fnMachineBody.textContent  = s.fnBody;

  // Arrow word
  arrowWordEl.textContent = s.arrowWord;

  // Clear feedback
  feedbackToast.textContent = '';
  feedbackToast.className = 'feedback-toast';

  // ── Caller chips ──
  callerTray.innerHTML = '';
  callerTray.classList.remove('empty-ok');
  s.args.forEach(a => {
    callerTray.appendChild(makeChip(a.label, a.value, false));
  });

  // ── Param slots ──
  fnMachineSlots.innerHTML = '';
  fnMachineSlots.classList.toggle('empty-msg', s.params.length === 0);
  s.params.forEach(p => {
    const slot = document.createElement('div');
    slot.className = 'param-slot';
    slot.dataset.param = p;
    slot.innerHTML = `<span class="slot-name">${p} = ?</span>`;
    slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('drag-over'); });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
    slot.addEventListener('drop', e => dropOnSlot(e, slot));
    fnMachineSlots.appendChild(slot);
  });

  // ── Return area ──
  if (s.returnMode) {
    returnArrow.classList.remove('hidden');
    returnArea.classList.remove('hidden');
    returnDrop.className = 'return-drop';
    returnDrop.innerHTML = '<span class="drop-ph">drop result here</span>';
    returnOptions.innerHTML = '';
    s.returnOptions.forEach(o => {
      returnOptions.appendChild(makeChip(o.label, o.value, true));
    });
    // Drop handlers on return slot
    returnDrop.addEventListener('dragover', e => { e.preventDefault(); returnDrop.classList.add('drag-over'); });
    returnDrop.addEventListener('dragleave', () => returnDrop.classList.remove('drag-over'));
    returnDrop.addEventListener('drop', dropOnReturn);
  } else {
    returnArrow.classList.add('hidden');
    returnArea.classList.add('hidden');
  }

  // ── Instructions ──
  updateInstructions();
}

function makeChip(label, value, isReturn) {
  const chip = document.createElement('div');
  chip.className = 'arg-chip' + (isReturn ? ' return-chip' : '');
  chip.textContent = label;
  chip.draggable = true;
  chip.dataset.value = value;
  chip.dataset.isReturn = isReturn ? '1' : '0';
  chip.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', value);
    e.dataTransfer.setData('isReturn', chip.dataset.isReturn);
    chip.classList.add('dragging');
  });
  chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
  return chip;
}

function dropOnSlot(e, slot) {
  e.preventDefault();
  slot.classList.remove('drag-over');

  const value = e.dataTransfer.getData('text/plain');
  const isReturn = e.dataTransfer.getData('isReturn') === '1';
  const paramName = slot.dataset.param;
  const expected = activeScenario.correctMap[paramName];

  if (isReturn) {
    toast('That chip is a return value — drag it to the Return slot below.', 'err');
    return;
  }
  if (slot.classList.contains('filled')) return;

  if (value === expected) {
    slot.innerHTML = `${paramName} = ${chipLabelByValue(value)}`;
    slot.classList.add('filled');
    filled[paramName] = value;
    removeCallerChip(value);
    toast('', '');
    checkComplete();
  } else {
    slot.classList.add('wrong');
    toast(`Not quite — try the other value for ${paramName}.`, 'err');
    setTimeout(() => slot.classList.remove('wrong'), 600);
  }
}

function dropOnReturn(e) {
  e.preventDefault();
  returnDrop.classList.remove('drag-over');
  if (returnFilled) return;

  const value = e.dataTransfer.getData('text/plain');

  if (value === activeScenario.returnCorrect) {
    returnDrop.innerHTML = chipLabelByValue(value);
    returnDrop.classList.add('filled');
    returnFilled = true;
    removeReturnChip(value);
    toast('', '');
    checkComplete();
  } else {
    toast('That's not the correct return value — think about what the function computes.', 'err');
  }
}

function chipLabelByValue(val) {
  const all = [...activeScenario.args, ...activeScenario.returnOptions];
  const found = all.find(a => a.value === val);
  return found ? found.label : val;
}

function removeCallerChip(val) {
  const chip = callerTray.querySelector(`.arg-chip[data-value="${val}"]`);
  if (chip) chip.remove();
  if (callerTray.querySelectorAll('.arg-chip').length === 0) {
    callerTray.classList.add('empty-ok');
  }
}
function removeReturnChip(val) {
  const chip = returnOptions.querySelector(`.arg-chip[data-value="${val}"]`);
  if (chip) chip.remove();
}

function updateInstructions() {
  const s = activeScenario;
  const paramsDone = s.params.every(p => filled[p] === s.correctMap[p]);
  const retDone = !s.returnMode || returnFilled;

  if (s.params.length === 0 && !s.returnMode) {
    instrStep.textContent = 'Observe';
    instrText.textContent = s.instrDone || 'This procedure has no parameters — nothing to pass!';
    return;
  }

  if (!paramsDone) {
    instrStep.textContent = s.returnMode ? 'Step 1 of 2' : 'Your turn';
    instrText.textContent = 'Drag each orange argument chip into its matching parameter slot in the function box.';
  } else if (s.returnMode && !retDone) {
    instrStep.textContent = 'Step 2 of 2';
    instrText.textContent = 'Now drag the correct return value into the return slot.';
  }
}

function checkComplete() {
  const s = activeScenario;
  const paramsDone = s.params.every(p => filled[p] === s.correctMap[p]);
  const retDone = !s.returnMode || returnFilled;
  updateInstructions();

  if (paramsDone && retDone) {
    instrStep.textContent = 'Complete ✓';
    instrText.textContent = 'All data passed correctly! Read the explanation on the left, then try the next scenario.';
    toast('✓  All values passed successfully!', 'ok');
  }
}

function toast(msg, type) {
  feedbackToast.textContent = msg;
  feedbackToast.className = 'feedback-toast' + (type ? ' ' + type : '');
}

// Scenario pills
document.querySelectorAll('.scenario-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.scenario-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    loadScenario(+pill.dataset.idx);
  });
});

resetBtn.addEventListener('click', () => {
  const idx = +document.querySelector('.scenario-pill.active').dataset.idx;
  loadScenario(idx);
});

// Init
loadScenario(0);


/* ═══════════════════════════════════════════════════════
   SECTION 2 — DISCUSSION QUESTIONS
   ═══════════════════════════════════════════════════════ */

const questions = [
  {
    q: `What is the difference between a <b>procedure</b> and a <b>function</b>?`,
    a: `A <b>procedure</b> performs an action but <b>does not return a value</b>. A <b>function</b> performs an action and <b>returns a value</b> that can be stored in a variable or used in an expression. In Java, a procedure is a <code>void</code> method; a function has a return type like <code>int</code> or <code>String</code>.`
  },
  {
    q: `What is a <b>parameter</b>? How is it different from an <b>argument</b>?`,
    a: `A <b>parameter</b> is the variable listed in the function definition — it's a placeholder. An <b>argument</b> is the actual value you pass when calling the function. Think: parameters are <i>defined</i>, arguments are <i>supplied</i>.`
  },
  {
    q: `Why use parameters instead of just reading global variables inside a procedure?`,
    a: `Parameters make code <b>reusable</b> and <b>modular</b>. The procedure works with whatever values you pass, not just one specific variable. It's also easier to test and debug.`
  },
  {
    q: `<code>CalculateArea(5, 10)</code> calls <code>PROCEDURE CalculateArea(Length, Width)</code>. What value does <code>Width</code> hold?`,
    a: `<code>Width</code> holds <b>10</b>. Arguments are matched to parameters <b>by position</b>: first argument → first parameter, second argument → second parameter.`
  },
  {
    q: `What does <b>BYVAL</b> (by value) mean?`,
    a: `A <b>copy</b> of the argument is passed. Changes inside the procedure do <b>not</b> affect the original variable. Use BYVAL when you only need to read the value.`
  },
  {
    q: `What does <b>BYREF</b> (by reference) mean? When is it useful?`,
    a: `The procedure receives a <b>reference to the original variable</b>. Changes inside <b>do</b> affect it. Useful when the procedure must update the caller's data — e.g., a <code>Swap</code> procedure.`
  },
  {
    q: `What does <code>Result ← Triple(Triple(2))</code> evaluate to if <code>Triple</code> returns <code>N * 3</code>?`,
    a: `<code>Triple(2) = 6</code>, then <code>Triple(6) = 18</code>. So <code>Result = 18</code>. A function's return value can be used as an argument to another call.`
  },
  {
    q: `What happens if you call a procedure with the <b>wrong number</b> of arguments?`,
    a: `You get an <b>error</b>. The number of arguments must match the number of parameters exactly.`
  },
  {
    q: `What is a <b>local variable</b> and how does it relate to parameters?`,
    a: `A local variable exists only inside the procedure. Parameters behave like local variables — created on entry, destroyed on exit. They don't clash with variables of the same name elsewhere.`
  },
  {
    q: `Why should parameter names be <b>meaningful</b>?`,
    a: `Meaningful names make code self-documenting. <code>CalculateArea(Length, Width)</code> is instantly clear; <code>CalculateArea(A, B)</code> is not.`
  },
  {
    q: `Can a function call another function? Give an example.`,
    a: `Yes. For example, <code>FinalBill</code> could call <code>AddTax</code> inside its own return statement:<pre>FUNCTION FinalBill(Price, Qty) RETURNS REAL\n    RETURN AddTax(Price * Qty)\nENDFUNCTION</pre>`
  },
  {
    q: `What return type does this function have?<pre>FUNCTION IsEven(N : INTEGER) RETURNS ???\n    RETURN (N MOD 2 = 0)\nENDFUNCTION</pre>`,
    a: `It returns a <b>BOOLEAN</b>. The expression <code>N MOD 2 = 0</code> evaluates to <code>TRUE</code> or <code>FALSE</code>.`
  },
];

let shuffled = [];
let qIdx = -1;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const showQBtn   = document.getElementById('showQuestionBtn');
const revealBtn  = document.getElementById('revealAnswerBtn');
const qCard      = document.getElementById('questionCard');
const qNumber    = document.getElementById('qNumber');
const qText      = document.getElementById('qText');
const answerCard = document.getElementById('answerCard');
const qCounter   = document.getElementById('qCounter');

showQBtn.addEventListener('click', () => {
  if (!shuffled.length || qIdx >= shuffled.length - 1) {
    shuffled = shuffle(questions);
    qIdx = -1;
  }
  qIdx++;
  const q = shuffled[qIdx];
  qNumber.textContent = qIdx + 1;
  qText.innerHTML = q.q;
  answerCard.classList.add('hidden');
  answerCard.innerHTML = '';
  revealBtn.disabled = false;
  qCounter.textContent = `${qIdx + 1} / ${shuffled.length}`;
});

revealBtn.addEventListener('click', () => {
  answerCard.innerHTML = '<strong>Guidance: </strong>' + shuffled[qIdx].a;
  answerCard.classList.remove('hidden');
  revealBtn.disabled = true;
});


/* ═══════════════════════════════════════════════════════
   SECTION 3 — STUDENT TASKS  (easy → complex)
   ═══════════════════════════════════════════════════════ */

const tasks = [
  // ── EASY 1-6 ──
  {
    title: 'Identify the Parts', d: 'easy',
    body: `Look at this pseudocode:
<pre>PROCEDURE Greet(Name : STRING)
    OUTPUT "Hello, " &amp; Name
ENDPROCEDURE

CALL Greet("Anika")</pre>
Write down: <b>(a)</b> the procedure name, <b>(b)</b> the parameter, <b>(c)</b> the argument.`
  },
  {
    title: 'Trace the Output', d: 'easy',
    body: `What is the output of this code?
<pre>PROCEDURE ShowDouble(X : INTEGER)
    OUTPUT X * 2
ENDPROCEDURE

CALL ShowDouble(7)</pre>`
  },
  {
    title: 'Fill in the Blank', d: 'easy',
    body: `Complete the gaps so the procedure prints 5 stars:
<pre>PROCEDURE PrintStars(______ : INTEGER)
    FOR I ← 1 TO Count
        OUTPUT "*"
    NEXT I
ENDPROCEDURE

CALL PrintStars(______)</pre>`
  },
  {
    title: 'Spot the Error', d: 'easy',
    body: `Find the error and explain how to fix it:
<pre>PROCEDURE SayAge(Age : INTEGER)
    OUTPUT "You are " &amp; Age &amp; " years old"
ENDPROCEDURE

CALL SayAge("fifteen")</pre>`
  },
  {
    title: 'Write a Procedure Call', d: 'easy',
    body: `Given:
<pre>PROCEDURE DisplayMessage(Msg : STRING, Times : INTEGER)
    FOR I ← 1 TO Times
        OUTPUT Msg
    NEXT I
ENDPROCEDURE</pre>
Write a call statement that displays <code>"Well done!"</code> three times.`
  },
  {
    title: 'Procedure vs Function', d: 'easy',
    body: `In your own words, explain the difference between a procedure and a function. Write one example of each in <b>CIE pseudocode</b> and in <b>Java</b>.`
  },

  // ── MEDIUM 7-14 ──
  {
    title: 'Write a Simple Procedure', d: 'medium',
    body: `Write a procedure <code>PrintBorder(Length : INTEGER)</code> that outputs a line of <code>Length</code> dashes.<br><br>Write two calls: one for length 10, one for length 25.<br><br>Then rewrite it in <b>Java</b>.`
  },
  {
    title: 'Write a Simple Function', d: 'medium',
    body: `Write a function <code>AddVAT(Price : REAL) RETURNS REAL</code> that returns the price with 15% VAT added.<br><br>What does <code>Total ← AddVAT(200.00)</code> store in <code>Total</code>?<br><br>Write the Java equivalent.`
  },
  {
    title: 'Two-Parameter Function', d: 'medium',
    body: `Write <code>Power(Base, Exponent)</code> that returns <code>Base</code> raised to <code>Exponent</code> using a loop.<br><br>Trace <code>Power(3, 4)</code> showing <code>Result</code> after each iteration. Write both CIE pseudocode and Java versions.`
  },
  {
    title: 'Trace Table', d: 'medium',
    body: `Complete a trace table for:
<pre>FUNCTION SumRange(Start, Finish) RETURNS INTEGER
    Total ← 0
    FOR I ← Start TO Finish
        Total ← Total + I
    NEXT I
    RETURN Total
ENDFUNCTION

Result ← SumRange(3, 6)</pre>
Show I and Total at each step. What is the final Result?`
  },
  {
    title: 'Parameter Order Matters', d: 'medium',
    body: `<pre>PROCEDURE Subtract(A : INTEGER, B : INTEGER)
    OUTPUT A - B
ENDPROCEDURE

CALL Subtract(10, 4)
CALL Subtract(4, 10)</pre>
<b>(a)</b> What is the output of each call?<br><b>(b)</b> Explain why argument order matters.`
  },
  {
    title: 'Local vs Global', d: 'medium',
    body: `Predict the output and explain:
<pre>X ← 100

PROCEDURE ChangeX(X : INTEGER)
    X ← X + 50
    OUTPUT X
ENDPROCEDURE

CALL ChangeX(10)
OUTPUT X</pre>
Is the <code>X</code> inside the procedure the same as the global <code>X</code>?`
  },
  {
    title: 'BYVAL Trace', d: 'medium',
    body: `Trace this and state all outputs:
<pre>PROCEDURE Halve(BYVAL N : INTEGER)
    N ← N DIV 2
    OUTPUT "Inside: " &amp; N
ENDPROCEDURE

MyNum ← 20
CALL Halve(MyNum)
OUTPUT "Outside: " &amp; MyNum</pre>
Why is <code>MyNum</code> unchanged after the call?`
  },
  {
    title: 'BYREF Trace', d: 'medium',
    body: `Now trace the BYREF version:
<pre>PROCEDURE Halve(BYREF N : INTEGER)
    N ← N DIV 2
    OUTPUT "Inside: " &amp; N
ENDPROCEDURE

MyNum ← 20
CALL Halve(MyNum)
OUTPUT "Outside: " &amp; MyNum</pre>
What changed compared to the BYVAL version in the previous task?`
  },

  // ── HARD 15-20 ──
  {
    title: 'Multi-Function Program', d: 'hard',
    body: `Write in both CIE pseudocode and Java:
<ol>
  <li><code>GetArea(Length, Width)</code> → returns area</li>
  <li><code>GetPerimeter(Length, Width)</code> → returns perimeter</li>
  <li><code>DescribeRectangle(Length, Width)</code> — a procedure that calls both functions and outputs the results</li>
</ol>
Write a main program that reads length and width from the user, then calls <code>DescribeRectangle</code>.`
  },
  {
    title: 'Validation Function', d: 'hard',
    body: `Write <code>ValidateAge(Age) RETURNS BOOLEAN</code> — returns TRUE if Age is 0–150.<br><br>Then write <code>GetValidAge()</code> that loops until a valid age is entered, using <code>ValidateAge</code>. Provide both CIE and Java versions.`
  },
  {
    title: 'Swap Procedure (BYREF)', d: 'hard',
    body: `Write <code>Swap(BYREF A, BYREF B)</code> using a temporary variable. Trace it with <code>X=5, Y=9</code>.<br><br>Explain why BYREF is essential. What would happen with BYVAL?<br><br>In Java, show how you would swap two elements in an array instead (since Java primitives are by value).`
  },
  {
    title: 'Recursive Function', d: 'hard',
    body: `Study this:
<pre>FUNCTION Factorial(N : INTEGER) RETURNS INTEGER
    IF N &lt;= 1 THEN
        RETURN 1
    ELSE
        RETURN N * Factorial(N - 1)
    ENDIF
ENDFUNCTION</pre>
<b>(a)</b> Trace <code>Factorial(5)</code> showing every recursive call.<br><b>(b)</b> What is the base case and why is it needed?<br><b>(c)</b> What happens without a base case?<br><b>(d)</b> Write the Java equivalent.`
  },
  {
    title: 'String Processing Function', d: 'hard',
    body: `Write <code>CountChar(Text : STRING, Target : CHAR) RETURNS INTEGER</code>.<br><br>Trace <code>CountChar("banana", "a")</code>.<br><br>Then write a main program that counts all vowels in a user sentence by calling <code>CountChar</code> five times. Provide both CIE and Java versions.`
  },
  {
    title: 'Array Parameter', d: 'hard',
    body: `Write <code>FindMax(Numbers(), Size) RETURNS INTEGER</code> and <code>FindMin(Numbers(), Size) RETURNS INTEGER</code>.<br><br>Write a procedure <code>DisplayStats(Numbers(), Size)</code> that calls both to output the max, min, and range. Write in both CIE pseudocode and Java.`
  },

  // ── CHALLENGE 21-24 ──
  {
    title: 'Bubble Sort Procedure', d: 'challenge',
    body: `Write <code>BubbleSort(BYREF Arr(), Size)</code> in CIE pseudocode and Java.<ol>
  <li>Why must the array be passed BYREF?</li>
  <li>Use a separate <code>Swap</code> procedure inside your sort.</li>
  <li>Trace sorting <code>[4, 2, 7, 1, 3]</code> — show the array after each pass.</li>
</ol>`
  },
  {
    title: 'Modular Password Checker', d: 'challenge',
    body: `Build a modular password system with these functions:
<ol>
  <li><code>HasMinLength(Password, MinLen) → BOOLEAN</code></li>
  <li><code>HasUpperCase(Password) → BOOLEAN</code></li>
  <li><code>HasDigit(Password) → BOOLEAN</code></li>
  <li><code>CheckPassword(Password) → STRING</code> — calls all three; returns "Strong" (3 pass), "Medium" (2), or "Weak" (0–1).</li>
</ol>
Write full pseudocode AND Java. Trace <code>CheckPassword("Hello1")</code>.`
  },
  {
    title: 'Menu-Driven Calculator', d: 'challenge',
    body: `Create a calculator program using separate functions for each operation (<code>Add</code>, <code>Subtract</code>, <code>Multiply</code>, <code>Divide</code>), plus:
<ol>
  <li><code>GetChoice()</code> — displays a menu, returns the user's choice</li>
  <li><code>GetNumber(Prompt)</code> — asks for a number with a custom prompt</li>
  <li>A main loop with input validation</li>
</ol>
<code>Divide</code> must handle division by zero. Write in both CIE pseudocode and Java.`
  },
  {
    title: 'Exam-Style Question', d: 'challenge',
    body: `<b>[Exam-style — 12 marks]</b><br>A school stores student marks in an array. Write:
<ol>
  <li><code>CalculateMean(Marks(), Count) RETURNS REAL</code> [3]</li>
  <li><code>CountAbove(Marks(), Count, Threshold) RETURNS INTEGER</code> [3]</li>
  <li><code>PrintReport(Marks(), Count)</code> — uses both functions to output: the mean, how many scored above the mean, and how many scored above 75 [4]</li>
</ol>
Explain why breaking this into separate functions is better than one long procedure. [2]<br><br>Write your answer in <b>CIE pseudocode</b>, then translate to <b>Java</b>.`
  },
];

let currentTask = 0;
const taskCard      = document.getElementById('taskCard');
const taskCounter   = document.getElementById('taskCounter');
const prevTaskBtn   = document.getElementById('prevTaskBtn');
const nextTaskBtn   = document.getElementById('nextTaskBtn');
const taskProgressFill = document.getElementById('taskProgressFill');
const taskSidebar   = document.getElementById('taskSidebar');

function buildSidebar() {
  taskSidebar.innerHTML = '';
  tasks.forEach((t, i) => {
    const btn = document.createElement('button');
    btn.className = 'task-sidebar-item' + (i === currentTask ? ' active' : '');
    const numCls = {easy:'side-num-easy',medium:'side-num-medium',hard:'side-num-hard',challenge:'side-num-challenge'}[t.d];
    btn.innerHTML = `<span class="side-num ${numCls}">${i+1}</span> ${t.title}`;
    btn.addEventListener('click', () => { currentTask = i; renderTask(); });
    taskSidebar.appendChild(btn);
  });
}

function renderTask() {
  const t = tasks[currentTask];
  const badgeCls = {easy:'badge-easy',medium:'badge-medium',hard:'badge-hard',challenge:'badge-challenge'}[t.d];
  taskCard.innerHTML = `<h3>Task ${currentTask+1}: ${t.title} <span class="badge ${badgeCls}">${t.d}</span></h3>${t.body}`;
  taskCounter.textContent = `Task ${currentTask+1} / ${tasks.length}`;
  prevTaskBtn.disabled = currentTask === 0;
  nextTaskBtn.disabled = currentTask === tasks.length - 1;
  taskProgressFill.style.width = ((currentTask+1)/tasks.length*100)+'%';
  buildSidebar();
  // Scroll sidebar active item into view
  const active = taskSidebar.querySelector('.active');
  if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

prevTaskBtn.addEventListener('click', () => { if (currentTask > 0) { currentTask--; renderTask(); } });
nextTaskBtn.addEventListener('click', () => { if (currentTask < tasks.length - 1) { currentTask++; renderTask(); } });

renderTask();
