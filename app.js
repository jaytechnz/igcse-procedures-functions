/* ═══════════════════════════════════════════
   IGCSE 0478 — Functions & Parameters
   Full platform with auth, dashboard, editor
   ═══════════════════════════════════════════ */

// ═══ STORAGE HELPERS ═══
const LS = {
  get(k) { try { return JSON.parse(localStorage.getItem('fp_' + k)); } catch { return null; } },
  set(k, v) { localStorage.setItem('fp_' + k, JSON.stringify(v)); },
  remove(k) { localStorage.removeItem('fp_' + k); }
};

// ═══ AUTH ═══
let currentUser = null; // {email, role:'student'|'teacher'}

function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return 'h' + Math.abs(h).toString(36); }

// Login screen
const loginScreen = document.getElementById('loginScreen');
const setupScreen = document.getElementById('setupScreen');
const appShell = document.getElementById('appShell');
let loginRole = 'student';

document.querySelectorAll('.ltab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.ltab').forEach(b => b.classList.remove('active'));
    t.classList.add('active');
    loginRole = t.dataset.role;
    document.getElementById('loginPassGroup').classList.toggle('hidden', loginRole === 'student');
  });
});

document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  errEl.classList.add('hidden');

  if (!email || !email.includes('@')) { showErr(errEl, 'Please enter a valid email.'); return; }

  const config = LS.get('config');

  if (loginRole === 'teacher') {
    if (!config) { loginScreen.classList.add('hidden'); setupScreen.classList.remove('hidden'); document.getElementById('setupEmail').value = email; return; }
    if (email !== config.teacherEmail) { showErr(errEl, 'Email not recognised as a teacher account.'); return; }
    if (hashStr(pass) !== config.teacherPassHash) { showErr(errEl, 'Incorrect password.'); return; }
    currentUser = { email, role: 'teacher' };
    enterApp();
  } else {
    if (!config) { showErr(errEl, 'The teacher has not set up this platform yet.'); return; }
    if (!isWhitelisted(email, config)) { showErr(errEl, 'Your email is not on the whitelist. Ask your teacher to add it.'); return; }
    currentUser = { email, role: 'student' };
    enterApp();
  }
});

function isWhitelisted(email, config) {
  const domain = email.split('@')[1];
  if (config.domains && config.domains.some(d => domain === d.trim().toLowerCase())) return true;
  if (config.emails && config.emails.some(e => email === e.trim().toLowerCase())) return true;
  return false;
}

function showErr(el, msg) { el.textContent = msg; el.classList.remove('hidden'); }

// Setup
document.getElementById('setupBtn').addEventListener('click', () => {
  const email = document.getElementById('setupEmail').value.trim().toLowerCase();
  const p1 = document.getElementById('setupPass').value;
  const p2 = document.getElementById('setupPass2').value;
  const domains = document.getElementById('setupDomains').value;
  const emails = document.getElementById('setupEmails').value;
  const errEl = document.getElementById('setupError');
  errEl.classList.add('hidden');

  if (!email || !email.includes('@')) { showErr(errEl, 'Enter a valid teacher email.'); return; }
  if (p1.length < 4) { showErr(errEl, 'Password must be at least 4 characters.'); return; }
  if (p1 !== p2) { showErr(errEl, 'Passwords do not match.'); return; }
  if (!domains.trim() && !emails.trim()) { showErr(errEl, 'Add at least one domain or email to the whitelist.'); return; }

  const config = {
    teacherEmail: email,
    teacherPassHash: hashStr(p1),
    domains: domains.split(',').map(d => d.trim().toLowerCase()).filter(Boolean),
    emails: emails.split('\n').map(e => e.trim().toLowerCase()).filter(Boolean),
  };
  LS.set('config', config);
  currentUser = { email, role: 'teacher' };
  setupScreen.classList.add('hidden');
  enterApp();
});

function enterApp() {
  loginScreen.classList.add('hidden');
  setupScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  buildTabs();
  renderUserBadge();
  if (currentUser.role === 'teacher') { seedDemoStudents(); switchView('demo'); }
  else switchView('tasks');
}

// Seed 3 demo students so the teacher can see the dashboard immediately
function seedDemoStudents() {
  const demoStudents = [
    {
      email: 'alice.chen@school.edu',
      prog: {
        0:{status:'done',code:'PROCEDURE Greet\n  Name = "Anika"\n  Argument is "Anika"\n  Data type is STRING',time:Date.now()-86400000},
        1:{status:'done',code:'Output is 14\n\npublic static void showDouble(int x) {\n    System.out.println(x * 2);\n}\nshowDouble(7);',time:Date.now()-86400000},
        2:{status:'done',code:'PROCEDURE PrintStars(Count : INTEGER)\n    FOR I ← 1 TO Count\n        OUTPUT "*"\n    NEXT I\nENDPROCEDURE\n\nCALL PrintStars(5)',time:Date.now()-80000000},
        3:{status:'done',code:'The error is that "fifteen" is a STRING but Age expects an INTEGER.\nFix: CALL SayAge(15)',time:Date.now()-75000000},
        4:{status:'done',code:'CALL DisplayMessage("Well done!", 3)',time:Date.now()-70000000},
        5:{status:'done',code:'A procedure performs actions but does not return a value.\nA function returns a value.\n\nPROCEDURE SayHi()\n    OUTPUT "Hi"\nENDPROCEDURE\n\nFUNCTION Double(X : INTEGER) RETURNS INTEGER\n    RETURN X * 2\nENDFUNCTION',time:Date.now()-60000000},
        6:{status:'done',code:'PROCEDURE PrintBorder(Length : INTEGER)\n    FOR I ← 1 TO Length\n        OUTPUT "-"\n    NEXT I\nENDPROCEDURE\n\nCALL PrintBorder(10)\nCALL PrintBorder(25)',time:Date.now()-50000000},
        7:{status:'done',code:'FUNCTION AddVAT(Price : REAL) RETURNS REAL\n    RETURN Price * 1.15\nENDFUNCTION\n\nTotal ← AddVAT(200.00)\n// Total = 230.0',time:Date.now()-40000000},
        8:{status:'started',code:'FUNCTION Power(Base : INTEGER, Exponent : INTEGER) RETURNS INTEGER\n    Result ← 1\n    FOR I ← 1 TO Exponent\n        Result ← Result * Base\n    NEXT I\n    RETURN Result\nENDFUNCTION',time:Date.now()-30000000},
        9:{status:'started',code:'FUNCTION CalculateTotal(Price : REAL, Qty : INTEGER) RETURNS REAL\n    RETURN Price * Qty\nENDFUNCTION',time:Date.now()-20000000},
        10:{status:'started',code:'Subtract(10, 4) outputs 6\nSubtract(4, 10) outputs -6\nOrder matters because A gets the first argument',time:Date.now()-10000000},
      }
    },
    {
      email: 'bob.martinez@school.edu',
      prog: {
        0:{status:'done',code:'Procedure name: Greet\nParameter: Name\nArgument: "Anika"\nData type: STRING',time:Date.now()-90000000},
        1:{status:'done',code:'Output is 14',time:Date.now()-85000000},
        2:{status:'done',code:'Count and 5\n\nPROCEDURE PrintStars(Count : INTEGER)\n    FOR I ← 1 TO Count\n        OUTPUT "*"\n    NEXT I\nENDPROCEDURE\nCALL PrintStars(5)',time:Date.now()-80000000},
        3:{status:'done',code:'Error: "fifteen" is a string not an integer\nShould be: CALL SayAge(15)',time:Date.now()-70000000},
        4:{status:'started',code:'CALL DisplayMessage("Well done!"',time:Date.now()-60000000},
        5:{status:'started',code:'A procedure does stuff. A function returns something.',time:Date.now()-50000000},
      }
    },
    {
      email: 'fatima.khan@school.edu',
      prog: {
        0:{status:'done',code:'(a) Greet\n(b) Name\n(c) "Anika"\n(d) STRING',time:Date.now()-100000000},
        1:{status:'done',code:'14\n\npublic static void showDouble(int x) {\n    System.out.println(x * 2);\n}\nshowDouble(7);',time:Date.now()-95000000},
        2:{status:'done',code:'PROCEDURE PrintStars(Count : INTEGER)\n    FOR I ← 1 TO Count\n        OUTPUT "*"\n    NEXT I\nENDPROCEDURE\n\nCALL PrintStars(5)',time:Date.now()-90000000},
        3:{status:'done',code:'The parameter Age expects an INTEGER but "fifteen" is a STRING.\nFix: CALL SayAge(15)',time:Date.now()-85000000},
        4:{status:'done',code:'CALL DisplayMessage("Well done!", 3)\n\n// Java:\ndisplayMessage("Well done!", 3);',time:Date.now()-80000000},
        5:{status:'done',code:'A procedure is like void in Java - no return.\nA function has RETURN and a return type.\n\nPROCEDURE Hello()\n    OUTPUT "Hello"\nENDPROCEDURE\n\nFUNCTION Square(N : INTEGER) RETURNS INTEGER\n    RETURN N * N\nENDFUNCTION',time:Date.now()-70000000},
        6:{status:'done',code:'PROCEDURE PrintBorder(Length : INTEGER)\n    FOR I ← 1 TO Length\n        OUTPUT "-"\n    NEXT I\nENDPROCEDURE\n\nCALL PrintBorder(10)\nCALL PrintBorder(25)',time:Date.now()-60000000},
        7:{status:'done',code:'FUNCTION AddVAT(Price : REAL) RETURNS REAL\n    RETURN Price * 1.15\nENDFUNCTION\n\nTotal ← AddVAT(200.00)\n// Total = 230',time:Date.now()-50000000},
        8:{status:'done',code:'FUNCTION Power(Base : INTEGER, Exponent : INTEGER) RETURNS INTEGER\n    Result ← 1\n    FOR I ← 1 TO Exponent\n        Result ← Result * Base\n    NEXT I\n    RETURN Result\nENDFUNCTION\n\n// Power(3,4):\n// I=1 Result=3\n// I=2 Result=9\n// I=3 Result=27\n// I=4 Result=81',time:Date.now()-40000000},
        9:{status:'done',code:'FUNCTION CalculateTotal(Price : REAL, Qty : INTEGER) RETURNS REAL\n    RETURN Price * Qty\nENDFUNCTION\n\nPROCEDURE PrintReceipt(Item : STRING, Price : REAL, Qty : INTEGER)\n    Total ← CalculateTotal(Price, Qty)\n    OUTPUT Item & ": " & Total\nENDPROCEDURE\n\nCALL PrintReceipt("Notebook", 3.50, 4)\n// Output: Notebook: 14.00',time:Date.now()-30000000},
        10:{status:'done',code:'Subtract(10,4) = 6\nSubtract(4,10) = -6\nOrder matters because arguments match parameters by position. A=first, B=second.',time:Date.now()-20000000},
        11:{status:'done',code:'OUTPUT inside ChangeX: 60 (10+50)\nOUTPUT X outside: 100 (unchanged)\nThe X inside is a local copy, not the global X.',time:Date.now()-15000000},
        12:{status:'started',code:'FUNCTION CelsiusToFahrenheit(C : REAL) RETURNS REAL\n    RETURN C * 9/5 + 32\nENDFUNCTION\n\nFUNCTION FahrenheitToCelsius(F : REAL) RETURNS REAL\n    RETURN (F - 32) * 5/9\nENDFUNCTION',time:Date.now()-10000000},
        13:{status:'started',code:'FUNCTION ApplyDiscount(Price : REAL, Percent : INTEGER) RETURNS REAL\n    RETURN Price - (Price * Percent / 100)\nENDFUNCTION',time:Date.now()-5000000},
      }
    },
  ];

  // Always overwrite demo data to keep it fresh
  demoStudents.forEach(s => {
    const key = 'fp_progress_' + s.email;
    localStorage.setItem(key, JSON.stringify(s.prog));
  });

  // Ensure demo emails are whitelisted
  const config = LS.get('config');
  if (config) {
    const demoEmails = demoStudents.map(s => s.email);
    demoEmails.forEach(e => {
      if (!config.emails.includes(e)) config.emails.push(e);
    });
    LS.set('config', config);
  }
}

function buildTabs() {
  const tabs = document.getElementById('mainTabs');
  tabs.innerHTML = '';
  const items = currentUser.role === 'teacher'
    ? [['demo','Teacher Demo'],['dashboard','Dashboard'],['questions','Questions'],['tasks','View Tasks']]
    : [['tasks','My Tasks'],['questions','Discussion']];
  items.forEach(([id, label]) => {
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.dataset.view = id;
    btn.textContent = label;
    btn.addEventListener('click', () => switchView(id));
    tabs.appendChild(btn);
  });
}

function switchView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => { t.classList.toggle('active', t.dataset.view === id); });
  const el = document.getElementById('view-' + id);
  if (el) { el.classList.remove('hidden'); el.classList.add('active'); }
  if (id === 'dashboard') refreshDashboard();
  if (id === 'tasks') renderTask();
}

function renderUserBadge() {
  const b = document.getElementById('userBadge');
  const initials = currentUser.email.substring(0, 2).toUpperCase();
  b.innerHTML = `<span class="ub-icon">${initials}</span><span>${currentUser.email}</span><button id="logoutBtn">Sign Out</button>`;
  document.getElementById('logoutBtn').addEventListener('click', () => { currentUser = null; appShell.classList.add('hidden'); loginScreen.classList.remove('hidden'); document.getElementById('loginEmail').value = ''; document.getElementById('loginPass').value = ''; });
}


// ═══ CONFETTI ═══
function confetti(el) {
  const c = document.createElement('canvas'); c.width = el.offsetWidth; c.height = el.offsetHeight; c.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:999';
  el.appendChild(c); const ctx = c.getContext('2d');
  const cols = ['#E87205','#0D1B52','#5b000b','#E6E6E6','#FFF'];
  const ps = Array.from({length:60}, () => ({ x:c.width/2, y:c.height*0.5, vx:(Math.random()-.5)*16, vy:(Math.random()-1)*14, r:Math.random()*5+2, co:cols[Math.floor(Math.random()*cols.length)], l:1 }));
  let f=0;
  (function d(){ ctx.clearRect(0,0,c.width,c.height); let a=false; ps.forEach(p=>{ if(p.l<=0)return; a=true; p.x+=p.vx;p.y+=p.vy;p.vy+=.38;p.l-=.02; ctx.globalAlpha=p.l;ctx.fillStyle=p.co; ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill(); }); if(a&&f<100){f++;requestAnimationFrame(d);}else c.remove(); })();
}


/* ══════════════════════════════════════════════
   TEACHER DEMO
   ══════════════════════════════════════════════ */
const S = [
  { bannerText:'Procedure Definition', mainLines:[{parts:[{type:'text',value:'// Main Program'}],indent:0,dim:true},{parts:[{type:'text',value:'CALL SayHello()'}],indent:0}], defLines:[{parts:[{type:'text',value:'PROCEDURE SayHello()'}],indent:0},{parts:[{type:'text',value:'OUTPUT "Hello, World!"'}],indent:1},{parts:[{type:'text',value:'ENDPROCEDURE'}],indent:0}], paramSlots:[], output:'Hello, World!', returnPhase:false, returnChip:null, returnSlotLabel:null, java:'// Main\nsayHello();\n\npublic static void sayHello() {\n    System.out.println("Hello, World!");\n}', explain:'No parameters — the procedure runs the same way every time.', noInteraction:true, instrStart:'No parameters to pass! The call just runs the procedure directly.' },

  { bannerText:'Procedure Definition', mainLines:[{parts:[{type:'text',value:'// Main Program'}],indent:0,dim:true},{parts:[{type:'text',value:'Name ← "Alice"'}],indent:0},{parts:[{type:'text',value:'CALL Greet('},{type:'arg',value:'"Alice"',id:'a1'},{type:'text',value:')'}],indent:0}], defLines:[{parts:[{type:'text',value:'PROCEDURE Greet('},{type:'slot',id:'s1',label:'Name',correct:'"Alice"'},{type:'text',value:' : STRING)'}],indent:0},{parts:[{type:'text',value:'OUTPUT "Hello, " & Name'}],indent:1},{parts:[{type:'text',value:'ENDPROCEDURE'}],indent:0}], paramSlots:[{id:'s1',correct:'"Alice"'}], output:'Hello, Alice', returnPhase:false, returnChip:null, returnSlotLabel:null, java:'String name = "Alice";\ngreet(name);\n\npublic static void greet(String name) {\n    System.out.println("Hello, " + name);\n}', explain:'The argument "Alice" was passed into the parameter Name.', noInteraction:false, instrStart:'Drag the orange "Alice" chip from the Main Program into the Name slot in the Definition.' },

  { bannerText:'Procedure Definition', mainLines:[{parts:[{type:'text',value:'// Main Program'}],indent:0,dim:true},{parts:[{type:'text',value:'X ← 5'}],indent:0},{parts:[{type:'text',value:'Y ← 3'}],indent:0},{parts:[{type:'text',value:'CALL Add('},{type:'arg',value:'5',id:'a1'},{type:'text',value:', '},{type:'arg',value:'3',id:'a2'},{type:'text',value:')'}],indent:0}], defLines:[{parts:[{type:'text',value:'PROCEDURE Add('},{type:'slot',id:'s1',label:'X',correct:'5'},{type:'text',value:' : INTEGER, '},{type:'slot',id:'s2',label:'Y',correct:'3'},{type:'text',value:' : INTEGER)'}],indent:0},{parts:[{type:'text',value:'OUTPUT X + Y'}],indent:1},{parts:[{type:'text',value:'ENDPROCEDURE'}],indent:0}], paramSlots:[{id:'s1',correct:'5'},{id:'s2',correct:'3'}], output:'8', returnPhase:false, returnChip:null, returnSlotLabel:null, java:'int x = 5, y = 3;\nadd(x, y);\n\npublic static void add(int x, int y) {\n    System.out.println(x + y);\n}', explain:'Arguments matched by position: 5 → X (1st), 3 → Y (2nd).', noInteraction:false, instrStart:'Drag 5 into X, then 3 into Y. Arguments match parameters by position.' },

  { bannerText:'Function Definition', mainLines:[{parts:[{type:'text',value:'// Main Program'}],indent:0,dim:true},{parts:[{type:'text',value:'Result ← Square('},{type:'arg',value:'4',id:'a1'},{type:'text',value:')'}],indent:0},{parts:[{type:'text',value:'OUTPUT Result'}],indent:0}], defLines:[{parts:[{type:'text',value:'FUNCTION Square('},{type:'slot',id:'s1',label:'Num',correct:'4'},{type:'text',value:' : INTEGER) RETURNS INTEGER'}],indent:0},{parts:[{type:'text',value:'RETURN Num * Num'}],indent:1},{parts:[{type:'text',value:'ENDFUNCTION'}],indent:0}], paramSlots:[{id:'s1',correct:'4'}], output:'Result = 16', returnPhase:true, returnChip:{label:'16',value:'16'}, returnSlotLabel:'Result ← ', java:'int result = square(4);\n\npublic static int square(int num) {\n    return num * num;\n}', explain:'4 was passed in, 4 × 4 = 16 computed, and 16 RETURNED to the caller.', noInteraction:false, instrStart:'Drag 4 into Num. Then drag the return value back to the Main Program.' },

  { bannerText:'Procedure Definition', mainLines:[{parts:[{type:'text',value:'// Main Program'}],indent:0,dim:true},{parts:[{type:'text',value:'MyNum ← 7'}],indent:0},{parts:[{type:'text',value:'CALL DoubleIt('},{type:'arg',value:'MyNum (7)',id:'a1'},{type:'text',value:')'}],indent:0},{parts:[{type:'text',value:'OUTPUT MyNum'}],indent:0}], defLines:[{parts:[{type:'text',value:'PROCEDURE DoubleIt(BYREF '},{type:'slot',id:'s1',label:'N',correct:'MyNum (7)'},{type:'text',value:' : INTEGER)'}],indent:0},{parts:[{type:'text',value:'N ← N * 2'}],indent:1},{parts:[{type:'text',value:'ENDPROCEDURE'}],indent:0}], paramSlots:[{id:'s1',correct:'MyNum (7)'}], output:'MyNum = 14  (original changed by BYREF!)', returnPhase:true, returnChip:{label:'14',value:'14'}, returnSlotLabel:'MyNum is now ← ', java:'// Java: use array to mimic BYREF\nint[] myNum = {7};\ndoubleIt(myNum);\n// myNum[0] = 14\n\npublic static void doubleIt(int[] arr) {\n    arr[0] = arr[0] * 2;\n}', explain:'BYREF passed a reference — the original MyNum changed from 7 to 14.', noInteraction:false, instrStart:'Drag MyNum (7) into the N slot. BYREF means the original variable gets modified.' },
];

const $mainCode=document.getElementById('mainCode'),$defCode=document.getElementById('defCode'),$defBanner=document.getElementById('defBanner'),$instr=document.getElementById('instr'),$outputStrip=document.getElementById('outputStrip'),$outputText=document.getElementById('outputText'),$toast=document.getElementById('toast'),$bridgeRet=document.getElementById('bridgeLabelReturn'),$javaOverlay=document.getElementById('javaOverlay'),$javaCode=document.getElementById('javaCode'),$confetti=document.getElementById('confettiLayer');

let sc=null,filledSlots={},returnDone=false,dragVal=null;

function loadDemo(idx){
  sc=S[idx];filledSlots={};returnDone=false;
  $outputStrip.classList.add('hidden');$javaOverlay.classList.add('hidden');$bridgeRet.classList.add('hidden');
  $defBanner.textContent=sc.bannerText;$instr.textContent=sc.instrStart;
  $toast.className='toast';$confetti.innerHTML='';
  renderMain(false);renderDef(false);
  if(sc.noInteraction)setTimeout(()=>{$outputStrip.classList.remove('hidden');$outputText.textContent=sc.output;$instr.textContent='🎉 '+sc.explain;},1200);
}

function renderMain(rp){
  $mainCode.innerHTML='';
  sc.mainLines.forEach(l=>{const d=document.createElement('div');d.className='code-line'+(l.indent?' indent-'+l.indent:'');l.parts.forEach(p=>{if(p.type==='text'){const s=document.createElement('span');s.className=l.dim?'code-comment':'code-text';s.textContent=p.value;d.appendChild(s);}else if(p.type==='arg'){d.appendChild(makeArg(p.value,p.id,!!filledSlots[p.id.replace('a','s')]));}});$mainCode.appendChild(d);});
  if(rp&&!returnDone){const r=document.createElement('div');r.className='code-line';r.style.marginTop='.6rem';const l=document.createElement('span');l.className='code-text';l.textContent=sc.returnSlotLabel||'Result ← ';r.appendChild(l);r.appendChild(makeSlot('ret-main','return value',sc.returnChip.value,true));$mainCode.appendChild(r);}
  if(returnDone){const r=document.createElement('div');r.className='code-line';r.style.marginTop='.6rem';const l=document.createElement('span');l.className='code-text';l.style.fontWeight='700';l.textContent=(sc.returnSlotLabel||'Result ← ')+sc.returnChip.label;r.appendChild(l);$mainCode.appendChild(r);}
}

function renderDef(rp){
  $defCode.innerHTML='';
  sc.defLines.forEach(l=>{const d=document.createElement('div');d.className='code-line'+(l.indent?' indent-'+l.indent:'');l.parts.forEach(p=>{if(p.type==='text'){const s=document.createElement('span');s.className='code-text';s.textContent=p.value;d.appendChild(s);}else if(p.type==='slot'){if(filledSlots[p.id]){const s=document.createElement('span');s.className='slot filled';s.textContent=p.label+' = '+filledSlots[p.id];d.appendChild(s);}else{d.appendChild(makeSlot(p.id,p.label,p.correct,false));}}});$defCode.appendChild(d);});
  if(rp&&sc.returnChip&&!returnDone){const r=document.createElement('div');r.className='code-line';r.style.marginTop='.6rem';const l=document.createElement('span');l.className='code-text';l.textContent='RETURN → ';r.appendChild(l);r.appendChild(makeArg(sc.returnChip.label,'ret-chip',false,true));$defCode.appendChild(r);}
}

function makeArg(label,id,sent,isRet){
  const el=document.createElement('span');el.className='arg'+(sent?' sent':'')+(isRet?' ret-arg':'');el.textContent=label;el.draggable=!sent;el.dataset.val=label;if(sent)return el;
  el.addEventListener('dragstart',e=>{dragVal=label;e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',label)}catch(_){};el.classList.add('dragging');});
  el.addEventListener('dragend',()=>{el.classList.remove('dragging');dragVal=null;});
  let clone=null;
  el.addEventListener('touchstart',e=>{dragVal=label;const t=e.touches[0];clone=el.cloneNode(true);clone.style.cssText='position:fixed;z-index:9999;pointer-events:none;opacity:.85;transform:scale(1.1)';clone.style.left=(t.clientX-50)+'px';clone.style.top=(t.clientY-24)+'px';document.body.appendChild(clone);el.classList.add('dragging');},{passive:true});
  el.addEventListener('touchmove',e=>{if(!clone)return;const t=e.touches[0];clone.style.left=(t.clientX-50)+'px';clone.style.top=(t.clientY-24)+'px';document.querySelectorAll('.slot:not(.filled)').forEach(s=>{const r=s.getBoundingClientRect();s.classList.toggle('drag-over',t.clientX>=r.left&&t.clientX<=r.right&&t.clientY>=r.top&&t.clientY<=r.bottom);});e.preventDefault();},{passive:false});
  el.addEventListener('touchend',e=>{if(clone){clone.remove();clone=null;}el.classList.remove('dragging');const t=e.changedTouches[0];document.querySelectorAll('.slot').forEach(s=>{s.classList.remove('drag-over');const r=s.getBoundingClientRect();if(t.clientX>=r.left&&t.clientX<=r.right&&t.clientY>=r.top&&t.clientY<=r.bottom)handleDemoDrop(s,dragVal);});dragVal=null;});
  return el;
}

function makeSlot(id,label,correct,isRet){
  const el=document.createElement('span');el.className='slot'+(isRet?' ret-slot':'');el.dataset.id=id;el.dataset.correct=correct;el.textContent=label+' = ?';el.style.fontSize='1.1rem';
  el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('drag-over');});
  el.addEventListener('dragleave',()=>el.classList.remove('drag-over'));
  el.addEventListener('drop',e=>{e.preventDefault();el.classList.remove('drag-over');handleDemoDrop(el,dragVal||e.dataTransfer.getData('text/plain'));});
  return el;
}

function handleDemoDrop(slot,val){
  if(!val)return;const correct=slot.dataset.correct,id=slot.dataset.id;
  if(val===correct){
    slot.textContent=slot.textContent.split('=')[0].trim()+' = '+val;slot.classList.add('filled');filledSlots[id]=val;demoToast('','');
    const allFilled=sc.paramSlots.every(s=>filledSlots[s.id]);
    if(id==='ret-main'){returnDone=true;setTimeout(()=>demoComplete(),600);}
    else if(allFilled&&!sc.returnPhase)setTimeout(()=>demoComplete(),600);
    else if(allFilled&&sc.returnPhase)setTimeout(()=>startReturn(),800);
    if(!id.startsWith('ret'))setTimeout(()=>{renderMain(false);renderDef(false);},50);
  }else{slot.classList.add('wrong');demoToast('Not the right value for this slot!','err');setTimeout(()=>slot.classList.remove('wrong'),600);}
}

function startReturn(){$instr.textContent='The function computed a result. Drag the return value back to the Main Program.';$bridgeRet.classList.remove('hidden');renderMain(true);renderDef(true);}
function demoComplete(){$outputStrip.classList.remove('hidden');$outputText.textContent=sc.output;$instr.textContent='🎉 '+sc.explain;confetti($confetti);renderMain(false);renderDef(false);}
function demoToast(m,t){$toast.textContent=m;$toast.className='toast'+(t?' show '+t:'');if(m)setTimeout(()=>{$toast.className='toast';},2500);}

document.querySelectorAll('.pill').forEach(p=>{p.addEventListener('click',()=>{document.querySelectorAll('.pill').forEach(x=>x.classList.remove('active'));p.classList.add('active');loadDemo(+p.dataset.idx);});});
document.getElementById('resetBtn').addEventListener('click',()=>loadDemo(+document.querySelector('.pill.active').dataset.idx));
document.getElementById('langBtn').addEventListener('click',()=>{$javaCode.textContent=sc.java;$javaOverlay.classList.remove('hidden');});
document.getElementById('javaClose').addEventListener('click',()=>$javaOverlay.classList.add('hidden'));
loadDemo(0);


/* ══════════════════════════════════════════════
   QUESTIONS
   ══════════════════════════════════════════════ */
const questions=[
  {q:'What is the difference between a <b>procedure</b> and a <b>function</b>?',a:'A <b>procedure</b> does not return a value. A <b>function</b> returns a value. In Java: <code>void</code> method vs a typed method.'},
  {q:'What is a <b>parameter</b>? How is it different from an <b>argument</b>?',a:'A <b>parameter</b> is the placeholder in the definition. An <b>argument</b> is the actual value passed in the call.'},
  {q:'Why use parameters instead of global variables?',a:'Parameters make code <b>reusable and modular</b>.'},
  {q:'<code>CalculateArea(5, 10)</code> with <code>PROCEDURE CalculateArea(Length, Width)</code>. What does <code>Width</code> hold?',a:'<code>Width = 10</code>. Arguments match parameters <b>by position</b>.'},
  {q:'What does <b>BYVAL</b> mean?',a:'A <b>copy</b> is passed. Changes inside do <b>not</b> affect the original.'},
  {q:'What does <b>BYREF</b> mean?',a:'A <b>reference</b> is passed. Changes <b>do</b> affect the original.'},
  {q:'What does <code>Triple(Triple(2))</code> evaluate to if Triple returns <code>N * 3</code>?',a:'Triple(2)=6, Triple(6)=18. <b>Result = 18</b>.'},
  {q:'What happens if you pass the <b>wrong number</b> of arguments?',a:'You get an <b>error</b>. The count must match exactly.'},
  {q:'What is a <b>local variable</b>?',a:'A variable that exists only inside the procedure. Parameters are local.'},
  {q:'Why should parameter names be meaningful?',a:'<code>CalculateArea(Length, Width)</code> is self-documenting. <code>CalculateArea(A, B)</code> is not.'},
  {q:'Can a function call another function?',a:'Yes! Return values can chain into other function calls.'},
  {q:'What return type: <code>RETURN (N MOD 2 = 0)</code>?',a:'<b>BOOLEAN</b> — TRUE or FALSE.'},
];
let shuffled=[],qIdx=-1;
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
document.getElementById('showQBtn').addEventListener('click',()=>{if(!shuffled.length||qIdx>=shuffled.length-1){shuffled=shuffle(questions);qIdx=-1;}qIdx++;document.getElementById('qNum').textContent=qIdx+1;document.getElementById('qBody').innerHTML=shuffled[qIdx].q;document.getElementById('qAnswer').classList.add('hidden');document.getElementById('revealBtn').disabled=false;document.getElementById('qCount').textContent=(qIdx+1)+'/'+shuffled.length;});
document.getElementById('revealBtn').addEventListener('click',()=>{document.getElementById('qAnswer').innerHTML='<strong>Guidance:</strong> '+shuffled[qIdx].a;document.getElementById('qAnswer').classList.remove('hidden');document.getElementById('revealBtn').disabled=true;});


/* ══════════════════════════════════════════════
   STUDENT TASKS + CODE EDITOR
   ══════════════════════════════════════════════ */
const tasks=[
{t:'Identify the Parts',d:'easy',keys:['Greet','Name','Anika','STRING'],b:`Look at this code:\n<pre>PROCEDURE Greet(Name : STRING)\n    OUTPUT "Hello, " &amp; Name\nENDPROCEDURE\n\nCALL Greet("Anika")</pre>\nWrite down: <b>(a)</b> the procedure name, <b>(b)</b> the parameter, <b>(c)</b> the argument, <b>(d)</b> the data type.\n<div class="task-hint">💡 The parameter is in the definition brackets. The argument is in the call brackets.</div>`},
{t:'Predict the Output',d:'easy',keys:['14','ShowDouble','OUTPUT'],b:`What does this output?\n<pre>PROCEDURE ShowDouble(X : INTEGER)\n    OUTPUT X * 2\nENDPROCEDURE\n\nCALL ShowDouble(7)</pre>\nRewrite in <b>Java</b>.\n<div class="task-hint">💡 Replace X with 7, then calculate.</div>`},
{t:'Fill in the Blanks',d:'easy',keys:['Count','5','PrintStars'],b:`Complete the gaps so the procedure prints 5 stars:\n<pre>PROCEDURE PrintStars(______ : INTEGER)\n    FOR I ← 1 TO Count\n        OUTPUT "*"\n    NEXT I\nENDPROCEDURE\n\nCALL PrintStars(______)</pre>\n<div class="task-hint">💡 The parameter name must match what's used in the loop.</div>`},
{t:'Spot the Error',d:'easy',keys:['INTEGER','type','mismatch','15','number'],b:`Find and fix the error:\n<pre>PROCEDURE SayAge(Age : INTEGER)\n    OUTPUT "You are " &amp; Age &amp; " years old"\nENDPROCEDURE\n\nCALL SayAge("fifteen")</pre>\n<div class="task-hint">💡 Compare the parameter's data type with the argument.</div>`},
{t:'Write a Call',d:'easy',keys:['DisplayMessage','Well done','3','CALL'],b:`Given:\n<pre>PROCEDURE DisplayMessage(Msg : STRING, Times : INTEGER)\n    FOR I ← 1 TO Times\n        OUTPUT Msg\n    NEXT I\nENDPROCEDURE</pre>\nWrite a call that displays <code>"Well done!"</code> three times. Then rewrite in <b>Java</b>.\n<div class="task-hint">💡 Match argument types and positions to the parameters.</div>`},
{t:'Procedure vs Function',d:'easy',keys:['PROCEDURE','FUNCTION','RETURN','void'],b:`<b>(a)</b> Explain the difference between a procedure and a function.<br><b>(b)</b> Write a simple procedure in CIE pseudocode and Java.<br><b>(c)</b> Write a simple function in CIE pseudocode and Java.\n<div class="task-hint">💡 A function uses RETURN and declares a return type.</div>`},
{t:'Write a Procedure',d:'medium',keys:['PROCEDURE','PrintBorder','Length','FOR','ENDPROCEDURE','OUTPUT'],b:`Write <code>PrintBorder(Length : INTEGER)</code> that outputs <code>Length</code> dashes. Write two calls (10 and 25). CIE and Java.\n<div class="task-hint">💡 Use a FOR loop from 1 to Length.</div>`},
{t:'Write a Function',d:'medium',keys:['FUNCTION','AddVAT','Price','RETURN','1.15','230','ENDFUNCTION'],b:`Write <code>AddVAT(Price : REAL) RETURNS REAL</code> adding 15% VAT. What does <code>Total ← AddVAT(200.00)</code> give? CIE and Java.\n<div class="task-hint">💡 RETURN Price * 1.15</div>`},
{t:'Two-Parameter Function',d:'medium',keys:['FUNCTION','Power','Base','Exponent','RETURN','ENDFUNCTION','Result'],b:`Write <code>Power(Base, Exponent) RETURNS INTEGER</code> using a loop. Show step by step what <code>Power(3, 4)</code> returns. CIE and Java.\n<div class="task-hint">💡 Start Result at 1, multiply by Base each iteration.</div>`},
{t:'Function Calling a Procedure',d:'medium',keys:['FUNCTION','PROCEDURE','CALL','RETURN','ENDFUNCTION','ENDPROCEDURE','OUTPUT'],b:`Write a program with two modules:\n<ol><li>A <b>function</b> <code>CalculateTotal(Price : REAL, Qty : INTEGER) RETURNS REAL</code> that returns <code>Price * Qty</code></li>\n<li>A <b>procedure</b> <code>PrintReceipt(Item : STRING, Price : REAL, Qty : INTEGER)</code> that calls <code>CalculateTotal</code> and outputs the item name and total cost</li></ol>\nWrite a main program that calls <code>PrintReceipt("Notebook", 3.50, 4)</code>. What is the output?<br>Write in both CIE pseudocode and Java.\n<div class="task-hint">💡 The procedure calls the function to get the total, then uses OUTPUT to display it.</div>`},
{t:'Argument Order',d:'medium',keys:['6','-6','position','first','second','ENDPROCEDURE'],b:`<pre>PROCEDURE Subtract(A : INTEGER, B : INTEGER)\n    OUTPUT A - B\nENDPROCEDURE\n\nCALL Subtract(10, 4)\nCALL Subtract(4, 10)</pre>\n<b>(a)</b> Output of each call? <b>(b)</b> Why does order matter?\n<div class="task-hint">💡 A gets the first value, B the second.</div>`},
{t:'Local vs Global',d:'medium',keys:['60','100','local','copy','ENDPROCEDURE'],b:`Predict all outputs:\n<pre>X ← 100\n\nPROCEDURE ChangeX(X : INTEGER)\n    X ← X + 50\n    OUTPUT X\nENDPROCEDURE\n\nCALL ChangeX(10)\nOUTPUT X</pre>\n<div class="task-hint">💡 The parameter X is a local copy, not the global X.</div>`},
{t:'Two Functions Together',d:'medium',keys:['FUNCTION','RETURN','ENDFUNCTION','CALL','CelsiusToFahrenheit','FahrenheitToCelsius'],b:`Write two functions that work together:\n<ol><li><code>CelsiusToFahrenheit(C : REAL) RETURNS REAL</code> — returns <code>C * 9/5 + 32</code></li>\n<li><code>FahrenheitToCelsius(F : REAL) RETURNS REAL</code> — returns <code>(F - 32) * 5/9</code></li></ol>\nWrite a main program that:\n<ol><li>Converts 100°C to Fahrenheit and outputs the result</li>\n<li>Converts 32°F to Celsius and outputs the result</li></ol>\nWrite in CIE pseudocode and Java.\n<div class="task-hint">💡 Each function takes one parameter and returns the converted temperature.</div>`},
{t:'Modular Discount System',d:'medium',keys:['FUNCTION','PROCEDURE','RETURN','ENDFUNCTION','ENDPROCEDURE','CALL','ApplyDiscount','CalculateVAT','ShowFinalPrice'],b:`Build a modular pricing system with three modules:\n<ol><li><code>ApplyDiscount(Price : REAL, Percent : INTEGER) RETURNS REAL</code> — returns the price after removing the discount percentage</li>\n<li><code>CalculateVAT(Price : REAL) RETURNS REAL</code> — returns the price with 20% VAT added</li>\n<li><code>ShowFinalPrice(Original : REAL, Discount : INTEGER)</code> — a <b>procedure</b> that calls both functions above (discount first, then VAT) and outputs the original price, discounted price, and final price with VAT</li></ol>\nWrite a main program that calls <code>ShowFinalPrice(50.00, 10)</code>. What are the three values output?<br>Write in CIE pseudocode and Java.\n<div class="task-hint">💡 The procedure orchestrates the two functions: first apply the discount, then add VAT to the discounted price.</div>`},
{t:'Multi-Function Program',d:'hard',keys:['GetArea','GetPerimeter','FUNCTION','RETURN','ENDFUNCTION','Length','Width','CALL'],b:`Write in CIE and Java:\n<ol><li><code>GetArea(Length, Width)</code> → returns area</li>\n<li><code>GetPerimeter(Length, Width)</code> → returns perimeter</li>\n<li><code>DescribeRectangle(Length, Width)</code> — calls both, outputs results</li></ol>\nWrite a main program that reads inputs and calls DescribeRectangle.`},
{t:'Validation Function',d:'hard',keys:['ValidateAge','FUNCTION','BOOLEAN','RETURN','WHILE','ENDFUNCTION'],b:`Write <code>ValidateAge(Age) RETURNS BOOLEAN</code> (TRUE if 0–150). Write <code>GetValidAge()</code> that loops until valid. CIE and Java.`},
{t:'Swap (BYREF)',d:'hard',keys:['Swap','BYREF','Temp','ENDPROCEDURE'],b:`Write <code>Swap(BYREF A, BYREF B)</code> using a temp variable. Show what happens step by step when X=5, Y=9. Why is BYREF essential? In Java, swap two array elements.`},
{t:'Recursive Function',d:'hard',keys:['Factorial','FUNCTION','RETURN','base case','ENDFUNCTION','120'],b:`<pre>FUNCTION Factorial(N : INTEGER) RETURNS INTEGER\n    IF N &lt;= 1 THEN\n        RETURN 1\n    ELSE\n        RETURN N * Factorial(N - 1)\n    ENDIF\nENDFUNCTION</pre>\n<b>(a)</b> Work through Factorial(5) showing each call and return value. <b>(b)</b> Base case? <b>(c)</b> Without one? <b>(d)</b> Java version.`},
{t:'String Processing',d:'hard',keys:['CountChar','FUNCTION','RETURN','ENDFUNCTION','FOR','LENGTH'],b:`Write <code>CountChar(Text, Target) RETURNS INTEGER</code>. Show step by step what <code>CountChar("banana", "a")</code> returns. Count vowels using it 5 times. CIE and Java.`},
{t:'Array Parameter',d:'hard',keys:['FindMax','FindMin','FUNCTION','RETURN','ENDFUNCTION','ARRAY'],b:`Write <code>FindMax</code> and <code>FindMin</code>. Write <code>DisplayStats</code> showing max, min, range. CIE and Java.`},
{t:'Bubble Sort',d:'challenge',keys:['BubbleSort','BYREF','Swap','PROCEDURE','ENDPROCEDURE','FOR'],b:`Write <code>BubbleSort(BYREF Arr(), Size)</code> in CIE and Java.\n<ol><li>Why BYREF?</li><li>Use a separate Swap procedure.</li><li>Show the array after each pass when sorting [4, 2, 7, 1, 3].</li></ol>`},
{t:'Password Checker',d:'challenge',keys:['HasMinLength','HasUpperCase','HasDigit','CheckPassword','FUNCTION','BOOLEAN','RETURN','ENDFUNCTION'],b:`Build a modular password system:\n<ol><li><code>HasMinLength → BOOLEAN</code></li>\n<li><code>HasUpperCase → BOOLEAN</code></li>\n<li><code>HasDigit → BOOLEAN</code></li>\n<li><code>CheckPassword → STRING</code> ("Strong"/"Medium"/"Weak")</li></ol>\nFull CIE and Java. Work through <code>CheckPassword("Hello1")</code> showing what each function returns.`},
{t:'Menu Calculator',d:'challenge',keys:['FUNCTION','PROCEDURE','GetChoice','GetNumber','RETURN','ENDFUNCTION','WHILE','DIV'],b:`Calculator with separate functions, plus <code>GetChoice()</code> and <code>GetNumber(Prompt)</code>. Main loop with validation. Divide handles zero. CIE and Java.`},
{t:'Exam-Style Question',d:'challenge',keys:['CalculateMean','CountAbove','PrintReport','FUNCTION','RETURN','ENDFUNCTION','CALL','modular'],b:`<b>[12 marks]</b> Student marks in an array:\n<ol><li><code>CalculateMean(Marks(), Count) RETURNS REAL</code> [3]</li>\n<li><code>CountAbove(Marks(), Count, Threshold) RETURNS INTEGER</code> [3]</li>\n<li><code>PrintReport(Marks(), Count)</code> — outputs mean, count above mean, count above 75 [4]</li></ol>\nExplain why separate functions are better. [2] CIE then Java.`},
];

let curTask=0;
const $tCard=document.getElementById('taskCard'),$tPos=document.getElementById('taskPos'),$tPrev=document.getElementById('prevTask'),$tNext=document.getElementById('nextTask'),$tFill=document.getElementById('taskFill'),$tSide=document.getElementById('taskSide');
const $editor=document.getElementById('codeEditor'),$lineNums=document.getElementById('lineNumbers'),$feedbackBox=document.getElementById('feedbackBox'),$editorStatus=document.getElementById('editorStatus');

function getProgress(){return LS.get('progress_'+currentUser?.email)||{};}
function saveProgress(taskIdx,status,code){if(!currentUser)return;const p=getProgress();p[taskIdx]={status,code,time:Date.now()};LS.set('progress_'+currentUser.email,p);}

function buildSide(){
  $tSide.innerHTML='';const prog=getProgress();
  tasks.forEach((t,i)=>{
    const b=document.createElement('button');b.className='task-side-btn'+(i===curTask?' active':'');
    const dc={easy:'sd-easy',medium:'sd-medium',hard:'sd-hard',challenge:'sd-challenge'}[t.d];
    const st=prog[i]?.status;
    const icon=st==='done'?' ✓':st==='started'?' ●':'';
    b.innerHTML=`<span class="side-dot ${dc}">${i+1}</span>${t.t}<span class="task-status-icon">${icon}</span>`;
    b.addEventListener('click',()=>{curTask=i;renderTask();});
    $tSide.appendChild(b);
  });
}

function renderTask(){
  const t=tasks[curTask],prog=getProgress(),saved=prog[curTask];
  const bc={easy:'b-easy',medium:'b-medium',hard:'b-hard',challenge:'b-challenge'}[t.d];
  $tCard.innerHTML=`<h3>Task ${curTask+1}: ${t.t} <span class="badge ${bc}">${t.d}</span></h3>${t.b}`;
  $tPos.textContent=(curTask+1)+' / '+tasks.length;
  $tPrev.disabled=curTask===0;$tNext.disabled=curTask===tasks.length-1;
  $tFill.style.width=((curTask+1)/tasks.length*100)+'%';
  $editor.value=saved?.code||'';
  $feedbackBox.classList.add('hidden');$feedbackBox.className='feedback-box hidden';
  $editorStatus.textContent=saved?.status==='done'?'✓ Completed':saved?.status==='started'?'● In progress':'';
  $editorStatus.className='editor-status'+(saved?.status==='done'?' saved':'');
  updateLineNumbers();buildSide();
  const a=$tSide.querySelector('.active');if(a)a.scrollIntoView({block:'nearest',behavior:'smooth'});
}

// Code editor — auto-indent
$editor.addEventListener('keydown',e=>{
  if(e.key==='Tab'){
    e.preventDefault();
    const s=$editor.selectionStart,end=$editor.selectionEnd;
    $editor.value=$editor.value.substring(0,s)+'    '+$editor.value.substring(end);
    $editor.selectionStart=$editor.selectionEnd=s+4;
    updateLineNumbers();return;
  }
  if(e.key==='Enter'){
    e.preventDefault();
    const s=$editor.selectionStart;
    const lineStart=$editor.value.lastIndexOf('\n',s-1)+1;
    const currentLine=$editor.value.substring(lineStart,s);
    // Count existing indent
    const indent=currentLine.match(/^(\s*)/)[1];
    // Add extra indent after keywords
    const trimmed=currentLine.trim().toUpperCase();
    let extra='';
    if(/^(PROCEDURE|FUNCTION|IF|ELSE|FOR|WHILE|REPEAT|CASE)/.test(trimmed))extra='    ';
    $editor.value=$editor.value.substring(0,s)+'\n'+indent+extra+$editor.value.substring(s);
    $editor.selectionStart=$editor.selectionEnd=s+1+indent.length+extra.length;
    updateLineNumbers();
  }
});
$editor.addEventListener('input',()=>{updateLineNumbers();autoSave();});
$editor.addEventListener('scroll',()=>{$lineNums.scrollTop=$editor.scrollTop;});

function updateLineNumbers(){
  const lines=$editor.value.split('\n').length;
  $lineNums.textContent=Array.from({length:lines},(_,i)=>i+1).join('\n');
}

function autoSave(){
  const code=$editor.value.trim();
  if(!code)return;
  const prog=getProgress();
  const existing=prog[curTask]?.status;
  if(existing!=='done')saveProgress(curTask,'started',code);
}

// Submit + feedback
document.getElementById('submitAnswer').addEventListener('click',()=>{
  const code=$editor.value.trim();
  if(!code){$feedbackBox.innerHTML='<strong>Please type your answer first.</strong>';$feedbackBox.className='feedback-box fb-needs';$feedbackBox.classList.remove('hidden');return;}
  const t=tasks[curTask];
  const upper=code.toUpperCase();
  const found=t.keys.filter(k=>upper.includes(k.toUpperCase()));
  const missed=t.keys.filter(k=>!upper.includes(k.toUpperCase()));
  const pct=found.length/t.keys.length;

  let cls,msg;
  if(pct>=0.75){
    cls='fb-good';msg=`<strong>Great work!</strong> Your answer covers the key concepts.`;
    saveProgress(curTask,'done',code);
    $editorStatus.textContent='✓ Completed';$editorStatus.className='editor-status saved';
  }else if(pct>=0.4){
    cls='fb-partial';msg=`<strong>Good start!</strong> Your answer is on the right track but is missing some elements.`;
    saveProgress(curTask,'started',code);
  }else{
    cls='fb-needs';msg=`<strong>Keep going!</strong> Your answer needs more detail.`;
    saveProgress(curTask,'started',code);
  }

  let checklist='<ul class="fb-checklist">';
  found.forEach(k=>{checklist+=`<li class="fb-check">Includes: <code>${k}</code></li>`;});
  missed.forEach(k=>{checklist+=`<li class="fb-cross">Missing: <code>${k}</code></li>`;});
  checklist+='</ul>';

  $feedbackBox.innerHTML=msg+checklist;
  $feedbackBox.className='feedback-box '+cls;
  $feedbackBox.classList.remove('hidden');
  buildSide();
});

document.getElementById('clearEditor').addEventListener('click',()=>{$editor.value='';updateLineNumbers();$feedbackBox.classList.add('hidden');});
$tPrev.addEventListener('click',()=>{if(curTask>0){curTask--;renderTask();}});
$tNext.addEventListener('click',()=>{if(curTask<tasks.length-1){curTask++;renderTask();}});
renderTask();


/* ══════════════════════════════════════════════
   TEACHER DASHBOARD
   ══════════════════════════════════════════════ */
function refreshDashboard(){
  const config=LS.get('config');if(!config)return;
  // Gather all student progress
  const students=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k.startsWith('fp_progress_')){
      const email=k.replace('fp_progress_','');
      if(email!==config.teacherEmail){
        const prog=JSON.parse(localStorage.getItem(k));
        students.push({email,prog});
      }
    }
  }

  // Summary
  const $sum=document.getElementById('dashSummary');
  const totalTasks=tasks.length;
  let totalDone=0,totalStarted=0;
  students.forEach(s=>{Object.values(s.prog).forEach(v=>{if(v.status==='done')totalDone++;else if(v.status==='started')totalStarted++;});});
  $sum.innerHTML=`
    <div class="dash-stat"><div class="ds-num">${students.length}</div><div class="ds-label">Students</div></div>
    <div class="dash-stat"><div class="ds-num">${totalDone}</div><div class="ds-label">Tasks Completed</div></div>
    <div class="dash-stat"><div class="ds-num">${totalStarted}</div><div class="ds-label">In Progress</div></div>
    <div class="dash-stat"><div class="ds-num">${students.length*totalTasks-totalDone-totalStarted}</div><div class="ds-label">Not Started</div></div>`;

  // Table
  const $body=document.getElementById('dashBody');$body.innerHTML='';
  if(!students.length){$body.innerHTML='<tr><td colspan="5" style="text-align:center;opacity:.5;padding:1.5rem">No student data yet.</td></tr>';return;}
  students.forEach(s=>{
    let done=0,started=0;
    for(let i=0;i<totalTasks;i++){const st=s.prog[i]?.status;if(st==='done')done++;else if(st==='started')started++;}
    const notStarted=totalTasks-done-started;
    let dots='<div class="detail-row">';
    for(let i=0;i<totalTasks;i++){
      const st=s.prog[i]?.status;
      const cls=st==='done'?'dd-done':st==='started'?'dd-prog':'dd-none';
      dots+=`<span class="detail-dot ${cls}">${i+1}</span>`;
    }
    dots+='</div>';
    $body.innerHTML+=`<tr>
      <td><strong>${s.email}</strong></td>
      <td><span class="badge-done">${done}</span></td>
      <td><span class="badge-prog">${started}</span></td>
      <td><span class="badge-none">${notStarted}</span></td>
      <td>${dots}</td></tr>`;
  });
}

document.getElementById('dashRefresh').addEventListener('click',refreshDashboard);

// Whitelist management
document.getElementById('manageWhitelist').addEventListener('click',()=>{
  const config=LS.get('config');if(!config)return;
  document.getElementById('editDomains').value=(config.domains||[]).join(', ');
  document.getElementById('editEmails').value=(config.emails||[]).join('\n');
  document.getElementById('whitelistEditor').classList.remove('hidden');
});
document.getElementById('cancelWhitelist').addEventListener('click',()=>document.getElementById('whitelistEditor').classList.add('hidden'));
document.getElementById('saveWhitelist').addEventListener('click',()=>{
  const config=LS.get('config');
  config.domains=document.getElementById('editDomains').value.split(',').map(d=>d.trim().toLowerCase()).filter(Boolean);
  config.emails=document.getElementById('editEmails').value.split('\n').map(e=>e.trim().toLowerCase()).filter(Boolean);
  LS.set('config',config);
  document.getElementById('whitelistEditor').classList.add('hidden');
});
