/**
 * 매화 RAS-D 데이터 통로 (Google Apps Script)
 * ------------------------------------------------------------
 * 이 코드 하나로 모든 RAS 화면이 구글시트에 저장하고 읽습니다.
 * 설치법은 "구글시트_연동_설치안내.md" 참고.
 *
 * 시트(탭) 구조 — 스프레드시트에 아래 이름의 탭을 만들어 두세요(없으면 자동 생성):
 *   daily     : 날짜 | 학급 | 정원 | R | A | S | 예술종류 | 학생기획 | 다꿈누리 | 메모
 *   proposals : id | 시각 | 영역 | 제목 | 제안자 | 금액 | 대상학급 | 사유 | 상태 | 찬성
 *   feedback  : 시각 | 출처 | 발견 | 조치 | 결정 | 이유 | 결과
 *   survey    : 시각 | 대상 | 언어 | 문항1..9 | 자유응답
 * ------------------------------------------------------------
 */

// 아무나 URL을 알아도 함부로 못 쓰게 하는 간단한 열쇠말. 학교에서 바꿔 쓰세요.
const SECRET = 'maehwa-2027';

function doGet(e) {
  try {
    if ((e.parameter.key || '') !== SECRET) return _json({ error: '열쇠말이 틀렸습니다' });
    const tab = e.parameter.tab || 'daily';
    return _json({ ok: true, tab: tab, rows: _read(tab) });
  } catch (err) {
    return _json({ error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if ((body.key || '') !== SECRET) return _json({ error: '열쇠말이 틀렸습니다' });
    const tab = body.tab || 'daily';
    const sheet = _sheet(tab);

    if (body.action === 'append') {
      // 한 줄 추가. body.row는 {열이름: 값} 객체
      const headers = _headers(sheet);
      const line = headers.map(function (h) { return body.row[h] != null ? body.row[h] : ''; });
      sheet.appendRow(line);
      return _json({ ok: true, appended: 1 });
    }

    if (body.action === 'upsertDaily') {
      // 같은 날짜+학급이면 덮어쓰기 (담임이 하루에 여러 번 저장해도 한 줄)
      const headers = _headers(sheet);
      const data = sheet.getDataRange().getValues();
      const di = headers.indexOf('날짜'), ci = headers.indexOf('학급');
      const line = headers.map(function (h) { return body.row[h] != null ? body.row[h] : ''; });
      for (var r = 1; r < data.length; r++) {
        if (data[r][di] == body.row['날짜'] && data[r][ci] == body.row['학급']) {
          sheet.getRange(r + 1, 1, 1, headers.length).setValues([line]);
          return _json({ ok: true, updated: r + 1 });
        }
      }
      sheet.appendRow(line);
      return _json({ ok: true, appended: 1 });
    }

    if (body.action === 'vote') {
      const headers = _headers(sheet);
      const data = sheet.getDataRange().getValues();
      const idi = headers.indexOf('id'), vi = headers.indexOf('찬성');
      for (var r = 1; r < data.length; r++) {
        if (String(data[r][idi]) === String(body.id)) {
          sheet.getRange(r + 1, vi + 1).setValue((Number(data[r][vi]) || 0) + 1);
          return _json({ ok: true, votes: (Number(data[r][vi]) || 0) + 1 });
        }
      }
      return _json({ error: '제안을 찾지 못함' });
    }

    if (body.action === 'setStatus') {
      const headers = _headers(sheet);
      const data = sheet.getDataRange().getValues();
      const idi = headers.indexOf('id'), si = headers.indexOf('상태');
      for (var r = 1; r < data.length; r++) {
        if (String(data[r][idi]) === String(body.id)) {
          sheet.getRange(r + 1, si + 1).setValue(body.status);
          return _json({ ok: true });
        }
      }
      return _json({ error: '제안을 찾지 못함' });
    }

    return _json({ error: '알 수 없는 action' });
  } catch (err) {
    return _json({ error: String(err) });
  }
}

// ── 도우미 ──
function _ss() { return SpreadsheetApp.getActiveSpreadsheet(); }
function _sheet(tab) {
  var sh = _ss().getSheetByName(tab);
  if (!sh) { sh = _ss().insertSheet(tab); _seedHeaders(sh, tab); }
  _forceText(sh);
  return sh;
}
function _headers(sheet) { return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String); }
function _read(tab) {
  var sh = _sheet(tab);
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(String);
  return data.slice(1).map(function (row) {
    var o = {}; headers.forEach(function (h, i) { o[h] = row[i]; }); return o;
  });
}
function _seedHeaders(sh, tab) {
  var H = {
    daily: ['날짜', '학급', '정원', 'R', 'A', 'S', '예술종류', '학생기획', '다꿈누리', '메모'],
    proposals: ['id', '시각', '영역', '제목', '제안자', '금액', '대상학급', '사유', '상태', '찬성'],
    feedback: ['시각', '출처', '발견', '조치', '결정', '이유', '결과'],
    survey: ['시각', '대상', '언어', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', '자유응답'],
  };
  if (H[tab]) sh.getRange(1, 1, 1, H[tab].length).setValues([H[tab]]);
}

// 학급("3-1")·날짜가 숫자/날짜로 자동변환되지 않도록 시트 전체를 텍스트 서식으로 고정
function _forceText(sh){
  try{
    var cols = sh.getMaxColumns();
    sh.getRange(1,1,sh.getMaxRows(),cols).setNumberFormat('@');
  }catch(e){}
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
