/* 매화 RAS 공용 연결 부품 — 모든 화면이 이 파일을 불러 씁니다.
   <script src="ras-config.js"></script> 한 줄로 포함.
   URL/열쇠말은 기기(브라우저)에 한 번만 저장되고 모든 화면이 공유합니다. */
window.RAS = (function () {
  const CK = "ras_url", KK = "ras_key";
  function conf() { return { url: localStorage.getItem(CK) || "", key: localStorage.getItem(KK) || "maehwa-2027" }; }
  function setConf(url, key) { localStorage.setItem(CK, (url || "").trim()); localStorage.setItem(KK, (key || "maehwa-2027").trim()); }

  async function read(tab) {
    const c = conf(); if (!c.url) throw new Error("연결 설정이 필요합니다");
    const r = await fetch(c.url + "?key=" + encodeURIComponent(c.key) + "&tab=" + encodeURIComponent(tab));
    const j = await r.json(); if (j.error) throw new Error(j.error); return j.rows || [];
  }
  async function write(tab, action, payload) {
    const c = conf(); if (!c.url) throw new Error("연결 설정이 필요합니다");
    // payload는 {열:값} 이거나 {id, status} 등. row/그밖 필드를 함께 실어 보냄.
    const body = Object.assign({ key: c.key, tab, action }, action === "vote" || action === "setStatus" ? payload : { row: payload });
    // text/plain 으로 보내 CORS 프리플라이트 회피 (Apps Script 규칙)
    const r = await fetch(c.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) });
    return r.json();
  }
  // 화면마다 붙는 작은 연결 배너 (상태 표시 + 설정 열기)
  function banner(el) {
    const c = conf();
    el.innerHTML = `<div id="ras-b" style="font-size:12px;padding:6px 10px;border-radius:8px;background:#FFF6D6;color:#A67C00;display:flex;justify-content:space-between;align-items:center;gap:8px">
      <span id="ras-bt">연결 확인 중…</span>
      <button id="ras-bs" style="border:none;background:transparent;text-decoration:underline;cursor:pointer;font:inherit;color:inherit">설정</button></div>
      <div id="ras-form" style="display:none;background:#fff;border:1px solid #E6E2DA;border-radius:10px;padding:10px;margin-top:6px;font-size:13px">
        <div>웹 앱 URL</div><input id="ras-url" style="width:100%;padding:6px;margin:4px 0;border:1px solid #E6E2DA;border-radius:6px" placeholder="https://script.google.com/macros/s/..../exec">
        <div>열쇠말</div><input id="ras-key" style="width:100%;padding:6px;margin:4px 0;border:1px solid #E6E2DA;border-radius:6px" placeholder="maehwa-2027">
        <button id="ras-save" style="padding:6px 12px;border:none;border-radius:6px;background:#1F3A36;color:#fff;cursor:pointer">저장하고 확인</button>
      </div>`;
    const t = el.querySelector("#ras-bt"), form = el.querySelector("#ras-form");
    el.querySelector("#ras-url").value = c.url; el.querySelector("#ras-key").value = c.key;
    el.querySelector("#ras-bs").onclick = () => { form.style.display = form.style.display === "none" ? "block" : "none"; };
    el.querySelector("#ras-save").onclick = async () => { setConf(el.querySelector("#ras-url").value, el.querySelector("#ras-key").value); form.style.display = "none"; check(); };
    async function check() {
      const b = el.querySelector("#ras-b");
      if (!conf().url) { b.style.background = "#FFF6D6"; b.style.color = "#A67C00"; t.textContent = "연결 설정이 필요합니다 →"; form.style.display = "block"; return; }
      t.textContent = "연결 확인 중…";
      try { const rows = await read("daily"); b.style.background = "#EEF4F1"; b.style.color = "#3E6B5E"; t.textContent = "✓ 구글시트 연결됨"; if (el._onReady) el._onReady(); }
      catch (e) { b.style.background = "#FCEFE9"; b.style.color = "#B8432F"; t.textContent = "연결 실패: " + e.message; }
    }
    el.check = check; check();
  }
  return { conf, setConf, read, write, banner };
})();
