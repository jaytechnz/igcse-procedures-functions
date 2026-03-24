/* ═══════════════════════════════════════════
   IGCSE 0478 — Functions & Parameters
   Firebase-secured platform
   ═══════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   ★ TEACHER: EDIT THESE TWO SECTIONS ★
   ═══════════════════════════════════════════ */

// 1.Firebase config settings (from Firebase Console → Project Settings → Your Apps)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDXNLbkYD3z2irF42NO1WmBcxxp7Cfqw54",
  authDomain: "igcse-modularity.firebaseapp.com",
  projectId: "igcse-modularity",
  storageBucket: "igcse-modularity.firebasestorage.app",
  messagingSenderId: "702420091115",
  appId: "1:702420091115:web:5c635cbd3bac9b0db0beae"
};

// 2. Student whitelist — only these emails/domains can create student accounts
const STUDENT_WHITELIST = {
  domains: ['student.cga.school'],
  emails: [
    // 'john.smith@student.cga.school',
    // Add emails here for exceptions such as non-cga domains
  ],
};

/* ═══════════════════════════════════════════
   FIREBASE INIT
   ═══════════════════════════════════════════ */
firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

/* ═══════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════ */
let currentUser = null; // {uid, email, role, classCode?, teacherUid?}
let creatingAccount = false;
const loginScreen = document.getElementById('loginScreen');
const appShell = document.getElementById('appShell');
let loginRole = 'student';

// Tab toggle
document.querySelectorAll('.ltab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.ltab').forEach(b => b.classList.remove('active'));
    t.classList.add('active');
    loginRole = t.dataset.role;
    document.getElementById('loginEmail').placeholder = loginRole === 'teacher'
      ? 'i.lastName@cga.school' : 'firstName.lastName@student.cga.school';
    document.getElementById('loginHint').textContent = loginRole === 'teacher'
      ? 'First time? This will create your teacher account.'
      : 'First time? This will create your student account.';
    document.getElementById('classCodeWrap').style.display = loginRole === 'student' ? '' : 'none';
    document.getElementById('loginWinston').src = loginRole === 'student'
      ? 'images/winston-wave.png'
      : 'images/winston-wink-thumbs-up.png';
  });
});

function isStudentWhitelisted(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (STUDENT_WHITELIST.domains.some(d => domain === d.toLowerCase())) return true;
  if (STUDENT_WHITELIST.emails.some(e => email.toLowerCase() === e.toLowerCase())) return true;
  return false;
}

function showErr(el, msg) { el.textContent = msg; el.classList.remove('hidden'); }

function generateClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Login button
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  const spinner = document.getElementById('loginSpinner');
  errEl.classList.add('hidden');

  if (!email || !email.includes('@')) { showErr(errEl, 'Please enter a valid email.'); return; }
  if (pass.length < 6) { showErr(errEl, 'Password must be at least 6 characters.'); return; }

  // Whitelist check for students (before hitting Firebase)
  if (loginRole === 'student' && !isStudentWhitelisted(email)) {
    showErr(errEl, 'Your email is not on the whitelist. Ask your teacher to add it.');
    return;
  }

  spinner.classList.remove('hidden');

  try {
    // Try sign in first
    const cred = await auth.signInWithEmailAndPassword(email, pass);
    // Auth state listener handles the rest
  } catch (signInErr) {
    if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
      // New user — create account
      try {
        if (loginRole === 'student') {
          const code = document.getElementById('classCode').value.trim().toUpperCase();
          if (!code) {
            spinner.classList.add('hidden');
            showErr(errEl, 'Enter your class code to create an account.');
            return;
          }
          // Validate class code BEFORE creating auth account (no token needed)
          const codeDoc = await db.collection('classCodes').doc(code).get();
          if (!codeDoc.exists) {
            spinner.classList.add('hidden');
            showErr(errEl, 'Invalid class code. Check with your teacher.');
            return;
          }
          const teacherUid = codeDoc.data().teacherUid;
          creatingAccount = true;
          const cred = await auth.createUserWithEmailAndPassword(email, pass);
          await db.collection('users').doc(cred.user.uid).set({ email, role: 'student', teacherUid, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
          await db.collection('progress').doc(cred.user.uid).set({ tasks: {}, quiz: {}, teacherUid });
          currentUser = { uid: cred.user.uid, email, role: 'student', teacherUid };
        } else {
          creatingAccount = true;
          const cred = await auth.createUserWithEmailAndPassword(email, pass);
          const classCode = generateClassCode();
          await db.collection('users').doc(cred.user.uid).set({ email, role: 'teacher', classCode, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
          await db.collection('progress').doc(cred.user.uid).set({ tasks: {}, quiz: {} });
          await db.collection('classCodes').doc(classCode).set({ teacherUid: cred.user.uid });
          currentUser = { uid: cred.user.uid, email, role: 'teacher', classCode };
        }
        creatingAccount = false;
        enterApp();
      } catch (createErr) {
        creatingAccount = false;
        spinner.classList.add('hidden');
        showErr(errEl, createErr.message);
      }
    } else if (signInErr.code === 'auth/wrong-password') {
      spinner.classList.add('hidden');
      showErr(errEl, 'Incorrect password.');
    } else {
      spinner.classList.add('hidden');
      showErr(errEl, signInErr.message);
    }
  }
});

// Firebase auth state listener — fires on login/logout/page load
auth.onAuthStateChanged(async (user) => {
  if (creatingAccount) return;
  if (user) {
    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        let classCode = data.classCode;
        if (data.role === 'teacher') {
          if (!classCode) {
            classCode = generateClassCode();
            await db.collection('users').doc(user.uid).update({ classCode });
          }
          // Ensure classCodes entry exists (backfills existing teachers)
          await db.collection('classCodes').doc(classCode).set({ teacherUid: user.uid });
        }
        currentUser = { uid: user.uid, email: user.email, role: data.role, classCode, teacherUid: data.teacherUid };
      } else {
        // User exists in Auth but not Firestore (shouldn't happen, but handle it)
        const role = isStudentWhitelisted(user.email) ? 'student' : 'teacher';
        const extra = role === 'teacher' ? { classCode: generateClassCode() } : {};
        await db.collection('users').doc(user.uid).set({
          email: user.email, role, ...extra,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('progress').doc(user.uid).set({ tasks: {}, quiz: {}, teacherUid: '' });
        currentUser = { uid: user.uid, email: user.email, role, ...extra };
      }
      enterApp();
    } catch (err) {
      console.error('Auth state error:', err);
      loginScreen.classList.remove('hidden');
      appShell.classList.add('hidden');
      showErr(document.getElementById('loginError'), 'Sign-in error: ' + err.message);
    }
  } else {
    // Not signed in — show login
    currentUser = null;
    appShell.classList.add('hidden');
    loginScreen.classList.remove('hidden');
  }
  document.getElementById('loginSpinner')?.classList.add('hidden');
});

async function enterApp() {
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  buildTabs();
  renderUserBadge();
  // Load progress from Firestore into local cache
  await refreshCache();
  if (currentUser.role === 'teacher') switchView('demo');
  else switchView('tasks');
}

function buildTabs() {
  const tabs = document.getElementById('mainTabs');
  tabs.innerHTML = '';
  const items = currentUser.role === 'teacher'
    ? [['demo','Teacher Demo'],['library','Library Routines'],['strings','String Handling'],['dashboard','Dashboard'],['analytics','Analytics'],['questions','Quiz (View)'],['tasks','Tasks (View)']]
    : [['tasks','My Tasks'],['questions','Quiz']];
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
  if (id === 'questions') renderQuiz();
  if (id === 'library') renderLibSection('library');
  if (id === 'strings') renderLibSection('strings');
  if (id === 'analytics') renderAnalytics(_dashStudents);
}

function renderUserBadge() {
  const b = document.getElementById('userBadge');
  const initials = currentUser.email.substring(0, 2).toUpperCase();
  const roleLabel = currentUser.role === 'teacher' ? '(Teacher)' : '';
  b.innerHTML = `<span class="ub-icon">${initials}</span><span>${currentUser.email} ${roleLabel}</span><button id="logoutBtn">Sign Out</button>`;
  document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut());
}

/* ═══════════════════════════════════════════
   FIRESTORE DATA HELPERS
   ═══════════════════════════════════════════ */
async function loadProgress() {
  if (!currentUser) return { tasks: {}, quiz: {} };
  try {
    const doc = await db.collection('progress').doc(currentUser.uid).get();
    return doc.exists ? doc.data() : { tasks: {}, quiz: {} };
  } catch { return { tasks: {}, quiz: {} }; }
}

async function saveTaskProgress(taskIdx, status, code) {
  if (!currentUser) return;
  const key = `tasks.${taskIdx}`;
  await db.collection('progress').doc(currentUser.uid).update({
    [key]: { status, code, time: Date.now() }
  });
}

async function saveQuizProgress(qIdx, data) {
  if (!currentUser) return;
  const key = `quiz.${qIdx}`;
  await db.collection('progress').doc(currentUser.uid).update({
    [key]: data
  });
}

// Local cache for snappy UI (synced to Firestore in background)
let progressCache = { tasks: {}, quiz: {}, feedback: {} };
async function refreshCache() {
  progressCache = await loadProgress();
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

const S = [

  // ─── 0: No Parameters ───
  { proc: {
      bannerText:'Procedure Definition',
      mainLines:[{parts:[{type:'text',value:'// Main Program'}],indent:0,dim:true},{parts:[{type:'text',value:'CALL SayHello()'}],indent:0}],
      defLines:[{parts:[{type:'text',value:'PROCEDURE SayHello()'}],indent:0},{parts:[{type:'text',value:'OUTPUT "Hello, World!"'}],indent:1},{parts:[{type:'text',value:'ENDPROCEDURE'}],indent:0}],
      paramSlots:[], output:'Hello, World!', returnPhase:false, returnChip:null, returnSlotLabel:null,
      java:'// Main\nsayHello();\n\n// Definition\npublic static void sayHello() {\n    System.out.println("Hello, World!");\n}',
      explain:'No parameters — the procedure runs the same way every time.', noInteraction:true,
      instrStart:'No parameters to pass! The procedure just runs directly.',
    },
    func: {
      bannerText:'Function Definition',
      mainLines:[{parts:[{type:'text',value:'// Main Program'}],indent:0,dim:true},{parts:[{type:'text',value:'DECLARE Greeting : STRING'}],indent:0},{parts:[{type:'text',value:'Greeting ← GetGreeting()'}],indent:0},{parts:[{type:'text',value:'OUTPUT Greeting'}],indent:0}],
      defLines:[{parts:[{type:'text',value:'FUNCTION GetGreeting() RETURNS STRING'}],indent:0},{parts:[{type:'text',value:'RETURN "Hello, World!"'}],indent:1},{parts:[{type:'text',value:'ENDFUNCTION'}],indent:0}],
      paramSlots:[], output:'Hello, World!', returnPhase:false, returnChip:null, returnSlotLabel:null,
      java:'// Main\nString greeting = getGreeting();\nSystem.out.println(greeting);\n\n// Definition\npublic static String getGreeting() {\n    return "Hello, World!";\n}',
      explain:'No parameters — but unlike a procedure, this function RETURNS a value that the main program stores in a variable.', noInteraction:true,
      instrStart:'No parameters to pass! The function returns "Hello, World!" which is stored in Greeting.',
    },
  },

  // ─── 1: One Parameter ───
  { proc: {
      bannerText:'Procedure Definition',
      mainLines:[{parts:[{type:'text',value:'// Main Program'}],indent:0,dim:true},{parts:[{type:'text',value:'Name ← "Alice"'}],indent:0},{parts:[{type:'text',value:'CALL Greet('},{type:'arg',value:'"Alice"',id:'a1'},{type:'text',value:')'}],indent:0}],
      defLines:[{parts:[{type:'text',value:'PROCEDURE Greet('},{type:'slot',id:'s1',label:'Name',correct:'"Alice"'},{type:'text',value:' : STRING)'}],indent:0},{parts:[{type:'text',value:'OUTPUT "Hello, " & Name'}],indent:1},{parts:[{type:'text',value:'ENDPROCEDURE'}],indent:0}],
      paramSlots:[{id:'s1',correct:'"Alice"'}], output:'Hello, Alice', returnPhase:false, returnChip:null, returnSlotLabel:null,
      java:'// Main\nString name = "Alice";\ngreet(name);\n\n// Definition\npublic static void greet(String name) {\n    System.out.println("Hello, " + name);\n}',
      explain:'The argument "Alice" was passed into the parameter Name. The procedure outputs directly.', noInteraction:false,
      instrStart:'Drag "Alice" from the Main Program into the Name slot in the Procedure.',
    },
    func: {
      bannerText:'Function Definition',
      mainLines:[{parts:[{type:'text',value:'// Main Program'}],indent:0,dim:true},{parts:[{type:'text',value:'DECLARE Msg : STRING'}],indent:0},{parts:[{type:'text',value:'Msg ← MakeGreeting('},{type:'arg',value:'"Alice"',id:'a1'},{type:'text',value:')'}],indent:0},{parts:[{type:'text',value:'OUTPUT Msg'}],indent:0}],
      defLines:[{parts:[{type:'text',value:'FUNCTION MakeGreeting('},{type:'slot',id:'s1',label:'Name',correct:'"Alice"'},{type:'text',value:' : STRING) RETURNS STRING'}],indent:0},{parts:[{type:'text',value:'RETURN "Hello, " & Name'}],indent:1},{parts:[{type:'text',value:'ENDFUNCTION'}],indent:0}],
      paramSlots:[{id:'s1',correct:'"Alice"'}], output:'Hello, Alice', returnPhase:true, returnChip:{label:'"Hello, Alice"',value:'"Hello, Alice"'}, returnSlotLabel:'Msg ← ',
      java:'// Main\nString msg = makeGreeting("Alice");\nSystem.out.println(msg);\n\n// Definition\npublic static String makeGreeting(String name) {\n    return "Hello, " + name;\n}',
      explain:'"Alice" was passed into Name. The function RETURNS the greeting string back to the main program.', noInteraction:false,
      instrStart:'Drag "Alice" into the Name slot. Then drag the return value back to the Main Program.',
    },
  },

  // ─── 2: Two Parameters ───
  { proc: {
      bannerText:'Procedure Definition',
      mainLines:[{parts:[{type:'text',value:'// Main Program'}],indent:0,dim:true},{parts:[{type:'text',value:'X ← 5'}],indent:0},{parts:[{type:'text',value:'Y ← 3'}],indent:0},{parts:[{type:'text',value:'CALL Add('},{type:'arg',value:'5',id:'a1'},{type:'text',value:', '},{type:'arg',value:'3',id:'a2'},{type:'text',value:')'}],indent:0}],
      defLines:[{parts:[{type:'text',value:'PROCEDURE Add('},{type:'slot',id:'s1',label:'X',correct:'5'},{type:'text',value:' : INTEGER, '},{type:'slot',id:'s2',label:'Y',correct:'3'},{type:'text',value:' : INTEGER)'}],indent:0},{parts:[{type:'text',value:'OUTPUT X + Y'}],indent:1},{parts:[{type:'text',value:'ENDPROCEDURE'}],indent:0}],
      paramSlots:[{id:'s1',correct:'5'},{id:'s2',correct:'3'}], output:'8', returnPhase:false, returnChip:null, returnSlotLabel:null,
      java:'// Main\nint x = 5, y = 3;\nadd(x, y);\n\n// Definition\npublic static void add(int x, int y) {\n    System.out.println(x + y);\n}',
      explain:'Arguments matched by position: 5 → X (1st), 3 → Y (2nd). The procedure outputs directly.', noInteraction:false,
      instrStart:'Drag 5 into X, then 3 into Y. Arguments match parameters by position.',
    },
    func: {
      bannerText:'Function Definition',
      mainLines:[{parts:[{type:'text',value:'// Main Program'}],indent:0,dim:true},{parts:[{type:'text',value:'DECLARE Result : INTEGER'}],indent:0},{parts:[{type:'text',value:'Result ← Add('},{type:'arg',value:'5',id:'a1'},{type:'text',value:', '},{type:'arg',value:'3',id:'a2'},{type:'text',value:')'}],indent:0},{parts:[{type:'text',value:'OUTPUT Result'}],indent:0}],
      defLines:[{parts:[{type:'text',value:'FUNCTION Add('},{type:'slot',id:'s1',label:'X',correct:'5'},{type:'text',value:' : INTEGER, '},{type:'slot',id:'s2',label:'Y',correct:'3'},{type:'text',value:' : INTEGER) RETURNS INTEGER'}],indent:0},{parts:[{type:'text',value:'RETURN X + Y'}],indent:1},{parts:[{type:'text',value:'ENDFUNCTION'}],indent:0}],
      paramSlots:[{id:'s1',correct:'5'},{id:'s2',correct:'3'}], output:'Result = 8', returnPhase:true, returnChip:{label:'8',value:'8'}, returnSlotLabel:'Result ← ',
      java:'// Main\nint result = add(5, 3);\nSystem.out.println(result);\n\n// Definition\npublic static int add(int x, int y) {\n    return x + y;\n}',
      explain:'5 → X, 3 → Y by position. The function RETURNS 8, which the main program stores in Result.', noInteraction:false,
      instrStart:'Drag 5 into X, then 3 into Y. Then drag the return value back to the Main Program.',
    },
  },

  // ─── 3: Return Value (function only — no variant toggle) ───
  { proc: {
      bannerText:'Function Definition',
      mainLines:[{parts:[{type:'text',value:'// Main Program'}],indent:0,dim:true},{parts:[{type:'text',value:'DECLARE Result : INTEGER'}],indent:0},{parts:[{type:'text',value:'Result ← Square('},{type:'arg',value:'4',id:'a1'},{type:'text',value:')'}],indent:0},{parts:[{type:'text',value:'OUTPUT Result'}],indent:0}],
      defLines:[{parts:[{type:'text',value:'FUNCTION Square('},{type:'slot',id:'s1',label:'Num',correct:'4'},{type:'text',value:' : INTEGER) RETURNS INTEGER'}],indent:0},{parts:[{type:'text',value:'RETURN Num * Num'}],indent:1},{parts:[{type:'text',value:'ENDFUNCTION'}],indent:0}],
      paramSlots:[{id:'s1',correct:'4'}], output:'Result = 16', returnPhase:true, returnChip:{label:'16',value:'16'}, returnSlotLabel:'Result ← ',
      java:'// Main\nint result = square(4);\nSystem.out.println(result);\n\n// Definition\npublic static int square(int num) {\n    return num * num;\n}',
      explain:'4 was passed in, 4 × 4 = 16 computed, and 16 RETURNED to the caller.', noInteraction:false,
      instrStart:'Drag 4 into Num. Then drag the return value back to the Main Program.',
    },
    func: null, // no variant — this is already a function-only demo
    singleMode: true,
  },

  // ─── 4: ByVal vs ByRef ───
  { proc: {
      bannerText:'Procedure Definition (BYREF)',
      mainLines:[{parts:[{type:'text',value:'// Main Program'}],indent:0,dim:true},{parts:[{type:'text',value:'MyNum ← 7'}],indent:0},{parts:[{type:'text',value:'CALL DoubleIt('},{type:'arg',value:'MyNum (7)',id:'a1'},{type:'text',value:')'}],indent:0},{parts:[{type:'text',value:'OUTPUT MyNum'}],indent:0}],
      defLines:[{parts:[{type:'text',value:'PROCEDURE DoubleIt(BYREF '},{type:'slot',id:'s1',label:'N',correct:'MyNum (7)'},{type:'text',value:' : INTEGER)'}],indent:0},{parts:[{type:'text',value:'N ← N * 2'}],indent:1},{parts:[{type:'text',value:'ENDPROCEDURE'}],indent:0}],
      paramSlots:[{id:'s1',correct:'MyNum (7)'}], output:'MyNum = 14  (original changed by BYREF!)', returnPhase:true, returnChip:{label:'14',value:'14'}, returnSlotLabel:'MyNum is now ← ',
      java:'// Java: use array to mimic BYREF\nint[] myNum = {7};\ndoubleIt(myNum);\nSystem.out.println(myNum[0]); // 14\n\npublic static void doubleIt(int[] arr) {\n    arr[0] = arr[0] * 2;\n}',
      explain:'BYREF passed a reference — the procedure changed the original MyNum from 7 to 14.', noInteraction:false,
      instrStart:'Drag MyNum (7) into N. BYREF means the original variable gets modified.',
    },
    func: {
      bannerText:'Function Definition (BYVAL)',
      mainLines:[{parts:[{type:'text',value:'// Main Program'}],indent:0,dim:true},{parts:[{type:'text',value:'DECLARE MyNum : INTEGER'}],indent:0},{parts:[{type:'text',value:'MyNum ← 7'}],indent:0},{parts:[{type:'text',value:'DECLARE Result : INTEGER'}],indent:0},{parts:[{type:'text',value:'Result ← DoubleIt('},{type:'arg',value:'MyNum (7)',id:'a1'},{type:'text',value:')'}],indent:0},{parts:[{type:'text',value:'OUTPUT Result'}],indent:0},{parts:[{type:'text',value:'OUTPUT MyNum'}],indent:0}],
      defLines:[{parts:[{type:'text',value:'FUNCTION DoubleIt(BYVAL '},{type:'slot',id:'s1',label:'N',correct:'MyNum (7)'},{type:'text',value:' : INTEGER) RETURNS INTEGER'}],indent:0},{parts:[{type:'text',value:'RETURN N * 2'}],indent:1},{parts:[{type:'text',value:'ENDFUNCTION'}],indent:0}],
      paramSlots:[{id:'s1',correct:'MyNum (7)'}], output:'Result = 14,  MyNum still = 7  (BYVAL — original unchanged!)', returnPhase:true, returnChip:{label:'14',value:'14'}, returnSlotLabel:'Result ← ',
      java:'// Main\nint myNum = 7;\nint result = doubleIt(myNum);\nSystem.out.println(result); // 14\nSystem.out.println(myNum);  // still 7\n\npublic static int doubleIt(int n) {\n    return n * 2;\n}',
      explain:'BYVAL passed a copy — the function returns 14 but the original MyNum stays at 7. Compare with the BYREF procedure!', noInteraction:false,
      instrStart:'Drag MyNum (7) into N. BYVAL means the function gets a copy — the original won\'t change.',
    },
  },
];

const $mainCode=document.getElementById('mainCode'),$defCode=document.getElementById('defCode'),$defBanner=document.getElementById('defBanner');
const $mainCode2=document.getElementById('mainCode2'),$defCode2=document.getElementById('defCode2'),$defBanner2=document.getElementById('defBanner2');
const $funcRowLabel=document.getElementById('funcRowLabel');
const $instr=document.getElementById('instr'),$outputStrip=document.getElementById('outputStrip'),$outputText=document.getElementById('outputText'),$toast=document.getElementById('toast');
const $bridgeRet=document.getElementById('bridgeLabelReturn'),$bridgeRet2=document.getElementById('bridgeLabelReturn2');
const $javaOverlay=document.getElementById('javaOverlay'),$javaCode=document.getElementById('javaCode'),$confetti=document.getElementById('confettiLayer');

let sc=null,scF=null; // proc and func scenarios
let filledSlots={},returnDone=false,dragVal=null;
let currentScenarioIdx=0;

function loadDemo(idx) {
  currentScenarioIdx = idx;
  const scenario = S[idx];
  sc = scenario.proc;
  scF = scenario.func;
  filledSlots={};returnDone=false;
  $outputStrip.classList.add('hidden');$javaOverlay.classList.add('hidden');
  $bridgeRet.classList.add('hidden');
  $defBanner.textContent=sc.bannerText;
  $instr.textContent=sc.instrStart;
  $toast.className='toast';$confetti.innerHTML='';
  renderMain($mainCode, sc, false, '');
  renderDef($defCode, sc, false, '');

  // Render function row
  if (scF) {
    $funcRowLabel.classList.remove('hidden');
    document.getElementById('panelLeft2').classList.remove('hidden');
    document.getElementById('flowBridge2').classList.remove('hidden');
    document.getElementById('panelRight2').classList.remove('hidden');
    $defBanner2.textContent = scF.bannerText;
    if (scF.returnPhase) $bridgeRet2.classList.remove('hidden');
    else $bridgeRet2.classList.add('hidden');
    renderMain($mainCode2, scF, false, 'f');
    renderDef($defCode2, scF, false, 'f');
  } else {
    $funcRowLabel.classList.add('hidden');
    document.getElementById('panelLeft2').classList.add('hidden');
    document.getElementById('flowBridge2').classList.add('hidden');
    document.getElementById('panelRight2').classList.add('hidden');
  }

  // Auto-complete non-interactive scenarios
  if(sc.noInteraction) setTimeout(()=>{
    $outputStrip.classList.remove('hidden');
    $outputText.textContent=sc.output;
    $instr.textContent=sc.explain;
    if(scF && scF.noInteraction){
      $outputText.textContent = sc.output;
    }
  },1200);
}

function renderMain(container, scenario, rp, prefix) {
  container.innerHTML='';
  scenario.mainLines.forEach(l=>{
    const d=document.createElement('div');
    d.className='code-line'+(l.indent?' indent-'+l.indent:'');
    l.parts.forEach(p=>{
      if(p.type==='text'){
        const s=document.createElement('span');
        s.className=l.dim?'code-comment':'code-text';
        s.textContent=p.value;
        d.appendChild(s);
      } else if(p.type==='arg'){
        const argId = prefix + p.id;
        const slotId = prefix + p.id.replace('a','s');
        d.appendChild(makeArg(p.value, argId, !!filledSlots[slotId], false, prefix));
      }
    });
    container.appendChild(d);
  });
  // Return phase slot in main
  if(rp && scenario.returnChip && !filledSlots[prefix+'ret-main']){
    const r=document.createElement('div');r.className='code-line';r.style.marginTop='.3rem';
    const l=document.createElement('span');l.className='code-text';
    l.textContent=scenario.returnSlotLabel||'Result ← ';
    r.appendChild(l);
    r.appendChild(makeSlot(prefix+'ret-main','return value',scenario.returnChip.value,true));
    container.appendChild(r);
  }
  if(filledSlots[prefix+'ret-main']){
    const r=document.createElement('div');r.className='code-line';r.style.marginTop='.3rem';
    const l=document.createElement('span');l.className='code-text';l.style.fontWeight='700';
    l.textContent=(scenario.returnSlotLabel||'Result ← ')+scenario.returnChip.label;
    r.appendChild(l);
    container.appendChild(r);
  }
}

function renderDef(container, scenario, rp, prefix) {
  container.innerHTML='';
  scenario.defLines.forEach(l=>{
    const d=document.createElement('div');
    d.className='code-line'+(l.indent?' indent-'+l.indent:'');
    l.parts.forEach(p=>{
      if(p.type==='text'){
        const s=document.createElement('span');s.className='code-text';s.textContent=p.value;d.appendChild(s);
      } else if(p.type==='slot'){
        const slotId = prefix + p.id;
        if(filledSlots[slotId]){
          const s=document.createElement('span');s.className='slot filled';
          s.textContent=p.label+' = '+filledSlots[slotId];d.appendChild(s);
        } else {
          d.appendChild(makeSlot(slotId,p.label,p.correct,false));
        }
      }
    });
    container.appendChild(d);
  });
  // Return chip in def
  if(rp && scenario.returnChip && !filledSlots[prefix+'ret-main']){
    const r=document.createElement('div');r.className='code-line';r.style.marginTop='.3rem';
    const l=document.createElement('span');l.className='code-text';l.textContent='RETURN → ';
    r.appendChild(l);
    r.appendChild(makeArg(scenario.returnChip.label, prefix+'ret-chip', false, true, prefix));
    container.appendChild(r);
  }
}

function makeArg(label,id,sent,isRet,prefix){
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
  const prefix = id.startsWith('f') ? 'f' : '';
  const scenario = prefix === 'f' ? scF : sc;
  const mainContainer = prefix === 'f' ? $mainCode2 : $mainCode;
  const defContainer = prefix === 'f' ? $defCode2 : $defCode;

  if(val===correct){
    slot.textContent=slot.textContent.split('=')[0].trim()+' = '+val;slot.classList.add('filled');filledSlots[id]=val;demoToast('','');

    const allFilled = scenario.paramSlots.every(s => filledSlots[prefix + s.id]);

    if(id===prefix+'ret-main'){
      // Return dropped in main — this row is complete
      setTimeout(()=>{
        renderMain(mainContainer, scenario, false, prefix);
        renderDef(defContainer, scenario, false, prefix);
        checkBothComplete();
      },400);
    } else if(allFilled && !scenario.returnPhase){
      // All params filled, no return — this row is done
      setTimeout(()=>{
        renderMain(mainContainer, scenario, false, prefix);
        renderDef(defContainer, scenario, false, prefix);
        checkBothComplete();
      },400);
    } else if(allFilled && scenario.returnPhase){
      // Enter return phase for this row
      setTimeout(()=>{
        if(prefix==='f') $bridgeRet2.classList.remove('hidden');
        else $bridgeRet.classList.remove('hidden');
        $instr.textContent='Now drag the return value back to the Main Program.';
        renderMain(mainContainer, scenario, true, prefix);
        renderDef(defContainer, scenario, true, prefix);
      },600);
    }
    if(!id.includes('ret')){
      setTimeout(()=>{
        renderMain(mainContainer, scenario, false, prefix);
        renderDef(defContainer, scenario, false, prefix);
      },50);
    }
  }else{slot.classList.add('wrong');demoToast('Not the right value for this slot!','err');setTimeout(()=>slot.classList.remove('wrong'),600);}
}

function checkBothComplete(){
  // Check if proc row is done
  const procDone = sc.noInteraction || (
    sc.paramSlots.every(s => filledSlots[s.id]) &&
    (!sc.returnPhase || filledSlots['ret-main'])
  );
  // Check if func row is done (or doesn't exist)
  const funcDone = !scF || scF.noInteraction || (
    scF.paramSlots.every(s => filledSlots['f'+s.id]) &&
    (!scF.returnPhase || filledSlots['fret-main'])
  );

  if(procDone && funcDone){
    $outputStrip.classList.remove('hidden');
    $outputText.textContent = sc.output;
    $instr.textContent='Both examples complete! ' + sc.explain;
    confetti($confetti);
  } else if(procDone && !funcDone){
    $instr.textContent='✓ Procedure done! Now complete the Function example below.';
  }
}
function demoToast(m,t){$toast.textContent=m;$toast.className='toast'+(t?' show '+t:'');if(m)setTimeout(()=>{$toast.className='toast';},2500);}

document.querySelectorAll('.pill').forEach(p=>{p.addEventListener('click',()=>{document.querySelectorAll('.pill').forEach(x=>x.classList.remove('active'));p.classList.add('active');loadDemo(+p.dataset.idx);});});
document.getElementById('resetBtn').addEventListener('click',()=>loadDemo(currentScenarioIdx));
document.getElementById('langBtn').addEventListener('click',()=>{
  let java = sc.java;
  if(scF) java += '\n\n─── Function Version ───\n\n' + scF.java;
  $javaCode.textContent=java;
  $javaOverlay.classList.remove('hidden');
});
document.getElementById('javaClose').addEventListener('click',()=>$javaOverlay.classList.add('hidden'));
loadDemo(0);


/* ══════════════════════════════════════════════
   LIBRARY ROUTINES & STRING HANDLING DEMOS
   ══════════════════════════════════════════════ */

const LIB_FN_INFO = {
  ROUND:  { syntax:'ROUND(Number, DecimalPlaces)', desc:'Returns <b>Number</b> rounded to <b>DecimalPlaces</b> decimal places. Returns a <b>REAL</b>.' },
  MOD:    { syntax:'MOD(Dividend, Divisor)',        desc:'Returns the <b>remainder</b> after integer division. E.g. 17 ÷ 5 = 3 remainder 2, so MOD(17,5) = <b>2</b>. Commonly used to check odd/even or divisibility.' },
  DIV:    { syntax:'DIV(Dividend, Divisor)',        desc:'Returns the <b>integer quotient</b> — the whole-number part of division, discarding any remainder. Returns an <b>INTEGER</b>.' },
  RANDOM: { syntax:'RANDOM()',                      desc:'Returns a random <b>REAL</b> number where 0 ≤ x ≤ 1 (both 0 and 1 are possible). Multiply and use DIV() to generate integers in a range.' },
};
const STR_FN_INFO = {
  UCASE:     { syntax:'UCASE(String)',                    desc:'Converts all letters in <b>String</b> to <b>UPPERCASE</b>. Digits, spaces, and punctuation are unchanged. Returns a <b>STRING</b>.' },
  LCASE:     { syntax:'LCASE(String)',                    desc:'Converts all letters in <b>String</b> to <b>lowercase</b>. Digits, spaces, and punctuation are unchanged. Returns a <b>STRING</b>.' },
  LENGTH:    { syntax:'LENGTH(String)',                   desc:'Returns the <b>number of characters</b> in <b>String</b>, including spaces and punctuation. Returns an <b>INTEGER</b>.' },
  SUBSTRING: { syntax:'SUBSTRING(String, Start, Length)', desc:'Returns a portion of <b>String</b> starting at position <b>Start</b> (positions are <b>1-indexed</b>), taking <b>Length</b> characters. Returns a <b>STRING</b>.' },
};

const LIB_EXERCISES = [
  {fn:'ROUND',  call:'ROUND(3.7, 0)',   answer:'4',       opts:['4','3','3.7','4.7'],        hint:'3.7 is closer to 4 than to 3, so it rounds <b>up</b> to 4.'},
  {fn:'ROUND',  call:'ROUND(3.456, 2)', answer:'3.46',    opts:['3.46','3.45','3.4','3.5'],  hint:'The 3rd decimal is 6 (≥ 5), so the 2nd decimal rounds up: <b>3.46</b>.'},
  {fn:'ROUND',  call:'ROUND(2.5, 0)',   answer:'3',       opts:['3','2','2.5','3.5'],        hint:'Exactly .5 always rounds <b>up</b> by convention → 3.'},
  {fn:'MOD',    call:'MOD(17, 5)',      answer:'2',       opts:['2','3','5','12'],           hint:'17 = 3 × 5 + <b>2</b>. MOD gives the <b>remainder</b>.'},
  {fn:'MOD',    call:'MOD(20, 4)',      answer:'0',       opts:['0','4','5','2'],            hint:'20 ÷ 4 = 5 with <b>no remainder</b>. MOD = 0. Tip: MOD(n,2)=0 means n is even!'},
  {fn:'MOD',    call:'MOD(9, 2)',       answer:'1',       opts:['1','4','0','2'],            hint:'9 = 4 × 2 + <b>1</b>. MOD(9,2) ≠ 0, so 9 is <b>odd</b>.'},
  {fn:'DIV',    call:'DIV(17, 5)',      answer:'3',       opts:['3','4','2','3.4'],          hint:'17 ÷ 5 = 3.4. DIV discards the decimal part → <b>3</b>.'},
  {fn:'DIV',    call:'DIV(7, 2)',       answer:'3',       opts:['3','3.5','4','2'],          hint:'7 ÷ 2 = 3.5. DIV truncates the .5 → <b>3</b>.'},
  {fn:'DIV',    call:'DIV(20, 4)',      answer:'5',       opts:['5','4','6','80'],           hint:'20 ÷ 4 = 5 exactly — no decimal to discard. DIV = <b>5</b>.'},
  {fn:'RANDOM', call:'TYPE returned by RANDOM()', answer:'REAL',    opts:['REAL','INTEGER','STRING','BOOLEAN'], hint:'RANDOM() always returns a <b>REAL</b> value, e.g. 0.4821. Use DIV to convert to INTEGER.'},
  {fn:'RANDOM', call:'Range of RANDOM()',          answer:'0 to 1',  opts:['0 to <1','0 to 1','1 to 10','-1 to 1'], hint:'RANDOM() can return both 0 and 1. Range is 0 ≤ x ≤ 1.'},
];

const STR_EXERCISES = [
  {fn:'UCASE',     call:'UCASE("hello")',              answer:'"HELLO"',      opts:['"HELLO"','"Hello"','"HELL0"','"hello"'],        hint:'UCASE converts <b>every letter</b> to uppercase. Digits and spaces are unchanged.'},
  {fn:'UCASE',     call:'UCASE("igcse 0478")',         answer:'"IGCSE 0478"', opts:['"IGCSE 0478"','"Igcse 0478"','"IGCSE0478"','"igcse 0478"'], hint:'Letters → uppercase; the <b>space and digits</b> stay exactly as they are.'},
  {fn:'LCASE',     call:'LCASE("WORLD")',              answer:'"world"',      opts:['"world"','"World"','"WORLD"','"w0rld"'],         hint:'LCASE converts every letter to <b>lowercase</b>.'},
  {fn:'LCASE',     call:'LCASE("CGA School")',         answer:'"cga school"', opts:['"cga school"','"cGA School"','"CGA school"','"cga School"'], hint:'<b>All</b> letters become lowercase — including the capital S in School.'},
  {fn:'LENGTH',    call:'LENGTH("Cambridge")',          answer:'9',            opts:['9','8','10','7'],                               hint:'C·a·m·b·r·i·d·g·e — count them: <b>9</b> characters.'},
  {fn:'LENGTH',    call:'LENGTH("Hello World")',        answer:'11',           opts:['11','10','12','9'],                             hint:'Don\'t forget the <b>space</b>! H·e·l·l·o·[sp]·W·o·r·l·d = <b>11</b>.'},
  {fn:'LENGTH',    call:'LENGTH("IGCSE")',              answer:'5',            opts:['5','4','6','3'],                               hint:'I·G·C·S·E = <b>5</b> characters.'},
  {fn:'SUBSTRING', call:'SUBSTRING("Hello", 1, 3)',    answer:'"Hel"',        opts:['"Hel"','"ell"','"He"','"Helo"'],               hint:'Start at position <b>1</b> (H), take <b>3</b> chars: H·e·l.'},
  {fn:'SUBSTRING', call:'SUBSTRING("Computer", 3, 5)', answer:'"mpute"',      opts:['"mpute"','"omput"','"mput"','"mputer"'],        hint:'C=1, o=2, <b>m=3</b>. Take 5 chars: m·p·u·t·e.'},
  {fn:'SUBSTRING', call:'SUBSTRING("Pseudocode", 7, 4)',answer:'"code"',      opts:['"code"','"ocod"','"Code"','"doco"'],            hint:'P=1 s=2 e=3 u=4 d=5 o=6 <b>c=7</b>. Take 4: c·o·d·e.'},
];

const libState = { fn:null, exIdx:0, solved:false };
const strState = { fn:null, exIdx:0, solved:false };
let libDragVal = null;

function renderLibSection(section) {
  const isLib = section === 'library';
  const shell = document.getElementById(isLib ? 'libShell' : 'strShell');
  if (!shell) return;
  const exercises = isLib ? LIB_EXERCISES : STR_EXERCISES;
  const fnInfo    = isLib ? LIB_FN_INFO   : STR_FN_INFO;
  const state     = isLib ? libState       : strState;
  const allFns    = Object.keys(fnInfo);
  if (!state.fn) state.fn = allFns[0];

  const fnExs  = exercises.filter(e => e.fn === state.fn);
  if (state.exIdx >= fnExs.length) state.exIdx = 0;
  const ex     = fnExs[state.exIdx];
  const info   = fnInfo[state.fn];
  const total  = fnExs.length;
  const isLast = state.exIdx === total - 1;

  // Shuffle options for display
  const opts = [...ex.opts].sort(() => Math.random() - 0.5);

  shell.innerHTML = `
    <div class="lib-demo">
      <div class="lib-topstrip">
        ${allFns.map(fn => `<button class="lib-tab${state.fn===fn?' active':''}" data-fn="${fn}" data-sec="${section}">${fn}</button>`).join('')}
      </div>
      <div class="lib-content">
        <div class="lib-syntax-card">
          <div class="lib-syntax-row">
            <span class="lib-syntax-tag">SYNTAX</span>
            <code class="lib-syntax-code">${info.syntax}</code>
          </div>
          <p class="lib-syntax-desc">${info.desc}</p>
        </div>
        <div class="lib-exercise-card">
          <div class="lib-ex-header">
            <span class="lib-ex-num">Exercise ${state.exIdx+1} of ${total}</span>
            <div class="lib-ex-dots">${[...Array(total).keys()].map(i=>`<span class="lib-ex-dot${i===state.exIdx?' current':i<state.exIdx?' done':''}"></span>`).join('')}</div>
          </div>
          <p class="lib-ex-question">What does this return?</p>
          <div class="lib-call-row">
            <code class="lib-call-code">${ex.call}</code>
            <span class="lib-arrow">→</span>
            <span class="lib-result-slot${state.solved?' filled':''}" id="libSlot_${section}" data-correct="${ex.answer.replace(/"/g,'&quot;')}" data-sec="${section}">${state.solved ? ex.answer : 'drop here'}</span>
          </div>
          <div class="lib-answer-bank">${state.solved ? '' : opts.map(o=>`<span class="lib-chip" draggable="true" data-val="${o.replace(/"/g,'&quot;')}">${o}</span>`).join('')}</div>
          <div class="lib-hint${state.solved?'':' hidden'}">💡 ${ex.hint}</div>
          <div class="lib-ex-footer">
            ${state.exIdx > 0 ? `<button class="btn-sm lib-prev" data-sec="${section}">← Back</button>` : '<span></span>'}
            ${state.solved && !isLast ? `<button class="btn-accent btn-sm lib-next" data-sec="${section}">Next →</button>` : ''}
            ${state.solved && isLast  ? `<button class="btn-sm lib-restart" data-sec="${section}">↻ Try again</button>` : ''}
          </div>
        </div>
      </div>
    </div>`;

  // Chip drag events
  shell.querySelectorAll('.lib-chip').forEach(chip => {
    chip.addEventListener('dragstart', e => {
      libDragVal = chip.dataset.val;
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', libDragVal); } catch { /* browser fallback */ }
      chip.classList.add('dragging');
    });
    chip.addEventListener('dragend', () => { chip.classList.remove('dragging'); libDragVal = null; });
    let libClone = null;
    chip.addEventListener('touchstart', e => {
      libDragVal = chip.dataset.val;
      const t = e.touches[0];
      libClone = chip.cloneNode(true);
      libClone.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;opacity:.85;transform:scale(1.1)';
      libClone.style.left = (t.clientX-40)+'px'; libClone.style.top = (t.clientY-20)+'px';
      document.body.appendChild(libClone); chip.classList.add('dragging');
    },{passive:true});
    chip.addEventListener('touchmove', e => {
      if (!libClone) return;
      const t = e.touches[0];
      libClone.style.left = (t.clientX-40)+'px'; libClone.style.top = (t.clientY-20)+'px';
      const slot = document.getElementById('libSlot_'+section);
      if (slot) { const r=slot.getBoundingClientRect(); slot.classList.toggle('drag-over',t.clientX>=r.left&&t.clientX<=r.right&&t.clientY>=r.top&&t.clientY<=r.bottom); }
      e.preventDefault();
    },{passive:false});
    chip.addEventListener('touchend', e => {
      if (libClone) { libClone.remove(); libClone=null; } chip.classList.remove('dragging');
      const t = e.changedTouches[0];
      const slot = document.getElementById('libSlot_'+section);
      if (slot) { slot.classList.remove('drag-over'); const r=slot.getBoundingClientRect(); if(t.clientX>=r.left&&t.clientX<=r.right&&t.clientY>=r.top&&t.clientY<=r.bottom) handleLibDrop(section,libDragVal); }
      libDragVal = null;
    });
  });

  // Slot drop events
  const slot = document.getElementById('libSlot_'+section);
  if (slot) {
    slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('drag-over'); });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
    slot.addEventListener('drop', e => { e.preventDefault(); slot.classList.remove('drag-over'); handleLibDrop(section, libDragVal||e.dataTransfer.getData('text/plain')); });
  }

  // Tab buttons
  shell.querySelectorAll('.lib-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const st = btn.dataset.sec==='library' ? libState : strState;
      st.fn=btn.dataset.fn; st.exIdx=0; st.solved=false;
      renderLibSection(btn.dataset.sec);
    });
  });

  // Next / Back / Restart
  shell.querySelector('.lib-next')?.addEventListener('click', () => {
    const st = section==='library' ? libState : strState;
    st.exIdx++; st.solved=false; renderLibSection(section);
  });
  shell.querySelector('.lib-prev')?.addEventListener('click', () => {
    const st = section==='library' ? libState : strState;
    st.exIdx--; st.solved=false; renderLibSection(section);
  });
  shell.querySelector('.lib-restart')?.addEventListener('click', () => {
    const st = section==='library' ? libState : strState;
    st.exIdx=0; st.solved=false; renderLibSection(section);
  });
}

function handleLibDrop(section, val) {
  if (!val) return;
  const slot = document.getElementById('libSlot_'+section);
  if (!slot || slot.classList.contains('filled')) return;
  const correct = slot.dataset.correct;
  const state   = section==='library' ? libState : strState;
  if (val===correct) {
    state.solved = true;
    renderLibSection(section);
    const fnExs = (section==='library' ? LIB_EXERCISES : STR_EXERCISES).filter(e=>e.fn===state.fn);
    if (state.exIdx===fnExs.length-1) {
      const cel=document.createElement('div'); cel.className='confetti-layer'; document.body.appendChild(cel);
      confetti(cel); setTimeout(()=>cel.remove(),3000);
    }
  } else {
    slot.classList.add('wrong');
    slot.textContent = val+' ✗';
    setTimeout(()=>{ slot.classList.remove('wrong'); slot.textContent='drop here'; },700);
  }
}


/* ══════════════════════════════════════════════
   ANALYTICS
   ══════════════════════════════════════════════ */

function renderAnalytics(students) {
  const el = document.getElementById('anlContent');
  if (!el) return;
  if (!students.length) {
    el.innerHTML = '<p class="anl-empty">No student data yet — refresh the Dashboard first.</p>';
    return;
  }
  el.innerHTML = [
    anlIntervention(students),
    anlTaskDifficulty(students),
    anlMissingKeywords(students),
    anlQuizDifficulty(students),
    anlProgressTime(students),
  ].join('');
}

function anlPanel(title, body) {
  return `<div class="anl-panel"><div class="anl-panel-title">${title}</div>${body}</div>`;
}

/* ── 1. Intervention alerts ── */
function anlIntervention(students) {
  const notStarted = students.filter(s =>
    !Object.values(s.tasks).some(t => t.status === 'done' || t.status === 'started')
  );
  const struggling = students.filter(s => {
    const vals = Object.values(s.tasks);
    const attempted = vals.filter(t => t.status === 'done' || t.status === 'started').length;
    const done = vals.filter(t => t.status === 'done').length;
    return attempted >= 3 && done / attempted < 0.3;
  });
  const noQuiz = students.filter(s => {
    const hasDone = Object.values(s.tasks).some(t => t.status === 'done');
    const hasQuiz = Object.values(s.quiz).some(q => (q.attempts || 0) > 0);
    return hasDone && !hasQuiz;
  });

  if (!notStarted.length && !struggling.length && !noQuiz.length) {
    return anlPanel('Students Needing Attention', '<p class="anl-ok">No alerts — all students are progressing well.</p>');
  }

  const group = (label, cls, list) => list.length ? `
    <div class="anl-alert-group">
      <div class="anl-alert-label ${cls}">${label}</div>
      <div class="anl-alert-chips">${list.map(s => `<span class="anl-chip">${s.email}</span>`).join('')}</div>
    </div>` : '';

  return anlPanel('Students Needing Attention',
    group('Not started any tasks', 'anl-alert-red', notStarted) +
    group('Attempting tasks but rarely completing them', 'anl-alert-orange', struggling) +
    group('Completed tasks but haven\'t attempted the quiz', 'anl-alert-blue', noQuiz)
  );
}

/* ── 2. Task completion rates ── */
function anlTaskDifficulty(students) {
  const n = students.length;
  const rows = tasks.map((t, i) => {
    const done    = students.filter(s => s.tasks[i]?.status === 'done').length;
    const started = students.filter(s => s.tasks[i]?.status === 'started').length;
    const none    = n - done - started;
    const stuckRatio = (done + started) > 0 ? started / (done + started) : 0;
    const stuckFlag  = stuckRatio >= 0.5 && started >= 2 ? '<span class="anl-stuck-flag">high drop-off</span>' : '';
    return `<div class="anl-task-row">
      <div class="anl-task-label" title="${t.t}">T${i+1} <span class="anl-task-name">${t.t}</span>${stuckFlag}</div>
      <div class="anl-stack-bar">
        ${done    ? `<div class="anl-bar-done"    style="flex:${done}"    title="${done} done"></div>`    : ''}
        ${started ? `<div class="anl-bar-started" style="flex:${started}" title="${started} in progress"></div>` : ''}
        ${none    ? `<div class="anl-bar-none"    style="flex:${none}"    title="${none} not started"></div>`  : ''}
      </div>
      <div class="anl-task-pct">${Math.round(done/n*100)}%</div>
    </div>`;
  }).join('');

  const legend = `<div class="anl-legend">
    <span class="anl-leg anl-leg-done">Done</span>
    <span class="anl-leg anl-leg-started">In progress</span>
    <span class="anl-leg anl-leg-none">Not started</span>
  </div>`;

  return anlPanel('Task Completion Rates', legend + '<div class="anl-task-list">' + rows + '</div>');
}

/* ── 3. Common misconceptions ── */
function anlMissingKeywords(students) {
  const taskData = tasks.map((t, i) => {
    const missCounts = {};
    let withCode = 0;
    students.forEach(s => {
      const code = s.tasks[i]?.code;
      if (!code) return;
      withCode++;
      const pseudo = scoreKeys(code, t.pseudoKeys, false);
      const java   = scoreKeys(code, t.javaKeys,   true);
      const missed = (pseudo.pct >= java.pct ? pseudo : java).missed;
      missed.forEach(k => { missCounts[k] = (missCounts[k] || 0) + 1; });
    });
    const topMisses = Object.entries(missCounts)
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return { name: t.t, idx: i, topMisses, withCode };
  }).filter(d => d.topMisses.length);

  if (!taskData.length) {
    return anlPanel('Common Misconceptions by Task', '<p class="anl-ok">Not enough data yet — students need to attempt more tasks.</p>');
  }

  const rows = taskData.map(d => {
    const chips = d.topMisses.map(([k, c]) =>
      `<span class="anl-kw-chip"><code>${k}</code><span class="anl-kw-count">${c}/${d.withCode}</span></span>`
    ).join('');
    return `<div class="anl-kw-row">
      <div class="anl-kw-task">T${d.idx+1} — ${d.name}</div>
      <div class="anl-kw-chips">${chips}</div>
    </div>`;
  }).join('');

  return anlPanel('Common Misconceptions by Task',
    '<p class="anl-sub">Keywords most frequently missing from student responses (min. 2 students)</p>' +
    '<div class="anl-kw-list">' + rows + '</div>'
  );
}

/* ── 4. Quiz question difficulty ── */
function anlQuizDifficulty(students) {
  const qData = quiz.map((q, i) => {
    let correct = 0, totalAttempts = 0, attempted = 0;
    students.forEach(s => {
      const d = s.quiz[i];
      if (!d || !(d.attempts > 0)) return;
      attempted++;
      if (d.status === 'correct') correct++;
      totalAttempts += d.attempts || 0;
    });
    const pct = attempted ? Math.round(correct / attempted * 100) : null;
    const avgAtt = attempted ? (totalAttempts / attempted).toFixed(1) : null;
    return { idx: i, q: q.q, pct, avgAtt, attempted };
  }).filter(d => d.attempted > 0)
    .sort((a, b) => a.pct - b.pct);

  if (!qData.length) {
    return anlPanel('Quiz Question Difficulty', '<p class="anl-ok">No quiz attempts recorded yet.</p>');
  }

  const rows = qData.map(d => {
    const cls = d.pct >= 75 ? 'anl-q-strong' : d.pct >= 40 ? 'anl-q-mid' : 'anl-q-weak';
    const barW = d.pct ?? 0;
    // Strip HTML tags from question for plain display
    const qText = d.q.replace(/<[^>]+>/g, '');
    return `<div class="anl-q-row">
      <div class="anl-q-num">Q${d.idx+1}</div>
      <div class="anl-q-text" title="${qText}">${qText}</div>
      <div class="anl-q-bar-wrap"><div class="anl-q-bar ${cls}" style="width:${barW}%"></div></div>
      <div class="anl-q-pct ${cls}">${d.pct}%</div>
      <div class="anl-q-att">avg ${d.avgAtt} attempt${d.avgAtt==1?'':'s'}</div>
    </div>`;
  }).join('');

  return anlPanel('Quiz Question Difficulty',
    '<p class="anl-sub">Sorted by lowest score first. Based on students who have attempted each question.</p>' +
    '<div class="anl-q-list">' + rows + '</div>'
  );
}

/* ── 5. Progress over time ── */
function anlProgressTime(students) {
  const dayCounts = {};
  students.forEach(s => {
    Object.values(s.tasks).forEach(t => {
      if (!t.time) return;
      const day = new Date(t.time).toLocaleDateString('en-NZ', { day:'numeric', month:'short' });
      const key = new Date(t.time).toISOString().slice(0, 10);
      dayCounts[key] = dayCounts[key] || { label: day, count: 0 };
      dayCounts[key].count++;
    });
  });

  const entries = Object.entries(dayCounts).sort((a, b) => a[0].localeCompare(b[0]));
  if (!entries.length) {
    return anlPanel('Progress Over Time', '<p class="anl-ok">No timestamped data yet.</p>');
  }

  const max = Math.max(...entries.map(([, v]) => v.count));
  const bars = entries.map(([, v]) => {
    const h = Math.round(v.count / max * 100);
    return `<div class="anl-time-col">
      <div class="anl-time-bar-wrap">
        <div class="anl-time-count">${v.count}</div>
        <div class="anl-time-bar" style="height:${h}%"></div>
      </div>
      <div class="anl-time-label">${v.label}</div>
    </div>`;
  }).join('');

  return anlPanel('Progress Over Time',
    '<p class="anl-sub">Number of task submissions (done or in progress) per day.</p>' +
    '<div class="anl-time-chart">' + bars + '</div>'
  );
}

/* ══════════════════════════════════════════════
   QUIZ — students type answers, get feedback
   ══════════════════════════════════════════════ */
const quiz = [
  { q:'Explain the difference between a <b>procedure</b> and a <b>function</b>.', keys:['procedure','function','return','value','void'], concepts:[{term:'procedure does not return',weight:2},{term:'function returns',weight:2},{term:'void',weight:1}], model:'A <b>procedure</b> performs actions but does <b>not return a value</b>. A <b>function</b> performs actions and <b>returns a value</b> that can be stored or used in an expression. In Java, a procedure is a <code>void</code> method.' },
  { q:'What is a <b>parameter</b>? How is it different from an <b>argument</b>?', keys:['parameter','argument','definition','call','placeholder','value','passed'], concepts:[{term:'parameter.*definition',weight:2},{term:'argument.*call',weight:2},{term:'placeholder',weight:1}], model:'A <b>parameter</b> is the placeholder variable in the function/procedure <b>definition</b>. An <b>argument</b> is the actual value <b>passed in the call</b>. Parameters are defined; arguments are supplied.' },
  { q:'Why is it better to use parameters instead of global variables inside a procedure?', keys:['reusable','modular','different','values','debug','test','maintain'], concepts:[{term:'reusab',weight:2},{term:'modular',weight:2},{term:'different values',weight:1},{term:'debug|test|maintain',weight:1}], model:'Parameters make code <b>reusable</b> and <b>modular</b>. The procedure can work with <b>different values</b> each time it is called, and is easier to test, debug, and maintain.' },
  { q:'If <code>CalculateArea(5, 10)</code> calls <code>PROCEDURE CalculateArea(Length, Width)</code>, what value does <code>Width</code> hold and why?', keys:['10','width','position','second','first','order'], concepts:[{term:'10',weight:2},{term:'position',weight:2},{term:'second',weight:1}], model:'<code>Width = 10</code>. Arguments are matched to parameters <b>by position</b>: the first argument (5) goes to Length, the <b>second</b> argument (10) goes to Width.' },
  { q:'Explain what <b>BYVAL</b> (by value) means when passing a parameter. Give an example of when you would use it.', keys:['copy','original','not','change','affect','safe','read'], concepts:[{term:'copy',weight:3},{term:'not.*change|not.*affect|original.*same',weight:2}], model:'<b>BYVAL</b> means a <b>copy</b> of the argument is passed. Changes inside the procedure do <b>not affect the original</b> variable. Use it when you only need to read a value without modifying it.' },
  { q:'Explain what <b>BYREF</b> (by reference) means. When would you use it?', keys:['reference','original','change','affect','modify','swap','update'], concepts:[{term:'reference',weight:2},{term:'original.*change|change.*original|affect.*original',weight:3},{term:'swap|update',weight:1}], model:'<b>BYREF</b> means the procedure receives a <b>reference to the original variable</b>. Changes inside the procedure <b>do affect</b> the original. Useful when the procedure needs to modify the caller\'s variable, e.g. a <b>Swap</b> procedure.' },
  { q:'What does <code>Result ← Triple(Triple(2))</code> evaluate to, if the function <code>Triple</code> returns <code>N * 3</code>? Explain your working.', keys:['6','18','triple','inner','outer','first'], concepts:[{term:'6',weight:2},{term:'18',weight:3},{term:'inner|first|Triple\\(2\\)',weight:1}], model:'First, the inner call: <code>Triple(2) = 6</code>. Then the outer call: <code>Triple(6) = 18</code>. So <b>Result = 18</b>. A function\'s return value can be used as an argument to another call.' },
  { q:'What happens if you call a procedure with the <b>wrong number of arguments</b>? Why?', keys:['error','match','number','count','parameter','expect'], concepts:[{term:'error',weight:3},{term:'match|must match',weight:2},{term:'number.*parameter|count',weight:1}], model:'You get an <b>error</b>. The number of arguments in the call <b>must exactly match</b> the number of parameters in the definition.' },
  { q:'What is a <b>local variable</b>? How does it relate to parameters?', keys:['local','inside','procedure','function','created','destroyed','parameter','exist'], concepts:[{term:'inside.*procedure|inside.*function|only.*inside',weight:2},{term:'created.*call|destroyed.*end|exist.*inside',weight:2},{term:'parameter.*local',weight:1}], model:'A <b>local variable</b> exists only <b>inside</b> the procedure/function. Parameters behave like local variables — they are <b>created when called</b> and <b>destroyed when it ends</b>, so they don\'t clash with variables of the same name elsewhere.' },
  { q:'Why is it considered good practice to use <b>meaningful parameter names</b>? Give an example.', keys:['self','document','clear','understand','readable','length','width','meaningful'], concepts:[{term:'self.document|readab|clear|understand',weight:2},{term:'Length|Width|example',weight:2}], model:'Meaningful names make code <b>self-documenting</b>. <code>CalculateArea(Length, Width)</code> is immediately clear, while <code>CalculateArea(A, B)</code> requires the reader to guess what A and B represent.' },
  { q:'Can a function call another function? Write a short pseudocode example to support your answer.', keys:['yes','function','call','return','another','inside'], concepts:[{term:'yes',weight:1},{term:'FUNCTION|RETURN',weight:2},{term:'call.*another|function.*call.*function',weight:2}], model:'<b>Yes.</b> For example: <code>FUNCTION FinalBill(Price, Qty) RETURNS REAL</code> could contain <code>RETURN AddTax(Price * Qty)</code> — calling <code>AddTax</code> from inside <code>FinalBill</code>.' },
  { q:'What is the return type of this function and why?<pre>FUNCTION IsEven(N : INTEGER) RETURNS ???\n    RETURN (N MOD 2 = 0)\nENDFUNCTION</pre>', keys:['boolean','true','false','mod','condition','expression'], concepts:[{term:'BOOLEAN',weight:3},{term:'TRUE|FALSE',weight:2},{term:'condition|expression|MOD',weight:1}], model:'The return type is <b>BOOLEAN</b>. The expression <code>N MOD 2 = 0</code> evaluates to either <b>TRUE</b> or <b>FALSE</b>.' },

  // ── Drag-and-drop questions (Q13–Q20) ──────────────────────────────────────

  { type:'match', q:'<b>Match</b> each term on the left to its correct definition.',
    pairs:[
      { term:'Parameter',  def:'A named variable in the procedure or function definition' },
      { term:'Argument',   def:'The actual value passed when calling a module' },
      { term:'RETURN',     def:'Sends a value back from a function to the calling code' },
      { term:'BYREF',      def:'The parameter is a reference to the original variable' },
    ],
    model:'<b>Parameter</b> = placeholder in the definition; <b>Argument</b> = value at the call; <b>RETURN</b> = sends value back; <b>BYREF</b> = passes reference so changes affect the original.' },

  { type:'fill', q:'Drag the correct keywords to complete this <b>procedure definition</b>.',
    code:'PROCEDURE Greet(Name : {{0}})\n    OUTPUT "Hello, " & Name\n{{1}}',
    bank:['STRING','ENDPROCEDURE','FUNCTION','INTEGER','ENDFUNCTION'],
    answers:{ 0:'STRING', 1:'ENDPROCEDURE' },
    model:'<code>STRING</code> is the correct data type for a text parameter. The procedure ends with <code>ENDPROCEDURE</code> — not ENDFUNCTION, which closes a function.' },

  { type:'categorise', q:'<b>Sort</b> each description into the correct category.',
    buckets:['Procedure','Function'],
    items:[
      { text:'Does not return a value',            bucket:0 },
      { text:'Returns a value using RETURN',       bucket:1 },
      { text:'Called using the CALL keyword',      bucket:0 },
      { text:'Result can be stored in a variable', bucket:1 },
      { text:'Useful for actions like printing',   bucket:0 },
      { text:'Header includes RETURNS keyword',    bucket:1 },
    ],
    model:'<b>Procedures</b>: perform actions, no return value, called with CALL. <b>Functions</b>: always return a value, used in expressions, header declares the return type with RETURNS.' },

  { type:'fill', q:'Drag the correct keywords to complete this <b>function definition</b>.',
    code:'FUNCTION Square(N : INTEGER) {{0}} INTEGER\n    {{1}} N * N\n{{2}}',
    bank:['RETURNS','RETURN','ENDFUNCTION','FUNCTION','ENDPROCEDURE','PROCEDURE'],
    answers:{ 0:'RETURNS', 1:'RETURN', 2:'ENDFUNCTION' },
    model:'<code>RETURNS INTEGER</code> declares the return type in the header. <code>RETURN N * N</code> sends the result back to the caller. The function closes with <code>ENDFUNCTION</code>.' },

  { type:'match', q:'The function <code>Triple(N)</code> returns <code>N × 3</code>. <b>Match</b> each call to its return value.',
    pairs:[
      { term:'Triple(4)',          def:'12' },
      { term:'Triple(10)',         def:'30' },
      { term:'Triple(Triple(2))',  def:'18' },
      { term:'Triple(0)',          def:'0'  },
    ],
    model:'<code>Triple(4)=12</code>, <code>Triple(10)=30</code>. For <code>Triple(Triple(2))</code>: inner call gives 6, outer call gives <b>18</b>. <code>Triple(0)=0</code>.' },

  { type:'categorise', q:'<b>Sort</b> each statement about variables into the correct category.',
    buckets:['Local to a module','Global to the program'],
    items:[
      { text:'Exists only while the module is running',        bucket:0 },
      { text:'Accessible from anywhere in the program',        bucket:1 },
      { text:'Parameters behave like these',                   bucket:0 },
      { text:'Can cause unexpected side-effects if modified',  bucket:1 },
      { text:'Created when the module is called',              bucket:0 },
      { text:'Declared outside any procedure or function',     bucket:1 },
    ],
    model:'<b>Local</b> variables exist only inside a module — parameters are local variables. <b>Global</b> variables persist throughout the program and can cause unintended side-effects.' },

  { type:'fill', q:'Drag the correct keywords to complete this <b>BYREF Swap procedure</b>.',
    code:'PROCEDURE Swap({{0}} A : INTEGER, {{1}} B : INTEGER)\n    DECLARE Temp : INTEGER\n    Temp ← A\n    A ← B\n    B ← {{2}}\nENDPROCEDURE',
    bank:['BYREF','BYVAL','Temp','A','B'],
    answers:{ 0:'BYREF', 1:'BYREF', 2:'Temp' },
    model:'Both parameters need <code>BYREF</code> so the procedure can modify the caller\'s original variables. <code>Temp</code> holds A\'s original value so it isn\'t lost when A is overwritten.' },

  { type:'match', q:'<b>Match</b> each error to its most likely cause.',
    pairs:[
      { term:'Type mismatch',           def:'Passing a STRING where an INTEGER parameter is expected' },
      { term:'Wrong argument count',    def:'Calling a procedure with 3 arguments when it has 2 parameters' },
      { term:'Variable not accessible', def:'Using a local variable outside the module that declared it' },
      { term:'Missing return value',    def:'Defining a FUNCTION without a RETURN statement' },
    ],
    model:'Types must match; argument count must equal parameter count; local variables exist only inside their module; a FUNCTION must always return a value.' },
];

let curQ = 0;

// ── DD quiz state ─────────────────────────────────────────────────────────────
const quizDDState = {};   // { qIdx: { slotKey: placedValue } }
let quizDDSelected = null; // chip value currently held (click-to-place mode)

function escH(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getQuizData() { return progressCache.quiz || {}; }

function renderQuizNav() {
  const nav = document.getElementById('quizNav');
  nav.innerHTML = '';
  const data = getQuizData();
  let totalCorrect = 0, totalAttempts = 0;
  quiz.forEach((q, i) => {
    const d = data[i];
    const btn = document.createElement('button');
    btn.className = 'quiz-side-btn' + (i === curQ ? ' active' : '');
    let icon = '';
    if (d) {
      totalAttempts += d.attempts || 0;
      if (d.status === 'correct') { icon = ' ✓'; totalCorrect++; }
      else if (d.status === 'partial') icon = ' ●';
      else icon = ' ○';
    }
    btn.innerHTML = `<span style="opacity:.5">${i + 1}.</span> Q${i + 1}<span class="qs-icon">${icon}</span>`;
    btn.addEventListener('click', () => { curQ = i; renderQuiz(); });
    nav.appendChild(btn);
  });
  document.getElementById('quizScoreNum').textContent = totalCorrect + ' / ' + quiz.length;
  document.getElementById('quizAttempts').textContent = 'Total attempts: ' + totalAttempts;
}

function renderQuiz() {
  const q = quiz[curQ];
  const data = getQuizData();
  const saved = data[curQ];

  document.getElementById('quizQNum').textContent = curQ + 1;
  document.getElementById('quizQBody').innerHTML = q.q;
  document.getElementById('quizPos').textContent = (curQ + 1) + ' / ' + quiz.length;
  document.getElementById('quizPrev').disabled = curQ === 0;
  document.getElementById('quizNext').disabled = curQ === quiz.length - 1;

  const isDd = q.type === 'fill' || q.type === 'match' || q.type === 'categorise';
  document.getElementById('quizDDArea').classList.toggle('hidden', !isDd);
  document.getElementById('quizDDSubmitWrap').classList.toggle('hidden', !isDd);
  document.querySelector('.quiz-answer-area').classList.toggle('hidden', isDd);

  if (isDd) {
    // Restore saved placements into state if first visit after submit
    if (saved?.placements && !quizDDState[curQ]) {
      quizDDState[curQ] = Object.assign({}, saved.placements);
    }
    document.getElementById('quizDDAttemptInfo').textContent = saved?.attempts ? 'Attempts: ' + saved.attempts : '';
    renderQuizDDContent(curQ);
  } else {
    const input = document.getElementById('quizInput');
    input.value = saved?.answer || '';
    document.getElementById('quizAttemptInfo').textContent = saved?.attempts ? 'Attempts: ' + saved.attempts : '';
    const fb = document.getElementById('quizFeedback');
    if (saved?.feedback) {
      fb.innerHTML = saved.feedback;
      fb.className = 'quiz-feedback ' + (saved.status === 'correct' ? 'qf-correct' : saved.status === 'partial' ? 'qf-partial' : 'qf-wrong');
      fb.classList.remove('hidden');
    } else {
      fb.classList.add('hidden');
      fb.className = 'quiz-feedback hidden';
    }
  }
  renderQuizNav();
}

// ── DD Quiz Rendering ─────────────────────────────────────────────────────────

function renderQuizDDContent(qIdx) {
  const q = quiz[qIdx];
  const saved = getQuizData()[qIdx];
  if (!quizDDState[qIdx]) quizDDState[qIdx] = {};
  const state = quizDDState[qIdx];
  quizDDSelected = null;
  const ddArea = document.getElementById('quizDDArea');

  if (q.type === 'fill') {
    const placed = Object.values(state);
    const bankTokens = [...q.bank];
    placed.forEach(v => { const i = bankTokens.indexOf(v); if (i !== -1) bankTokens.splice(i, 1); });
    let codeHtml = escH(q.code);
    Object.keys(q.answers).forEach(i => {
      const val = state[parseInt(i)];
      const slot = val
        ? `<span class="qdd-slot qdd-filled" data-slot="${i}">${escH(val)}</span>`
        : `<span class="qdd-slot qdd-empty" data-slot="${i}">?</span>`;
      codeHtml = codeHtml.replace(escH(`{{${i}}}`), slot);
    });
    ddArea.innerHTML = `
      <div class="qdd-code-wrap"><pre class="qdd-code">${codeHtml}</pre></div>
      <div class="qdd-bank" id="qddBank">${bankTokens.map(t=>`<span class="qdd-chip" draggable="true" data-val="${escH(t)}">${escH(t)}</span>`).join('')}</div>`;

  } else if (q.type === 'match') {
    const placedDefs = Object.values(state);
    const bankDefs = q.pairs.map(p => p.def).filter(d => !placedDefs.includes(d));
    const pairsHtml = q.pairs.map((p,i) => {
      const val = state[i];
      const slot = val
        ? `<span class="qdd-slot qdd-filled" data-term="${i}">${escH(val)}</span>`
        : `<span class="qdd-slot qdd-empty" data-term="${i}">drop here</span>`;
      return `<div class="qdd-pair"><span class="qdd-term">${escH(p.term)}</span>${slot}</div>`;
    }).join('');
    ddArea.innerHTML = `
      <div class="qdd-match-wrap">
        <div class="qdd-pairs">${pairsHtml}</div>
        <div class="qdd-bank" id="qddBank">${bankDefs.map(d=>`<span class="qdd-chip qdd-def-chip" draggable="true" data-val="${escH(d)}">${escH(d)}</span>`).join('')}</div>
      </div>`;

  } else if (q.type === 'categorise') {
    const bucketsHtml = q.buckets.map((b,bi) => {
      const items = q.items.filter(item => state[item.text] === bi);
      return `<div class="qdd-bucket"><div class="qdd-bucket-title">${escH(b)}</div><div class="qdd-bucket-zone" data-bucket="${bi}">${items.map(item=>`<span class="qdd-chip qdd-in-bucket" draggable="true" data-val="${escH(item.text)}">${escH(item.text)}</span>`).join('')}</div></div>`;
    }).join('');
    const bankItems = q.items.filter(item => state[item.text] === undefined);
    ddArea.innerHTML = `
      <div class="qdd-cat-wrap">
        <div class="qdd-buckets">${bucketsHtml}</div>
        <div class="qdd-bank" id="qddBank">${bankItems.map(item=>`<span class="qdd-chip" draggable="true" data-val="${escH(item.text)}">${escH(item.text)}</span>`).join('')}</div>
      </div>`;
  }

  // Feedback (if already submitted)
  const fb = document.getElementById('quizFeedback');
  if (saved?.feedback) {
    fb.innerHTML = saved.feedback;
    fb.className = 'quiz-feedback ' + (saved.status === 'correct' ? 'qf-correct' : saved.status === 'partial' ? 'qf-partial' : 'qf-wrong');
    fb.classList.remove('hidden');
  } else {
    fb.className = 'quiz-feedback hidden';
  }

  bindQuizDD(qIdx);
}

function bindQuizDD(qIdx) {
  const q = quiz[qIdx];
  const ddArea = document.getElementById('quizDDArea');
  const state = quizDDState[qIdx];

  // Bank chips: click-to-select + drag
  ddArea.querySelectorAll('.qdd-bank .qdd-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.val;
      if (quizDDSelected === val && chip.classList.contains('qdd-selected')) {
        quizDDSelected = null;
        ddArea.querySelectorAll('.qdd-chip').forEach(c => c.classList.remove('qdd-selected'));
      } else {
        quizDDSelected = val;
        ddArea.querySelectorAll('.qdd-chip').forEach(c => c.classList.remove('qdd-selected'));
        chip.classList.add('qdd-selected');
      }
    });
    chip.addEventListener('dragstart', e => { quizDDSelected = chip.dataset.val; e.dataTransfer.setData('text/plain', quizDDSelected); });
  });

  // In-bucket chips (categorise): click or drag to return to bank
  ddArea.querySelectorAll('.qdd-in-bucket').forEach(chip => {
    chip.addEventListener('click', () => { delete state[chip.dataset.val]; renderQuizDDContent(qIdx); });
    chip.addEventListener('dragstart', e => {
      const val = chip.dataset.val;
      delete state[val];
      quizDDSelected = val;
      e.dataTransfer.setData('text/plain', val);
      setTimeout(() => renderQuizDDContent(qIdx), 0);
    });
  });

  // Slots (fill + match): click to place selected chip, or drop target
  ddArea.querySelectorAll('.qdd-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      if (slot.classList.contains('qdd-filled')) {
        if (q.type === 'fill') delete state[parseInt(slot.dataset.slot)];
        else if (q.type === 'match') delete state[parseInt(slot.dataset.term)];
        renderQuizDDContent(qIdx);
      } else if (quizDDSelected !== null) {
        placeChip(qIdx, slot, quizDDSelected);
      }
    });
    slot.addEventListener('dragover', e => e.preventDefault());
    slot.addEventListener('drop', e => {
      e.preventDefault();
      const val = e.dataTransfer.getData('text/plain') || quizDDSelected;
      if (val) placeChip(qIdx, slot, val);
    });
  });

  // Bucket zones (categorise): click or drop to place
  ddArea.querySelectorAll('.qdd-bucket-zone').forEach(zone => {
    zone.addEventListener('click', () => {
      if (quizDDSelected !== null) {
        state[quizDDSelected] = parseInt(zone.dataset.bucket);
        quizDDSelected = null;
        renderQuizDDContent(qIdx);
      }
    });
    zone.addEventListener('dragover', e => e.preventDefault());
    zone.addEventListener('drop', e => {
      e.preventDefault();
      const val = e.dataTransfer.getData('text/plain') || quizDDSelected;
      if (val) { state[val] = parseInt(zone.dataset.bucket); quizDDSelected = null; renderQuizDDContent(qIdx); }
    });
  });
}

function placeChip(qIdx, slot, val) {
  const q = quiz[qIdx];
  const state = quizDDState[qIdx];
  if (q.type === 'fill') state[parseInt(slot.dataset.slot)] = val;
  else if (q.type === 'match') state[parseInt(slot.dataset.term)] = val;
  quizDDSelected = null;
  renderQuizDDContent(qIdx);
}

function scoreQuizDD(qIdx) {
  const q = quiz[qIdx];
  const state = quizDDState[qIdx] || {};
  let correct = 0, total = 0;
  if (q.type === 'fill') {
    Object.entries(q.answers).forEach(([slot, ans]) => { total++; if (state[parseInt(slot)] === ans) correct++; });
  } else if (q.type === 'match') {
    q.pairs.forEach((p,i) => { total++; if (state[i] === p.def) correct++; });
  } else if (q.type === 'categorise') {
    q.items.forEach(item => { total++; if (state[item.text] === item.bucket) correct++; });
  }
  const pct = correct / total;
  let status, cls, heading;
  if (pct === 1)    { status='correct'; cls='qf-correct'; heading=`✓ Perfect — all ${total} correct!`; }
  else if (pct >= 0.5) { status='partial'; cls='qf-partial'; heading=`● ${correct} / ${total} correct — good start, but some are wrong.`; }
  else              { status='wrong';   cls='qf-wrong';   heading=`✕ ${correct} / ${total} correct — review the material and try again.`; }
  return { status, cls, html:`<strong>${heading}</strong><div class="qf-model"><b>Explanation:</b> ${q.model}</div>` };
}

async function submitQuizDD(qIdx) {
  const q = quiz[qIdx];
  const state = quizDDState[qIdx] || {};
  // Check all slots are filled
  let allFilled = true;
  if (q.type === 'fill') allFilled = Object.keys(q.answers).every(i => state[parseInt(i)] !== undefined);
  else if (q.type === 'match') allFilled = q.pairs.every((_,i) => state[i] !== undefined);
  else if (q.type === 'categorise') allFilled = q.items.every(item => state[item.text] !== undefined);
  if (!allFilled) {
    const fb = document.getElementById('quizFeedback');
    fb.innerHTML = '<strong>Place all items before submitting.</strong>';
    fb.className = 'quiz-feedback qf-wrong';
    fb.classList.remove('hidden');
    return;
  }
  const result = scoreQuizDD(qIdx);
  const prev = getQuizData()[qIdx] || { attempts:0 };
  const saved = { placements: Object.assign({}, state), status: result.status, feedback: result.html, attempts: (prev.attempts||0)+1, time: Date.now() };
  if (prev.status === 'correct') saved.status = 'correct';
  progressCache.quiz[qIdx] = saved;
  await saveQuizProgress(qIdx, saved);
  const fb = document.getElementById('quizFeedback');
  fb.innerHTML = result.html; fb.className = 'quiz-feedback ' + result.cls; fb.classList.remove('hidden');
  document.getElementById('quizDDAttemptInfo').textContent = 'Attempts: ' + saved.attempts;
  renderQuizNav();
}

document.getElementById('quizDDSubmit').addEventListener('click', () => submitQuizDD(curQ));

function analyseQuizAnswer(qIdx, answer) {
  const q = quiz[qIdx];
  const lower = answer.toLowerCase();
  const foundKeys = q.keys.filter(k => lower.includes(k.toLowerCase()));
  let conceptScore = 0, conceptMax = 0;
  const conceptResults = [];
  q.concepts.forEach(c => {
    conceptMax += c.weight;
    const rx = new RegExp(c.term, 'i');
    if (rx.test(answer)) { conceptScore += c.weight; conceptResults.push({ text: c.term.replace(/\|/g, ' / ').replace(/\\\(/g, '(').replace(/\\\)/g, ')'), hit: true }); }
    else { conceptResults.push({ text: c.term.replace(/\|/g, ' / ').replace(/\\\(/g, '(').replace(/\\\)/g, ')'), hit: false }); }
  });
  const pct = conceptMax > 0 ? conceptScore / conceptMax : 0;
  const tooShort = answer.trim().split(/\s+/).length < 5;
  let status, cls, heading;
  if (pct >= 0.7 && !tooShort) { status = 'correct'; cls = 'qf-correct'; heading = '✓ Excellent answer!'; }
  else if (pct >= 0.35 || foundKeys.length >= Math.ceil(q.keys.length * 0.5)) { status = 'partial'; cls = 'qf-partial'; heading = '● Good start — but some key points are missing.'; }
  else { status = 'wrong'; cls = 'qf-wrong'; heading = '✕ Your answer needs more detail. Read the guidance below and try again.'; }
  let html = `<strong>${heading}</strong><ul class="quiz-fb-list">`;
  conceptResults.forEach(c => { html += `<li class="${c.hit ? 'qfb-yes' : 'qfb-no'}">${c.hit ? 'Mentioned' : 'Missing'}: ${c.text}</li>`; });
  html += '</ul>';
  if (tooShort) html += '<p style="margin-top:.4rem;color:var(--burg);font-weight:600">Your answer is very short. Try to write in full sentences.</p>';
  html += `<div class="qf-model"><b>Model answer:</b> ${q.model}</div>`;
  return { status, cls, html };
}

document.getElementById('quizSubmit').addEventListener('click', async () => {
  const q = quiz[curQ];
  if (q.type === 'fill' || q.type === 'match' || q.type === 'categorise') return; // handled by quizDDSubmit
  const answer = document.getElementById('quizInput').value.trim();
  if (!answer) { document.getElementById('quizFeedback').innerHTML = '<strong>Please type your answer first.</strong>'; document.getElementById('quizFeedback').className = 'quiz-feedback qf-wrong'; document.getElementById('quizFeedback').classList.remove('hidden'); return; }
  const result = analyseQuizAnswer(curQ, answer);
  const prev = getQuizData()[curQ] || { attempts: 0 };
  const saved = { answer, status: result.status, feedback: result.html, attempts: (prev.attempts || 0) + 1, time: Date.now() };
  if (prev.status === 'correct') saved.status = 'correct';
  // Save to cache and Firestore
  progressCache.quiz[curQ] = saved;
  await saveQuizProgress(curQ, saved);
  const fb = document.getElementById('quizFeedback');
  fb.innerHTML = result.html; fb.className = 'quiz-feedback ' + result.cls; fb.classList.remove('hidden');
  document.getElementById('quizAttemptInfo').textContent = 'Attempts: ' + saved.attempts;
  renderQuizNav();
});

document.getElementById('quizPrev').addEventListener('click', () => { if (curQ > 0) { curQ--; renderQuiz(); } });
document.getElementById('quizNext').addEventListener('click', () => { if (curQ < quiz.length - 1) { curQ++; renderQuiz(); } });


/* ══════════════════════════════════════════════
   STUDENT TASKS + CODE EDITOR
   ══════════════════════════════════════════════ */
const tasks=[
  /* Task 1 */
{t:'Identify the Parts',d:'easy',
  pseudoKeys:['Greet','Name','Anika','STRING'],
  b:`Look at this code:\n<pre>PROCEDURE Greet(Name : STRING)\n    OUTPUT "Hello, " &amp; Name\nENDPROCEDURE\n\nCALL Greet("Anika")</pre>\nWrite down: <b>(a)</b> the procedure name, <b>(b)</b> the parameter, <b>(c)</b> the argument, <b>(d)</b> the data type.`},

  /* Task 2 */
{t:'Predict the Output',d:'easy',
  javaKeys:['14','showDouble','System.out.println','void', 'public', 'static'],
  b:`(a) What does this output?\n<pre>PROCEDURE ShowDouble(X : INTEGER)\n    OUTPUT X * 2\nENDPROCEDURE\n\nCALL ShowDouble(7)</pre>\n(b) Rewrite in <b>Java</b> using correct naming conventions.\n<div class="task-hint">💡 In Java, use camelCase: <code>showDouble</code>.</div>`},

  /* Task 3 */
{t:'Fill in the Blanks',d:'easy',
  pseudoKeys:['Count','5'],
  b:`Complete the gaps so the procedure prints 5 stars:\n<pre>PROCEDURE PrintStars(______ : INTEGER)\n    FOR I ← 1 TO Count\n        OUTPUT "*"\n    NEXT I\nENDPROCEDURE\n\nCALL PrintStars(______)</pre>\n<div class="task-hint">💡 The parameter name must match what's used in the loop.</div>`},

  /* Task 4 */
{t:'Spot the Error',d:'easy',
  pseudoKeys:['INTEGER','STRING','type','mismatch','15','comma','concatenation', ','],
  javaKeys:['public', 'static', 'void', 'int','String','type','mismatch','15', '+', 'sayAge'],
  b:`This code has <b>two errors</b>. Find and fix both:\n<pre>PROCEDURE SayAge(Age : INTEGER)\n    OUTPUT "You are " &amp; Age &amp; " years old"\nENDPROCEDURE\n\nCALL SayAge("fifteen")</pre>\n<b>(a)</b> Describe what is wrong with the argument in the CALL statement.<br><b>(b)</b> Describe what is wrong with the OUTPUT line in the procedure.<br><b>(c)</b> Rewrite the corrected procedure in either <code>pseudocode</code> OR <code>Java</code>.
  <div class="task-hint">
  💡 Use any error messages that may display after you check your answers to refine your answer before clicking the 'Check My Answer' button again.<p></p>
  </div>`},

  /* Task 5 */
{t:'Write a Call',d:'easy',
  pseudoKeys:['DisplayMessage','Well done!','3','CALL'],
  javaKeys:['displayMessage','Well done','3'],
  b:`Given:\n<pre>PROCEDURE DisplayMessage(Msg : STRING, Times : INTEGER)\n    DECLARE i : INTEGER\n    FOR i ← 1 TO Times\n        OUTPUT Msg\n    NEXT i\nENDPROCEDURE</pre>\nWrite a call that displays <code>"Well done!"</code> three times. Then rewrite in <b>Java</b>.\n<div class="task-hint">💡 In Java, use camelCase: <code>displayMessage("Well done!", 3);</code></div>`},

  /* Task 6 */
{t:'Procedure vs Function',d:'easy',
  pseudoKeys:['PROCEDURE','ENDPROCEDURE', 'INTEGER', 'return'],
  javaKeys:['return','int','static','public'],
  b:`<b>(a)</b> Explain the difference between a procedure and a function.<br><b>(b)</b> Write a procedure in pseudocode to output the square of its integer parameter.<br><b>(c)</b> Write a function in Java to return the higher of two parameters, <code>num1</code> and <code>num2</code>, or the first parameter if they are the same.\n<div class="task-hint">💡 Remember to start parameters with a capital letter in pseudocode.<br>💡 In Java code, remember to use camelCase spelling.<br>💡 For both pseudocode code AND Java, always use suitable line indentation!</div>`},

  /* Task 7 */
{t:'Write a Procedure',d:'medium',
  
  javaKeys:['public', 'static', 'void','displayTriangle','rows', 'hashes','for','System.out.print', 'System.out.println'],
  b:`Write a procedure <code>DisplayTriangle()</code> in <code>Java</code> that takes one integer parameter, <code>numRows</code>; this is the number of rows that will make up a right-angled triangle of # symbols.</br>You will need to use <strong>two</strong> loops:
  <ul>
  <li>Outer FOR loop: number of rows</li>
  <li>Nested FOR loop: number of # symbols on each row</li>
  </ul>

  Declare any local variables used, including your loop counters.
  <p>
  Write two calls for two different triangles (one with 5 rows and one with 10 rows).
  </p>
  <p>Write your procedure and call it.</p><div class="task-hint">💡 Pseudocode: Use <code>rows</code> and <code>hashes</code> for your loop counters.<p>💡  Copy and paste your code into pseudocode.pro to see your triangles displayed.<br>`},

  /* Task 8 */
{t:'Write a Function',d:'medium',
  pseudoKeys:['FUNCTION', 'REAL', 'AddGST','Price','RETURN', 'RETURNS','1.15','230','ENDFUNCTION', 'DECLARE', 'PriceWithTax'],
  javaKeys:['double','addGST','price','return','1.15','230'],
  b:`<p><strong>(a)</strong> Write a function, AddGST(), in <code>pseudocode</code> that takes a REAL parameter, <code>Price</code>. Your function should return the updated Price after 15% tax has been added to the parameter's value.</p>
  <p>
  <strong>(b)</strong> Write an assignment statement which invokes your function and passes 20.95 as its argument.
  </p>
  <p>
  <strong>(c)</strong> Re-write your pseudocode function in <code>Java</code>.
  </p>
  <p>
  <strong>(d)</strong> Assign the function call to a variable called <code>priceWithTax</code>.
  </p>
  <div class="task-hint">💡 Pseudocode: Multiply the parameter by 1.15</div>`},

  /* Task 9 - WHY IS IT NOT UPDATING??????? */
{t:'Two-Parameter Function',d:'medium',
  pseudoKeys:['FUNCTION','Power','Base','Exponent', '^', 'RETURN','ENDFUNCTION','DECLARE','Result'],
  javaKeys:['int','power','base','exponent','return','result'],
  b:`(a) Write a <code>pseudocode</code> function called <code>Power()</code> that takes <strong>two</strong> integer parameters, <code>Base</code> and <code>Exponent</code>, and returns the power.
  <p>(b) Write the values returned after 4 and 3 are passed, and then after 7 and 2 are passed.
  <div class="task-hint">💡 Your return value should be in a <strong>local variable</strong> called <code>Result</code>.</div>`},

  /* Task 10 - INCLUDE A HINT ABOUT HOW TO ROUND TO 2DP IN JAVA*/
{t:'Function Calling a Procedure',d:'medium',
  pseudoKeys:['FUNCTION','PROCEDURE','CALL','RETURN','ENDFUNCTION','ENDPROCEDURE','DECLARE','CalculateTotal','PrintReceipt', 'ROUND', 'TotalCost', 'REAL', 'INTEGER', '2', '&', ','],
  javaKeys:['double','void','return','calculateTotal','printReceipt','println', 'price', 'quantity', 'item', 'totalCost'],
  b:`Write a program with two modules in <strong>pseudocode</strong>:\n<ol><li>A <b>function</b>, <code>CalculateTotal()</code>, that takes <strong>two</strong> parameters, <code>Price</code> and <code>Quantity</code>, and returns <code>Price * Quantity</code> rounded to 2dp</li>\n<li>A <b>procedure</b>,<code>PrintReceipt()</code> that takes <strong>three</strong> parameters, <code>Item</code> (as a string), <code>Price</code> and <code>Quantity</code>. Declare a local variable <code>Total</code>, call <code>CalculateTotal()</code>, and output the item name and total cost (use the appropriate concatenation of strings with strings, and strings with non-strings)</li></ol>\nAfter the two modules are written, write a statement that calls <code>PrintReceipt()</code> with the values "Notebook", 3.50 and 4.</br></br>Write what would be returned. 
  <p>
  Write the equivalent code in <strong>Java</strong> as well.
  </p>
  <div class="task-hint">💡 Pseudocode: Remember that <strong>local variables</strong> are declared within their procedure or function.</br></div>`},

  /* TASK 11 */
{t:'Argument Order',d:'medium',
  pseudoKeys:['6','-6','position','first','second'],
  javaKeys:['6','-6','position','first','second'],
  b:`<pre>PROCEDURE Subtract(A : INTEGER, B : INTEGER)\n    OUTPUT A - B\nENDPROCEDURE\n\nCALL Subtract(10, 4)\nCALL Subtract(4, 10)</pre>\n<b>(a)</b> What is the output of each call? 
  <p><b>(b)</b> Why does the order of arguments matter?</p>`},

  /* Task 12 */
{t:'Local vs Global',d:'medium',
  pseudoKeys:['60','100',],
  javaKeys:['60','100',],
  b:`Predict all outputs:\n<pre>X ← 100\n\nPROCEDURE ChangeX(X : INTEGER)\n    X ← X + 50\n    OUTPUT X\nENDPROCEDURE\n\nCALL ChangeX(10)\nOUTPUT X</pre>\n<div class="task-hint">💡 The parameter X is a local copy, not the global X.</div>`},

  /* Task 13 */
{t:'Two Functions Together',d:'medium',
  pseudoKeys:['FUNCTION','RETURN','ENDFUNCTION','CelsiusToFahrenheit','FahrenheitToCelsius','DECLARE', 'Celsius','Fahrenheit'],
  b:`Write two functions:\n<ol><li><code>CelsiusToFahrenheit(Celsius : REAL) RETURNS REAL</code> — returns <code>C * 9/5 + 32</code></li>\n<li><code>FahrenheitToCelsius(Fahrenheit : REAL) RETURNS REAL</code> — returns <code>(F - 32) * 5/9</code></li></ol>\nNow write a main program (procedure) that declares variables, converts 100°C to Fahrenheit and 32°F to Celsius, and outputs both results.\n\nWrite in <code>pseudocode</code>.\n`},

  /* Task 14 */
{t:'Modular Discount System',d:'medium',
  pseudoKeys:['FUNCTION','PROCEDURE','RETURN','ENDFUNCTION','ENDPROCEDURE','CALL','DECLARE','ApplyDiscount','CalculateGST','ShowFinalPrice', 'ROUND'],
  javaKeys:['double','void','return','applyDiscount','calculateGST','showFinalPrice'],
  b:`Build a modular pricing system with three modules:\n<ol><li><code>ApplyDiscount</code> - takes <strong>two</strong> parameters (Price - REAL and Percent - INTEGER) and returns a REAL number </li>\n<li><code>CalculateGST</code> that takes Price as a REAL and returns a REAL — adds 15% GST</li>\n<li><code>ShowFinalPrice</code> — takes <strong>two</strong> parameters (Original - REAL and Discount - INTEGER). This should be a <b>procedure</b> that declares local variables, calls both functions (discount first, then GST), and outputs the original price, discounted price, and final price, all formatted to <strong>2 decimal places</strong>.</li></ol>\nCall <code>ShowFinalPrice(50.00, 10)</code>. <p>What are the three values output?</p>\n\nWrite in <code>pseudocode</code>.\n<div class="task-hint">💡 Pseudocode: Use <code>DECLARE Discounted : REAL</code> and <code>DECLARE Final : REAL</code> inside the procedure.</div>`},

  /* Task 15 */
{t:'Multi-Function Program',d:'hard',
  pseudoKeys:['FUNCTION','PROCEDURE','RETURN','ENDFUNCTION','ENDPROCEDURE','DECLARE','CALL','GetArea','GetPerimeter','DescribeRectangle'],
  javaKeys:['double','void','return','getArea','getPerimeter','describeRectangle'],
  b:`Write in the following modules in <code>pseudocode</code>:\n<ol><li><code>GetArea(Length : REAL, Width : REAL) RETURNS REAL</code></li>\n<li><code>GetPerimeter(Length : REAL, Width : REAL) RETURNS REAL</code></li>\n<li><code>DescribeRectangle(Length : REAL, Width : REAL)</code> — a procedure that declares local variables for area and perimeter, calls both functions, and outputs the results</li></ol>\nWrite a main program that declares <code>Length</code> and <code>Width</code>, reads input, and calls the <code>DescribeRectangle()</code> procedure.\n<div class="task-hint">💡 Pseudocode: Write <code>// Main</code> immediate above where your main program begins.</div>`},

  /* Task 16 */
{t:'Validation Function',d:'hard',
  pseudoKeys:['FUNCTION','PROCEDURE','BOOLEAN','RETURN','WHILE','ENDFUNCTION','ENDPROCEDURE','DECLARE','ValidateAge','GetValidAge'],
  javaKeys:['boolean','return','while','validateAge','getValidAge','Scanner'],
  b:`Write two modules:\n<ol><li><code>ValidateAge(Age : INTEGER) RETURNS BOOLEAN</code> — returns TRUE if Age is between 0 and 150 inclusive</li>\n<li><code>GetValidAge()</code> — a procedure that declares a local variable <code>Age</code>, loops using a WHILE loop until <code>ValidateAge</code> returns TRUE, then outputs the valid age</li></ol>\nWrite in CIE pseudocode <b>or</b> Java.\n<div class="task-hint">💡 Pseudocode: <code>DECLARE Age : INTEGER</code> inside GetValidAge.<br>Java: <code>public static boolean validateAge(int age)</code></div>`},

  /* Task 17 */
{t:'Swap (BYREF)',d:'hard',
  pseudoKeys:['PROCEDURE','BYREF','DECLARE','Temp','ENDPROCEDURE','Swap'],
  javaKeys:['void','swap','temp','int[]'],
  b:`Write <code>Swap(BYREF A : INTEGER, BYREF B : INTEGER)</code> that uses a declared local variable <code>Temp</code> to swap the values. Show what happens step by step when X=5, Y=9. Why is BYREF essential?\n\nIn Java, show how to swap two elements in an array (since Java primitives are always by value).\n<div class="task-hint">💡 Pseudocode: <code>DECLARE Temp : INTEGER</code> inside Swap.</div>`},

/* Task 18 */
{t:'String Processing',d:'hard',
  pseudoKeys:['FUNCTION','RETURN','ENDFUNCTION','DECLARE','CountChar','FOR','LENGTH','Count'],
  javaKeys:['int','return','countChar','for','length','charAt','count'],
  b:`Write <code>CountChar(Text : STRING, Target : CHAR) RETURNS INTEGER</code>. Declare a local counter variable. Show what <code>CountChar("banana", "a")</code> returns.\n\nThen write a main program that declares a sentence variable and counts all vowels by calling <code>CountChar</code> five times (once for each vowel).\n\nWrite in CIE pseudocode <b>or</b> Java.\n<div class="task-hint">💡 Pseudocode: <code>DECLARE Count : INTEGER</code> inside the function.<br>Java: <code>public static int countChar(String text, char target)</code></div>`},

  /* Task 19 */
{t:'Array Parameter',d:'hard',
  pseudoKeys:['FUNCTION','PROCEDURE','RETURN','ENDFUNCTION','ENDPROCEDURE','DECLARE','FindMax','FindMin','DisplayStats'],
  javaKeys:['int','void','return','findMax','findMin','displayStats'],
  b:`Write three modules:\n<ol><li><code>FindMax(Numbers : ARRAY OF INTEGER, Size : INTEGER) RETURNS INTEGER</code> — declare a local <code>Max</code> variable</li>\n<li><code>FindMin(Numbers : ARRAY OF INTEGER, Size : INTEGER) RETURNS INTEGER</code> — declare a local <code>Min</code> variable</li>\n<li><code>DisplayStats(Numbers : ARRAY, Size : INTEGER)</code> — a procedure that declares local variables, calls both functions, and outputs max, min, and range</li></ol>\nWrite in CIE pseudocode <b>or</b> Java.\n<div class="task-hint">💡 Java: <code>public static int findMax(int[] numbers, int size)</code></div>`},

  /* Task 20 */
{t:'Bubble Sort',d:'challenge',
  pseudoKeys:['PROCEDURE','BYREF','DECLARE','Swap','ENDPROCEDURE','FOR','Temp','NoSwaps'],
  javaKeys:['void','swap','for','temp','int[]','boolean'],
  b:`Write <code>BubbleSort(BYREF Arr : ARRAY OF INTEGER, Size : INTEGER)</code> in CIE pseudocode <b>or</b> Java.\n<ol><li>Declare all local variables (loop counters, a NoSwaps flag, Temp for swapping).</li>\n<li>Use a separate <code>Swap</code> procedure.</li>\n<li>Show the array after each pass when sorting [4, 2, 7, 1, 3].</li></ol>\n<div class="task-hint">💡 Pseudocode: <code>DECLARE I : INTEGER</code>, <code>DECLARE NoSwaps : BOOLEAN</code><br>Java: <code>public static void bubbleSort(int[] arr, int size)</code></div>`},

  /* Task 21 */
{t:'Password Checker',d:'challenge',
  pseudoKeys:['FUNCTION','BOOLEAN','RETURN','ENDFUNCTION','DECLARE','HasMinLength','HasUpperCase','HasDigit','CheckPassword','Count'],
  javaKeys:['boolean','return','String','hasMinLength','hasUpperCase','hasDigit','checkPassword','int'],
  b:`Build a modular password system. Declare all local variables.\n<ol><li><code>HasMinLength(Password : STRING, MinLen : INTEGER) RETURNS BOOLEAN</code></li>\n<li><code>HasUpperCase(Password : STRING) RETURNS BOOLEAN</code> — declare a local <code>Found</code> variable</li>\n<li><code>HasDigit(Password : STRING) RETURNS BOOLEAN</code> — declare a local <code>Found</code> variable</li>\n<li><code>CheckPassword(Password : STRING) RETURNS STRING</code> — declare a local <code>Count</code> variable, call all three functions, return "Strong"/"Medium"/"Weak"</li></ol>\nWrite in CIE pseudocode <b>or</b> Java. Work through <code>CheckPassword("Hello1")</code> showing what each function returns.\n<div class="task-hint">💡 Java: <code>public static boolean hasMinLength(String password, int minLen)</code></div>`},

  /* Task 22 */

{t:'Menu Calculator',d:'challenge',
  pseudoKeys:['FUNCTION','PROCEDURE','RETURN','ENDFUNCTION','ENDPROCEDURE','DECLARE','GetChoice','GetNumber','WHILE','CALL'],
  javaKeys:['int','double','void','return','getChoice','getNumber','while','Scanner'],
  b:`Build a menu-driven calculator. Declare all local variables in every module.\n<ol><li>Functions: <code>Add</code>, <code>Subtract</code>, <code>Multiply</code>, <code>Divide</code> — each takes two REAL parameters and returns REAL</li>\n<li><code>GetChoice() RETURNS INTEGER</code> — declare a local <code>Choice</code>, display menu, return choice</li>\n<li><code>GetNumber(Prompt : STRING) RETURNS REAL</code> — declare a local <code>Num</code>, display prompt, return number</li>\n<li>Main program with a WHILE loop, input validation, and division-by-zero handling</li></ol>\nWrite in CIE pseudocode <b>or</b> Java.\n<div class="task-hint">💡 Java: <code>public static int getChoice()</code> and <code>public static double getNumber(String prompt)</code></div>`},
];


// Maps specific skills to 0-based task indices
const CONCEPT_MAP = [
  { name: 'Procedures — basics to writing',  hint: 'identifying parts, tracing output, writing and defining procedures',        tasks: [0,1,2,3,4,5,6]    },
  { name: 'Procedure vs function',           hint: 'when a module should return a value vs just perform an action',             tasks: [5,7]               },
  { name: 'Functions with return values',    hint: 'FUNCTION … RETURN … ENDFUNCTION and assigning the result',                  tasks: [7,8,12,13]         },
  { name: 'Argument type matching',          hint: 'argument types must match the parameter\'s declared data type',             tasks: [3,10]              },
  { name: 'Multiple parameters',             hint: 'defining and calling modules that take more than one argument',             tasks: [8,9,10]            },
  { name: 'Local and global scope',          hint: 'local parameters are copies — changes inside a module do not affect the caller', tasks: [11]          },
  { name: 'Modules calling other modules',   hint: 'invoking a function or procedure from within another module',               tasks: [9,13,14]           },
  { name: 'Multi-module program design',     hint: 'organising a program into 3+ cooperating procedures and functions',         tasks: [14,15,18,20,21]   },
  { name: 'Passing by reference (BYREF)',    hint: 'BYREF lets a procedure modify the caller\'s original variable directly',    tasks: [16,19]            },
  { name: 'String operations in modules',    hint: 'LENGTH, SUBSTRING and character-by-character iteration',                    tasks: [17]               },
  { name: 'Array parameters',               hint: 'passing and processing arrays as parameters in modules',                    tasks: [18]               },
  { name: 'Input validation loops',         hint: 'WHILE loops combined with BOOLEAN validation functions',                    tasks: [15,20]            },
];

let _dashStudents = [];

let curTask=0;
const $tCard=document.getElementById('taskCard'),$tPos=document.getElementById('taskPos'),$tPrev=document.getElementById('prevTask'),$tNext=document.getElementById('nextTask'),$tFill=document.getElementById('taskFill'),$tSide=document.getElementById('taskSide');
const $editor=document.getElementById('codeEditor'),$lineNums=document.getElementById('lineNumbers'),$feedbackBox=document.getElementById('feedbackBox'),$editorStatus=document.getElementById('editorStatus');

function buildSide(){
  $tSide.innerHTML='';
  const taskData = progressCache.tasks || {};
  tasks.forEach((t,i)=>{
    const b=document.createElement('button');b.className='task-side-btn'+(i===curTask?' active':'');
    const dc={easy:'sd-easy',medium:'sd-medium',hard:'sd-hard',challenge:'sd-challenge'}[t.d];
    const st=taskData[i]?.status;
    const icon=st==='done'?' ✓':st==='started'?' ●':'';
    b.innerHTML=`<span class="side-dot ${dc}">${i+1}</span>${t.t}<span class="task-status-icon">${icon}</span>`;
    b.addEventListener('click',()=>{curTask=i;renderTask();});
    $tSide.appendChild(b);
  });
  $tSide.insertAdjacentHTML('beforeend','<img src="images/winston-magnifying-glass.png" class="sidebar-winston" alt="Winston"/>');
}

function renderTask(){
  const t=tasks[curTask];
  const taskData = progressCache.tasks || {};
  const saved=taskData[curTask];
  const bc={easy:'b-easy',medium:'b-medium',hard:'b-hard',challenge:'b-challenge'}[t.d];
  const teacherFeedback = (progressCache.feedback || {})[curTask];
  const feedbackBanner = teacherFeedback
    ? `<div class="task-teacher-feedback"><span class="task-teacher-feedback-label">Teacher Feedback</span>${teacherFeedback}</div>`
    : '';
  $tCard.innerHTML=`<h3>Task ${curTask+1}: ${t.t} <span class="badge ${bc}">${t.d}</span></h3>${t.b}${feedbackBanner}`;
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

// Auto-indent — pseudocode keywords must be ALL CAPS per CIE 0478 (no /i flag)
const PSEUDO_INDENT_KW  = /^(PROCEDURE|FUNCTION|IF|ELSE|FOR|WHILE|REPEAT|CASE)\b/;
const PSEUDO_INDENT_END = /\bTHEN\s*$/;
const PSEUDO_CLOSE_KW   = /^(ENDIF|ENDPROCEDURE|ENDFUNCTION|ENDCASE|ENDWHILE|UNTIL|NEXT|ELSE)\b/;
const JAVA_INDENT_CHARS = /[{(]\s*$/;

$editor.addEventListener('keydown',e=>{
  const lang = $editor.value.includes('{') ? 'java' : 'pseudo';
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
    const indent=currentLine.match(/^(\s*)/)[1];
    const trimmed=currentLine.trim();
    let extra='';
    if(lang==='pseudo'){
      if(PSEUDO_INDENT_KW.test(trimmed) || PSEUDO_INDENT_END.test(trimmed)) extra='    ';
    } else { if(JAVA_INDENT_CHARS.test(trimmed)) extra='    '; }
    $editor.value=$editor.value.substring(0,s)+'\n'+indent+extra+$editor.value.substring(s);
    $editor.selectionStart=$editor.selectionEnd=s+1+indent.length+extra.length;
    updateLineNumbers();
  }
  if(e.key==='}' && lang==='java'){
    const s=$editor.selectionStart;
    const lineStart=$editor.value.lastIndexOf('\n',s-1)+1;
    const beforeCursor=$editor.value.substring(lineStart,s);
    if(/^\s+$/.test(beforeCursor) && beforeCursor.length>=4){
      e.preventDefault();
      const newIndent=beforeCursor.slice(0,-4);
      $editor.value=$editor.value.substring(0,lineStart)+newIndent+'}'+$editor.value.substring(s);
      $editor.selectionStart=$editor.selectionEnd=lineStart+newIndent.length+1;
      updateLineNumbers();
    }
  }
  if(e.key==='Backspace'){
    const s=$editor.selectionStart;
    const lineStart=$editor.value.lastIndexOf('\n',s-1)+1;
    const beforeCursor=$editor.value.substring(lineStart,s);
    if(/^\s{4,}$/.test(beforeCursor) && beforeCursor.length>=4){
      e.preventDefault();
      $editor.value=$editor.value.substring(0,s-4)+$editor.value.substring(s);
      $editor.selectionStart=$editor.selectionEnd=s-4;
      updateLineNumbers();
    }
  }
});

// Snap pseudocode closing keywords back to the indent level of their opening pair
function snapPseudoCloseKw(){
  const lang=$editor.value.includes('{') ? 'java' : 'pseudo';
  if(lang!=='pseudo') return;
  const pos=$editor.selectionStart;
  const text=$editor.value;
  const lineStart=text.lastIndexOf('\n',pos-1)+1;
  const lineEnd=text.indexOf('\n',pos);
  const fullLine=text.substring(lineStart,lineEnd===-1?text.length:lineEnd);
  const indent=fullLine.match(/^(\s*)/)[1];
  const trimmed=fullLine.substring(indent.length);
  if(PSEUDO_CLOSE_KW.test(trimmed) && indent.length>=4){
    const newIndent=indent.slice(0,-4);
    const lineEndPos=lineEnd===-1?text.length:lineEnd;
    $editor.value=text.substring(0,lineStart)+newIndent+trimmed+text.substring(lineEndPos);
    $editor.selectionStart=$editor.selectionEnd=pos-4;
    updateLineNumbers();
  }
}

$editor.addEventListener('input',()=>{convertAssignment();normalizeOperators();updateLineNumbers();autoSave();snapPseudoCloseKw();});
$editor.addEventListener('scroll',()=>{$lineNums.scrollTop=$editor.scrollTop;});
$editor.addEventListener('keyup',()=>{$lineNums.scrollTop=$editor.scrollTop;});

function updateLineNumbers(){
  const lines=$editor.value.split('\n').length;
  $lineNums.textContent=Array.from({length:lines},(_,i)=>i+1).join('\n');
  requestAnimationFrame(()=>{$lineNums.scrollTop=$editor.scrollTop;});
}

function convertAssignment(){
  const val=$editor.value;
  if(!val.includes('<-')) return;
  const pos=$editor.selectionStart;
  const newVal=val.replace(/<-/g,'\u2190');
  const before=val.slice(0,pos);
  const count=(before.match(/<-/g)||[]).length;
  $editor.value=newVal;
  $editor.selectionStart=$editor.selectionEnd=pos-count;
}

function normalizeOperators(){
  const val=$editor.value;
  // Use unicode escapes to match ≤ (U+2264) and ≥ (U+2265) regardless of file encoding
  const newVal=val.replace(/\u2264/g,'<=').replace(/\u2265/g,'>=');
  if(newVal!==val){
    const pos=$editor.selectionStart;
    const before=val.slice(0,pos);
    const diff=(before.match(/\u2264/g)||[]).length+(before.match(/\u2265/g)||[]).length;
    $editor.value=newVal;
    $editor.selectionStart=$editor.selectionEnd=pos+diff;
  }
}

let saveTimer = null;
function autoSave(){
  const code=$editor.value.trim();
  if(!code)return;
  const existing = progressCache.tasks[curTask]?.status;
  if(existing!=='done'){
    progressCache.tasks[curTask] = { status:'started', code, time:Date.now() };
    // Debounced Firestore write
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveTaskProgress(curTask,'started',code), 2000);
  }
}

function scoreKeys(code, keys, caseSensitive) {
  if(!keys || !keys.length) return { found:[], missed:[], pct:0 };
  const found=[], missed=[];
  keys.forEach(k=>{
    if(caseSensitive){ if(code.includes(k)) found.push(k); else missed.push(k); }
    else { if(code.toUpperCase().includes(k.toUpperCase())) found.push(k); else missed.push(k); }
  });
  return { found, missed, pct: keys.length ? found.length/keys.length : 1 };
}

// Submit feedback — scores against both key sets, uses whichever is higher
document.getElementById('submitAnswer').addEventListener('click', async ()=>{
  const code=$editor.value.trim();
  if(!code){$feedbackBox.innerHTML='<strong>Please type your answer first.</strong>';$feedbackBox.className='feedback-box fb-needs';$feedbackBox.classList.remove('hidden');return;}
  const t=tasks[curTask];

  const pseudo = scoreKeys(code, t.pseudoKeys, false);
  const java   = scoreKeys(code, t.javaKeys,   true);
  const usePseudo = pseudo.pct >= java.pct;
  const { found, missed, pct } = usePseudo ? pseudo : java;
  const langLabel = usePseudo ? 'Pseudocode' : 'Java';

  let cls,msg;
  if(pct>=0.75){
    cls='fb-good';msg=`<strong>Great work!</strong> Your ${langLabel} answer covers the key concepts.`;
    progressCache.tasks[curTask] = { status:'done', code, time:Date.now() };
    await saveTaskProgress(curTask,'done',code);
    $editorStatus.textContent='✓ Completed';$editorStatus.className='editor-status saved';
  }else if(pct>=0.4){
    cls='fb-partial';msg=`<strong>Good start!</strong> Your ${langLabel} answer is on the right track but is missing some elements.`;
    progressCache.tasks[curTask] = { status:'started', code, time:Date.now() };
    await saveTaskProgress(curTask,'started',code);
  }else{
    cls='fb-needs';msg=`<strong>Keep going!</strong> Your answer needs more detail.`;
    progressCache.tasks[curTask] = { status:'started', code, time:Date.now() };
    await saveTaskProgress(curTask,'started',code);
  }
  let checklist='<ul class="fb-checklist">';
  found.forEach(k=>{checklist+=`<li class="fb-check">Includes: <code>${k}</code></li>`;});
  missed.forEach(k=>{checklist+=`<li class="fb-cross">Missing: <code>${k}</code></li>`;});
  checklist+='</ul>';
  if(!usePseudo && missed.length>0){ checklist+='<p style="margin-top:.4rem;font-size:.85rem;opacity:.7">Remember: Java uses <b>camelCase</b> for method and variable names.</p>'; }
  if(usePseudo && missed.some(k=>k==='DECLARE')){ checklist+='<p style="margin-top:.4rem;font-size:.85rem;opacity:.7">Remember: Declare all local variables with <b>DECLARE VariableName : DataType</b></p>'; }
  $feedbackBox.innerHTML=msg+checklist;
  $feedbackBox.className='feedback-box '+cls;
  $feedbackBox.classList.remove('hidden');
  buildSide();
});

document.getElementById('clearEditor').addEventListener('click',()=>{$editor.value='';updateLineNumbers();$feedbackBox.classList.add('hidden');});
$tPrev.addEventListener('click',()=>{if(curTask>0){curTask--;renderTask();}});
$tNext.addEventListener('click',()=>{if(curTask<tasks.length-1){curTask++;renderTask();}});


/* ══════════════════════════════════════════════
   TEACHER DASHBOARD — reads from Firestore
   ══════════════════════════════════════════════ */
async function refreshDashboard(){
  if (!currentUser || currentUser.role !== 'teacher') return;

  const $sum = document.getElementById('dashSummary');
  const $body = document.getElementById('dashBody');
  $body.innerHTML = '<tr><td colspan="8" class="dash-loading">Loading from Firebase...</td></tr>';

  try {
    document.getElementById('classCodeBanner').innerHTML = `Your class code: <strong>${currentUser.classCode}</strong> — share this with your students`;
    document.getElementById('classCodeBanner').classList.remove('hidden');
    // Get students belonging to this teacher
    const usersSnap = await db.collection('users').where('role', '==', 'student').where('teacherUid', '==', currentUser.uid).get();
    const students = [];

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const progDoc = await db.collection('progress').doc(userDoc.id).get();
      const prog = progDoc.exists ? progDoc.data() : { tasks: {}, quiz: {} };
      students.push({ uid: userDoc.id, email: userData.email, tasks: prog.tasks || {}, quiz: prog.quiz || {}, feedback: prog.feedback || {} });
    }
    students.sort((a, b) => a.email.localeCompare(b.email));
    _dashStudents = students;

    const totalTasks = tasks.length;
    const totalQuiz = quiz.length;
    let totalDone=0, totalStarted=0, totalQuizCorrect=0, totalQuizAttempts=0;

    students.forEach(s => {
      Object.values(s.tasks).forEach(v => { if(v.status==='done') totalDone++; else if(v.status==='started') totalStarted++; });
      Object.values(s.quiz).forEach(v => { if(v.status==='correct') totalQuizCorrect++; totalQuizAttempts += (v.attempts||0); });
    });

    $sum.innerHTML = `
      <div class="dash-stat"><div class="ds-num">${students.length}</div><div class="ds-label">Students</div></div>
      <div class="dash-stat"><div class="ds-num">${totalDone}</div><div class="ds-label">Tasks Done</div></div>
      <div class="dash-stat"><div class="ds-num">${totalStarted}</div><div class="ds-label">In Progress</div></div>
      <div class="dash-stat"><div class="ds-num">${totalQuizCorrect}</div><div class="ds-label">Quiz Correct</div></div>
      <div class="dash-stat"><div class="ds-num">${totalQuizAttempts}</div><div class="ds-label">Quiz Attempts</div></div>`;

    $body.innerHTML = '';
    if (!students.length) { $body.innerHTML = '<tr><td colspan="8" style="text-align:center;opacity:.5;padding:1.5rem">No students have signed up yet.</td></tr>'; return; }

    renderClassInsights(students);
    renderAnalytics(students);
    $body.innerHTML = students.map(s => {
      let done=0, started=0;
      for(let i=0;i<totalTasks;i++){ const st=s.tasks[i]?.status; if(st==='done') done++; else if(st==='started') started++; }
      const notStarted = totalTasks - done - started;
      let qCorrect=0, qAttempts=0;
      for(let i=0;i<totalQuiz;i++){ const d=s.quiz[i]; if(d){ if(d.status==='correct') qCorrect++; qAttempts+=(d.attempts||0); }}
      let dots = '<div class="detail-row">';
      for(let i=0;i<totalTasks;i++){
        const st = s.tasks[i]?.status;
        const cls = st==='done' ? 'dd-done' : st==='started' ? 'dd-prog' : 'dd-none';
        const code = s.tasks[i]?.code || '';
        const taskName = encodeURIComponent(tasks[i]?.t || `Task ${i+1}`);
        const email = encodeURIComponent(s.email);
        const feedback = encodeURIComponent(s.feedback[i] || '');
        const hasFeedback = !!s.feedback[i];
        const clickable = code ? `data-code="${encodeURIComponent(code)}" data-task="${i}" data-taskname="${taskName}" data-email="${email}" data-uid="${s.uid}" data-feedback="${feedback}" data-status="${st||''}"` : '';
        const feedbackCls = hasFeedback ? ' dd-has-feedback' : '';
        const titleSuffix = code ? (hasFeedback ? ' — feedback given' : ' — click to view code') : '';
        dots += `<span class="detail-dot ${cls}${code?' dd-clickable':''}${feedbackCls}" title="Task ${i+1}${titleSuffix}" ${clickable}>${i+1}</span>`;
      }
      dots += '</div>';
      return `<tr>
        <td><input type="checkbox" class="student-check" data-uid="${s.uid}" data-email="${s.email}"></td>
        <td><strong class="stu-ins-link" data-uid="${s.uid}" title="Click for student insights">${s.email}</strong></td>
        <td><span class="badge-done">${done}</span></td>
        <td><span class="badge-prog">${started}</span></td>
        <td><span class="badge-none">${notStarted}</span></td>
        <td><span class="badge-done">${qCorrect} / ${totalQuiz}</span></td>
        <td>${qAttempts}</td>
        <td>${dots}</td></tr>`;
    }).join('');
  } catch (err) {
    console.error('Dashboard error:', err);
    $body.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--burg);padding:1rem">Error loading data. Check Firebase console.</td></tr>';
  }
}

document.getElementById('dashRefresh').addEventListener('click', refreshDashboard);
document.getElementById('anlRefresh').addEventListener('click', () => { refreshDashboard(); });

function renderClassInsights(students) {
  const el = document.getElementById('classInsights');
  if (!el) return;
  if (!students.length) { el.classList.add('hidden'); return; }

  const scores = CONCEPT_MAP.map(c => {
    let total = 0, count = 0;
    students.forEach(s => {
      const attempted = c.tasks.filter(i => s.tasks[i]?.status === 'done' || s.tasks[i]?.status === 'started').length;
      if (!attempted) return;
      const done = c.tasks.filter(i => s.tasks[i]?.status === 'done').length;
      total += done / attempted;
      count++;
    });
    return count ? { name: c.name, pct: Math.round(total / count * 100) } : null;
  }).filter(Boolean);

  if (!scores.length) { el.classList.add('hidden'); return; }

  const rows = scores.map(c => {
    const cls = c.pct >= 75 ? 'ins-strong' : c.pct >= 40 ? 'ins-developing' : 'ins-weak';
    const label = c.pct >= 75 ? 'Strong' : c.pct >= 40 ? 'Developing' : 'Needs Work';
    return `<div class="ins-row">
      <div class="ins-concept-name">${c.name}</div>
      <div class="ins-bar-track"><div class="ins-bar ${cls}" style="width:${c.pct}%"></div></div>
      <div class="ins-pct">${c.pct}%</div>
      <div class="ins-badge ${cls}">${label}</div>
    </div>`;
  }).join('');

  el.innerHTML = `<div class="ins-head">Class Insights <span class="ins-count">${students.length} student${students.length!==1?'s':''}</span></div><div class="ins-rows">${rows}</div>`;
  el.classList.remove('hidden');
}

function showStudentInsights(s) {
  let modal = document.getElementById('stuInsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'stuInsModal';
    modal.className = 'stu-ins-overlay hidden';
    modal.innerHTML = `
      <div class="stu-ins-box">
        <div class="stu-ins-header">
          <div>
            <div class="stu-ins-title" id="stuInsTitle"></div>
            <div class="stu-ins-sub">Individual Learning Profile</div>
          </div>
          <button class="stu-ins-close" id="stuInsClose">✕</button>
        </div>
        <div class="stu-ins-body" id="stuInsBody"></div>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('stuInsClose').addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
  }

  const scores = CONCEPT_MAP.map(c => {
    const attempted = c.tasks.filter(i => s.tasks[i]?.status === 'done' || s.tasks[i]?.status === 'started');
    if (!attempted.length) return null;
    const done = attempted.filter(i => s.tasks[i]?.status === 'done').length;
    const pending = attempted.filter(i => s.tasks[i]?.status === 'started');
    const pct = done / attempted.length;
    return { name: c.name, hint: c.hint, done, total: attempted.length, pct, pending };
  }).filter(Boolean);

  const strong     = scores.filter(c => c.pct >= 0.75);
  const developing = scores.filter(c => c.pct >= 0.25 && c.pct < 0.75);
  const weak       = scores.filter(c => c.pct < 0.25);

  const conceptCard = (c, cls) =>
    `<span class="stu-ins-concept ${cls}">${c.name} <em>${c.done}/${c.total}</em></span>`;

  const section = (title, cls, list) => list.length ? `
    <div class="stu-ins-section">
      <div class="stu-ins-section-title ${cls}-title">${title}</div>
      <div class="stu-ins-concepts">${list.map(c => conceptCard(c, cls)).join('')}</div>
    </div>` : '';

  const tips = [...developing, ...weak]
    .filter(c => c.pending.length)
    .map(c => {
      const taskNums = c.pending.slice(0, 3).map(i => `Task ${i+1}`).join(', ');
      return `<li><strong>${c.name}</strong> — ${c.hint}.<br><span class="stu-ins-tip-tasks">Suggested: ${taskNums}</span></li>`;
    }).join('');

  const tipsHtml = tips ? `
    <div class="stu-ins-section">
      <div class="stu-ins-section-title">Suggested Next Steps</div>
      <ul class="stu-ins-tips">${tips}</ul>
    </div>` : '<div class="stu-ins-section"><div class="stu-ins-section-title">All concepts covered — great work!</div></div>';

  document.getElementById('stuInsTitle').textContent = s.email;
  document.getElementById('stuInsBody').innerHTML =
    section('Strengths', 'ins-strong', strong) +
    section('Still Developing', 'ins-developing', developing) +
    section('Needs Focus', 'ins-weak', weak) +
    tipsHtml;

  modal.classList.remove('hidden');
}

function updateDeleteBtn() {
  const anyChecked = document.querySelectorAll('.student-check:checked').length > 0;
  document.getElementById('deleteSelected').disabled = !anyChecked;
}

document.getElementById('selectAll').addEventListener('change', (e) => {
  document.querySelectorAll('.student-check').forEach(cb => cb.checked = e.target.checked);
  updateDeleteBtn();
});

document.getElementById('dashBody').addEventListener('change', (e) => {
  if (e.target.classList.contains('student-check')) updateDeleteBtn();
});

let _modalUid = null, _modalTaskIndex = null, _modalStatus = null;

document.getElementById('dashBody').addEventListener('click', (e) => {
  const nameEl = e.target.closest('.stu-ins-link');
  if (nameEl) {
    const s = _dashStudents.find(s => s.uid === nameEl.dataset.uid);
    if (s) showStudentInsights(s);
    return;
  }
  const dot = e.target.closest('.dd-clickable');
  if (!dot || !dot.dataset.code) return;
  showCodeModal(
    decodeURIComponent(dot.dataset.email),
    decodeURIComponent(dot.dataset.taskname),
    decodeURIComponent(dot.dataset.code),
    parseInt(dot.dataset.task),
    dot.dataset.uid,
    decodeURIComponent(dot.dataset.feedback || ''),
    dot.dataset.status
  );
});

function showCodeModal(email, taskName, code, taskIndex, studentUid, existingFeedback, status) {
  let modal = document.getElementById('codeViewModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'codeViewModal';
    modal.className = 'code-modal-overlay hidden';
    modal.innerHTML = `
      <div class="code-modal">
        <div class="code-modal-header">
          <div>
            <div class="code-modal-title" id="codeModalTitle"></div>
            <div class="code-modal-sub" id="codeModalSub"></div>
          </div>
          <button class="code-modal-close" id="codeModalClose">✕</button>
        </div>
        <div class="code-modal-question" id="codeModalQuestion"></div>
        <div class="code-modal-label">Student's response</div>
        <pre class="code-modal-body" id="codeModalBody"></pre>
        <div id="codeModalMissed"></div>
        <div class="code-modal-override hidden" id="codeModalOverrideWrap">
          <button class="btn-accent code-modal-override-btn" id="codeModalOverride">✓ Mark as Correct</button>
          <button class="btn-sm code-modal-override-btn" id="codeModalMarkWrong">✗ Mark as Incorrect</button>
          <span class="code-modal-override-hint" id="codeModalOverrideHint"></span>
        </div>
        <div class="code-modal-label">Teacher feedback</div>
        <div class="code-modal-feedback-wrap">
          <div class="code-modal-feedback-saved hidden" id="codeModalFeedbackSaved">
            <div class="code-modal-feedback-display" id="codeModalFeedbackDisplay"></div>
            <button class="btn-sm code-modal-edit" id="codeModalEdit">Edit Feedback</button>
          </div>
          <div class="code-modal-feedback-edit" id="codeModalFeedbackEdit">
            <textarea class="code-modal-feedback" id="codeModalFeedback" placeholder="Add feedback for this student..."></textarea>
            <button class="btn-sm code-modal-save" id="codeModalSave">Save Feedback</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('codeModalClose').addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
    document.getElementById('codeModalSave').addEventListener('click', async () => {
      const feedback = document.getElementById('codeModalFeedback').value.trim();
      const btn = document.getElementById('codeModalSave');
      btn.textContent = 'Saving...';
      btn.disabled = true;
      try {
        await db.collection('progress').doc(_modalUid).update({ [`feedback.${_modalTaskIndex}`]: feedback });
        // Mark dot as having feedback
        const fdot = document.querySelector(`.dd-clickable[data-uid="${_modalUid}"][data-task="${_modalTaskIndex}"]`);
        if (fdot) { fdot.classList.add('dd-has-feedback'); fdot.title = fdot.title.replace(' — click to view code','') + ' — feedback given'; fdot.dataset.feedback = encodeURIComponent(feedback); }
        setFeedbackSavedState(feedback);
      } catch(err) {
        console.error('Feedback save error:', err);
        btn.textContent = 'Error — try again';
        btn.disabled = false;
      }
    });
    document.getElementById('codeModalEdit').addEventListener('click', () => {
      setFeedbackEditState(document.getElementById('codeModalFeedbackDisplay').textContent);
    });
    document.getElementById('codeModalOverride').addEventListener('click', async () => {
      const btn = document.getElementById('codeModalOverride');
      btn.textContent = 'Saving...';
      btn.disabled = true;
      try {
        await db.collection('progress').doc(_modalUid).update({ [`tasks.${_modalTaskIndex}.status`]: 'done' });
        const dot = document.querySelector(`.dd-clickable[data-uid="${_modalUid}"][data-task="${_modalTaskIndex}"]`);
        if (dot) { dot.classList.remove('dd-prog','dd-none'); dot.classList.add('dd-done'); dot.dataset.status = 'done'; }
        document.getElementById('codeModalOverrideWrap').classList.add('hidden');
        _modalStatus = 'done';
      } catch(err) {
        console.error('Override error:', err);
        btn.textContent = '✓ Mark as Correct';
        btn.disabled = false;
      }
    });
    document.getElementById('codeModalMarkWrong').addEventListener('click', async () => {
      const btn = document.getElementById('codeModalMarkWrong');
      btn.textContent = 'Saving...';
      btn.disabled = true;
      try {
        await db.collection('progress').doc(_modalUid).update({ [`tasks.${_modalTaskIndex}.status`]: 'started' });
        const dot = document.querySelector(`.dd-clickable[data-uid="${_modalUid}"][data-task="${_modalTaskIndex}"]`);
        if (dot) { dot.classList.remove('dd-done','dd-none'); dot.classList.add('dd-prog'); dot.dataset.status = 'started'; }
        document.getElementById('codeModalOverrideWrap').classList.add('hidden');
        _modalStatus = 'started';
      } catch(err) {
        console.error('Override error:', err);
        btn.textContent = '✗ Mark as Incorrect';
        btn.disabled = false;
      }
    });
  }
  _modalUid = studentUid;
  _modalTaskIndex = taskIndex;
  _modalStatus = status;
  document.getElementById('codeModalTitle').textContent = taskName;
  document.getElementById('codeModalSub').textContent = email;
  document.getElementById('codeModalQuestion').innerHTML = tasks[taskIndex]?.b || '';
  document.getElementById('codeModalBody').textContent = code;

  // Show missing keywords for in-progress (orange) tasks
  const missedEl = document.getElementById('codeModalMissed');
  if (status === 'started' && tasks[taskIndex]) {
    const t = tasks[taskIndex];
    const pseudo = scoreKeys(code, t.pseudoKeys, false);
    const java   = scoreKeys(code, t.javaKeys,   true);
    const missed = (pseudo.pct >= java.pct ? pseudo : java).missed;
    if (missed.length) {
      missedEl.innerHTML = `<div class="code-modal-missed"><span class="code-modal-missed-label">⚠ Missing keywords</span>${missed.map(k=>`<span class="code-modal-missed-chip">${k}</span>`).join('')}</div>`;
    } else {
      missedEl.innerHTML = '';
    }
  } else {
    missedEl.innerHTML = '';
  }

  const overrideWrap = document.getElementById('codeModalOverrideWrap');
  const markCorrectBtn = document.getElementById('codeModalOverride');
  const markWrongBtn = document.getElementById('codeModalMarkWrong');
  const overrideHint = document.getElementById('codeModalOverrideHint');
  overrideWrap.classList.remove('hidden');
  markCorrectBtn.disabled = false;
  markWrongBtn.disabled = false;
  markCorrectBtn.textContent = '✓ Mark as Correct';
  markWrongBtn.textContent = '✗ Mark as Incorrect';
  if (status === 'done') {
    markCorrectBtn.classList.add('hidden');
    markWrongBtn.classList.remove('hidden');
    overrideHint.textContent = 'Override the automatic score and flag this answer as needing revision.';
  } else {
    markCorrectBtn.classList.remove('hidden');
    markWrongBtn.classList.add('hidden');
    overrideHint.textContent = 'Override the automatic score and mark this answer as complete.';
  }

  if (existingFeedback) {
    setFeedbackSavedState(existingFeedback);
  } else {
    setFeedbackEditState('');
  }
  modal.classList.remove('hidden');
}

function setFeedbackSavedState(text) {
  document.getElementById('codeModalFeedbackDisplay').textContent = text;
  document.getElementById('codeModalFeedbackSaved').classList.remove('hidden');
  document.getElementById('codeModalFeedbackEdit').classList.add('hidden');
  document.getElementById('codeModalSave').disabled = false;
  document.getElementById('codeModalSave').textContent = 'Save Feedback';
}

function setFeedbackEditState(text) {
  document.getElementById('codeModalFeedback').value = text;
  document.getElementById('codeModalFeedbackSaved').classList.add('hidden');
  document.getElementById('codeModalFeedbackEdit').classList.remove('hidden');
  document.getElementById('codeModalFeedback').focus();
}

document.getElementById('deleteSelected').addEventListener('click', async () => {
  const checked = [...document.querySelectorAll('.student-check:checked')];
  if (!checked.length) return;
  const names = checked.map(cb => cb.dataset.email).join('\n');
  if (!confirm(`Delete data for ${checked.length} student(s)?\n\n${names}\n\nThis cannot be undone.`)) return;
  for (const cb of checked) {
    await db.collection('users').doc(cb.dataset.uid).delete();
    await db.collection('progress').doc(cb.dataset.uid).delete();
  }
  document.getElementById('selectAll').checked = false;
  refreshDashboard();
});
document.getElementById('manageWhitelist').addEventListener('click', () => document.getElementById('whitelistEditor').classList.toggle('hidden'));
document.getElementById('cancelWhitelist').addEventListener('click', () => document.getElementById('whitelistEditor').classList.add('hidden'));

