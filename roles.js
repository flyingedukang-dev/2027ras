/* 매화 RAS-D · 역할·권한 부품 (방식 A · 가벼운 잠금)
   역할 3개: student(암호 없음) / teacher(담임 암호) / admin(교장 암호)
   ── 학교에서 아래 두 암호를 바꿔 쓰세요 ── */
window.ROLES = (function(){
  const TEACHER_PW = "1234";  // 담임 암호
  const ADMIN_PW   = "1234";    // 교장 암호
  const PARENT_PW  = "1234";     // 학부모 공유 암호(가정통신문으로 안내)

  // 화면별 필요 권한
  const NEED = {
    // 학부모 (공유 암호)
    "parenthome.html":"parent","schoolhome.html":"parent",
    // 학생 (누구나)
    "home.html":"student","hub.html":"student","gate.html":"student",
    "budget.html":"student","board.html":"student","kidsmeeting.html":"student",
    "bookshelf.html":"student","survey.html":"student","supporters.html":"student",
    "map.html":"student","index.html":"student","check.html":"student","portfolio.html":"student",
    // 담임
    "input.html":"teacher","letter.html":"teacher","codes.html":"teacher","awards.html":"teacher",
    // 교장
    "dashboard.html":"admin","journal.html":"admin","tree.html":"admin",
    "analyzer.html":"admin","cafe.html":"admin","tagger.html":"admin","weather.html":"admin",
  };
  const RANK = { student:0, parent:0, teacher:1, admin:2 };
  // 화면별로 '이 역할들만' 허용 (RANK로 안 잡히는 parent 전용 처리)
  const ONLY = {
    "parenthome.html":["parent"],
    "input.html":["teacher","admin"], "letter.html":["teacher","admin"], "codes.html":["teacher","admin"], "awards.html":["teacher","admin"],
    "dashboard.html":["admin"], "journal.html":["admin"], "tree.html":["admin"],
    "analyzer.html":["admin"], "cafe.html":["admin"], "tagger.html":["admin"], "weather.html":["admin"],
    "input_teacheronly":[],
  };
  // 학부모/학생 공용으로 열어줄 화면
  const PARENT_OK = ["parenthome.html","schoolhome.html","survey.html","supporters.html","map.html","letter_view.html","portfolio.html","home.html","gate.html","index.html","hub.html"];

  function current(){ return sessionStorage.getItem("ras_role")||""; }   // 미로그인이면 ""
  function setRole(r){ sessionStorage.setItem("ras_role", r); }
  function logout(){ sessionStorage.removeItem("ras_role"); location.href="gate.html"; }

  function login(role, pw){
    if(role==="student"){ setRole("student"); return true; }
    if(role==="teacher" && pw===TEACHER_PW){ setRole("teacher"); return true; }
    if(role==="admin" && pw===ADMIN_PW){ setRole("admin"); return true; }
    if(role==="parent" && pw===PARENT_PW){ setRole("parent"); return true; }
    return false;
  }

  // 페이지 진입 시: 미로그인 또는 권한부족이면 관문으로
  function guard(){
    const file = location.pathname.split("/").pop() || "home.html";
    const role = current();
    if(!role){ location.href="gate.html?to="+encodeURIComponent(file); return false; }
    // 학부모: 허용된 화면만
    if(role==="parent"){
      if(PARENT_OK.indexOf(file)>=0) return true;
      location.href="parenthome.html"; return false;
    }
    // ONLY에 지정된 화면은 그 역할만
    if(ONLY[file]){ if(ONLY[file].indexOf(role)>=0) return true; location.href="gate.html?to="+encodeURIComponent(file); return false; }
    const need = NEED[file] || "student";
    if(RANK[role] >= RANK[need]) return true;
    location.href = "gate.html?to=" + encodeURIComponent(file); return false;
  }

  // 우상단 역할 배지 + 홈/로그아웃
  function badge(){
    const r=current(); if(!r) return;
    const label={student:"학생",parent:"학부모",teacher:"담임",admin:"교장"}[r];
    const color={student:"#3D7EA6",parent:"#C4915C",teacher:"#3E6B5E",admin:"#C9527A"}[r];
    const d=document.createElement("div");
    d.style.cssText="position:fixed;top:8px;right:10px;z-index:99999;font-size:12px;display:flex;gap:6px;align-items:center";
    d.innerHTML=`<a href="home.html" style="background:#fff;border:1px solid #E6E2DA;color:#1F3A36;padding:3px 10px;border-radius:999px;text-decoration:none">🏠 홈</a>
      <span style="background:${color};color:#fff;padding:3px 10px;border-radius:999px">${label}</span>
      <a href="#" onclick="ROLES.logout();return false" style="color:#666;text-decoration:underline">나가기</a>`;
    document.body.appendChild(d);
  }
  return { current, login, logout, guard, badge, TEACHER_PW, ADMIN_PW };
})();
