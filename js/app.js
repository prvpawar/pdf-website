(function initApp(){
  if(!localStorage.getItem("users")){
    localStorage.setItem("users", JSON.stringify([
      { email: "prvpawar7@gmail.com", password: "Pra@2007", role: "admin" }
    ]));
  }
  if(!localStorage.getItem("pdfs")){
    localStorage.setItem("pdfs", JSON.stringify([]));
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    bindLoginPage();
    const path = window.location.pathname.split("/").pop();
    if(path==="dashboard_admin.html"){ requireRole("admin"); renderStudents(); renderPDFs(); }
    if(path==="dashboard_student.html"){ requireRole("student"); renderPDFsStudent(); }
  });
})();

function getUsers(){ return JSON.parse(localStorage.getItem("users")||"[]"); }
function setUsers(u){ localStorage.setItem("users", JSON.stringify(u)); }
function getPDFs(){ return JSON.parse(localStorage.getItem("pdfs")||"[]"); }
function setPDFs(p){ localStorage.setItem("pdfs", JSON.stringify(p)); }
function getCurrentUser(){ return JSON.parse(localStorage.getItem("currentUser")||"null"); }
function requireRole(role){ if(!getCurrentUser()||getCurrentUser().role!==role) window.location.href="index.html"; }
function validateEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);}

// ---------- Login ----------
function bindLoginPage(){
  const loginBtn = document.getElementById("loginBtn");
  const toggleBtn = document.getElementById("togglePwd");
  const emailInput = document.getElementById("email");
  const pwdInput = document.getElementById("password");
  const errorEl = document.getElementById("error");

  if(loginBtn) loginBtn.addEventListener("click", login);
  [emailInput,pwdInput].forEach(el=>{
    if(el) el.addEventListener("keydown",e=>{ if(e.key==="Enter"){e.preventDefault();login();} });
  });

  if(toggleBtn && pwdInput){
    toggleBtn.addEventListener("click", ()=>{
      const isPwd = pwdInput.type==="password";
      pwdInput.type = isPwd?"text":"password";
      toggleBtn.setAttribute("aria-label",isPwd?"Hide password":"Show password");
      const svg = document.getElementById("eyeIcon");
      if(svg) svg.innerHTML = isPwd?'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="#0b4ed6" stroke-width="1.2"/><circle cx="12" cy="12" r="3" fill="#0b4ed6"/>':'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="#374151" stroke-width="1.2"/><circle cx="12" cy="12" r="3" stroke="#374151" stroke-width="1.2"/>';
      pwdInput.focus();
    });
  }
}

function login(){
  const email = (document.getElementById("email")||{}).value.trim();
  const password = (document.getElementById("password")||{}).value.trim();
  const errEl = document.getElementById("error"); if(errEl) errEl.textContent="";

  if(!email||!password){if(errEl) errEl.textContent="Fill both fields"; return;}
  if(!validateEmail(email)){if(errEl) errEl.textContent="Invalid email"; return;}

  const user = getUsers().find(u=>u.email.toLowerCase()===email.toLowerCase() && u.password===password);
  if(!user){if(errEl) errEl.textContent="Invalid email or password"; return;}

  localStorage.setItem("currentUser",JSON.stringify(user));
  if(user.role==="admin") window.location.href="dashboard_admin.html";
  else window.location.href="dashboard_student.html";
}

function logout(){ localStorage.removeItem("currentUser"); window.location.href="index.html"; }

// ---------- Admin functions ----------
function addStudent(){
  const email = (document.getElementById("studentEmail")||{}).value.trim();
  const password = (document.getElementById("studentPassword")||{}).value.trim();
  if(!email||!password){ alert("Fill both fields"); return; }
  if(!validateEmail(email)){ alert("Invalid email"); return; }

  const users = getUsers();
  if(users.some(u=>u.email.toLowerCase()===email.toLowerCase())){ alert("Email exists"); return; }

  users.push({email,password,role:"student"}); setUsers(users);
  document.getElementById("studentEmail").value="";
  document.getElementById("studentPassword").value="";
  renderStudents();
}

function renderStudents(){
  const list = document.getElementById("studentList"); if(!list) return;
  const students = getUsers().filter(u=>u.role==="student"); list.innerHTML="";
  if(students.length===0){ list.innerHTML="<li>No students</li>"; return; }

  students.forEach(s=>{
    const li = document.createElement("li"); li.innerHTML=`<strong>${s.email}</strong>`;
    const editBtn=document.createElement("button"); editBtn.textContent="Edit"; editBtn.onclick=()=>editStudent(s.email);
    const delBtn=document.createElement("button"); delBtn.textContent="Remove"; delBtn.onclick=()=>deleteStudent(s.email);
    li.appendChild(editBtn); li.appendChild(delBtn); list.appendChild(li);
  });
}

function editStudent(oldEmail){
  const newEmail = prompt("Enter new email:", oldEmail); if(!newEmail) return;
  if(!validateEmail(newEmail)){ alert("Invalid email"); return; }
  const users = getUsers();
  if(users.some(u=>u.email.toLowerCase()===newEmail.toLowerCase() && u.email!==oldEmail)){ alert("Email exists"); return; }
  const idx = users.findIndex(u=>u.email===oldEmail); if(idx!==-1){ users[idx].email=newEmail; setUsers(users); renderStudents(); }
}

function deleteStudent(email){
  if(!confirm("Remove student "+email+"?")) return;
  const users = getUsers().filter(u=>!(u.email===email&&u.role==="student"));
  setUsers(users); renderStudents();
}

// ---------- PDFs ----------
function uploadPDF(){
  const fileInput = document.getElementById("pdfFile"); if(!fileInput||!fileInput.files.length){ alert("Select PDF"); return; }
  const file = fileInput.files[0]; if(file.type!=="application/pdf"){ alert("Only PDF"); return; }

  const reader = new FileReader();
  reader.onload = function(e){
    const pdfs = getPDFs(); const cur = getCurrentUser(); const id=Date.now();
    pdfs.unshift({id,name:file.name,data:e.target.result,uploadedBy:cur.email});
    setPDFs(pdfs); renderPDFs(); fileInput.value="";
  };
  reader.readAsDataURL(file);
}

function renderPDFs(){
  const list = document.getElementById("pdfList"); if(!list) return;
  const pdfs = getPDFs(); list.innerHTML="";
  if(pdfs.length===0){ list.innerHTML="<li>No PDFs</li>"; return; }
  pdfs.forEach(p=>{
    const li=document.createElement("li"); li.innerHTML=`${p.name} (${p.uploadedBy})`;
    const download=document.createElement("a"); download.href=p.data; download.download=p.name; download.textContent="Download";
    const del=document.createElement("button"); del.textContent="Delete"; del.onclick=()=>{if(!confirm("Delete "+p.name+"?")) return; setPDFs(getPDFs().filter(x=>x.id!==p.id)); renderPDFs();}
    li.appendChild(download); li.appendChild(del); list.appendChild(li);
  });
}

function renderPDFsStudent(){
  const list=document.getElementById("pdfListStudent"); if(!list)return;
  const pdfs=getPDFs(); list.innerHTML=""; if(pdfs.length===0){ list.innerHTML="<li>No PDFs</li>"; return; }
  pdfs.forEach(p=>{ const li=document.createElement("li"); li.innerHTML=p.name;
    const download=document.createElement("a"); download.href=p.data; download.download=p.name; download.textContent="Download";
    li.appendChild(download); list.appendChild(li);
  });
}
