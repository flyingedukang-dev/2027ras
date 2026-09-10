/* 매화 RAS-D · AI 부품 (앱스 스크립트 통일 버전)
   구글시트 연결(ras-config.js)의 같은 웹 앱 URL로 AI도 중계합니다.
   Upstage 키는 Apps Script의 '스크립트 속성(UPSTAGE_KEY)'에만 있어 화면에 노출되지 않습니다.
   시트 URL이 설정돼 있으면 AI도 자동으로 됩니다(별도 설정 불필요).
   키가 서버에 없거나 오류면 각 화면은 '샘플 응답'으로 시연됩니다. */
window.AICONF = (function(){
  function conf(){ return (window.RAS && RAS.conf) ? RAS.conf() : { url:"", key:"" }; }
  function key(){ return conf().url; } // '연결됨' 판정용 (시트 URL 유무)

  async function ask(prompt, maxTokens){
    var c = conf();
    if(!c.url) throw new Error("NO_KEY");
    var r = await fetch(c.url, {
      method:"POST",
      headers:{ "Content-Type":"text/plain;charset=utf-8" },
      body: JSON.stringify({ key:c.key, action:"ai", prompt:prompt, max_tokens:maxTokens||1000, model:"solar-pro2" })
    });
    var d = await r.json();
    if(d.error) throw new Error(d.error);
    return d.text || "";
  }

  function banner(el,label){
    var on = !!conf().url;
    el.innerHTML = '<div style="font-size:12px;padding:6px 10px;border-radius:8px;background:'+(on?'#EEF4F1':'#FFF6D6')+';color:'+(on?'#3E6B5E':'#8a6d00')+'">'
      + (on
         ? '✓ AI 준비됨 (학교 시트 서버 경유) — '+(label||'')+' · 키는 서버에만 있습니다'
         : 'AI 미연결: 먼저 구글시트에 연결하세요. 그러면 AI도 같이 됩니다. (키 없으면 샘플로 시연)')
      + '</div>';
  }
  return { key, ask, banner };
})();
