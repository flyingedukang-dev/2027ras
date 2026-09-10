/**
 * 매화 RAS-D · AI 중계 서버 (Cloudflare Worker)
 * -----------------------------------------------------------------
 * 화면(브라우저)의 요청을 받아 Upstage Solar에 대신 요청합니다.
 * Upstage API 키는 이 서버(환경변수)에만 있고, 화면에는 절대 노출되지 않습니다.
 *
 * 잠금장치 2가지:
 *  1) ALLOWED_ORIGIN 에 적은 사이트에서 온 요청만 허용 (예: https://아이디.github.io)
 *  2) 화면이 보낸 암호(X-Gate)가 GATE 와 일치할 때만 허용
 *
 * 설치는 "중계서버_설치안내.md" 참고.
 * 환경변수(Cloudflare에서 등록):
 *   UPSTAGE_KEY   = Upstage API 키 (up_...)
 *   GATE          = 학교만 아는 암호 (예: maehwa-gate-8821)
 *   ALLOWED_ORIGIN= 허용할 사이트 주소 (예: https://flyingedukang-dev.github.io)
 * -----------------------------------------------------------------
 */

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allow = env.ALLOWED_ORIGIN || "";

    // CORS 프리플라이트
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors(origin, allow) });
    }
    if (request.method !== "POST") {
      return json({ error: "POST만 허용됩니다" }, 405, origin, allow);
    }
    // 1) 출처 검사
    if (allow && origin && origin !== allow) {
      return json({ error: "허용되지 않은 출처입니다" }, 403, origin, allow);
    }
    // 2) 암호 검사
    const gate = request.headers.get("X-Gate") || "";
    if ((env.GATE || "") && gate !== env.GATE) {
      return json({ error: "암호가 맞지 않습니다" }, 401, origin, allow);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: "잘못된 요청" }, 400, origin, allow); }
    const prompt = body.prompt;
    const maxTokens = Math.min(Number(body.max_tokens) || 1000, 2000);
    if (!prompt) return json({ error: "prompt가 없습니다" }, 400, origin, allow);

    // Upstage Solar 호출 (키는 서버에만)
    try {
      const r = await fetch("https://api.upstage.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.UPSTAGE_KEY },
        body: JSON.stringify({
          model: body.model || "solar-pro2",
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          reasoning_effort: "low",
        }),
      });
      const d = await r.json();
      if (d.error) return json({ error: d.error.message || "Upstage 오류" }, 502, origin, allow);
      const text = (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || "";
      return json({ text }, 200, origin, allow);
    } catch (e) {
      return json({ error: "중계 실패: " + e.message }, 502, origin, allow);
    }
  },
};

function cors(origin, allow) {
  return {
    "Access-Control-Allow-Origin": allow || origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Gate",
    "Access-Control-Max-Age": "86400",
  };
}
function json(obj, status, origin, allow) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors(origin, allow) },
  });
}
