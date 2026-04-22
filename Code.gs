// ============================================================
//  QR RUNDOWN — BIRO PROTOKOL
//  Google Apps Script Backend
// ============================================================

const SHEET_ID = '1WcVWRb-r3lB4BY9ZrXOCdt9GKMvtKJ_app19nwvLMbY';

const TAB_STAF  = 'Staf';
const TAB_ACARA = 'Acara';
const TAB_LOG   = 'Log';

// ─── ENTRY POINT ────────────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action || '';
  const params = e.parameter;
  let result;
  try {
    switch (action) {
      case 'getStaf':  result = getStaf();        break;
      case 'getAcara': result = getAcara();        break;
      case 'getLog':   result = getLog();          break;
      case 'verify':   result = verify(params);    break;
      default:         result = { ok: false, msg: 'Action tidak dikenal' };
    }
  } catch (err) {
    result = { ok: false, msg: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const body   = JSON.parse(e.postData.contents);
  const action = body.action || '';
  let result;
  try {
    switch (action) {
      case 'addStaf':      result = addStaf(body);      break;
      case 'delStaf':      result = delStaf(body);      break;
      case 'editStaf':     result = editStaf(body);     break;
      case 'addAcara':     result = addAcara(body);     break;
      case 'delAcara':     result = delAcara(body);     break;
      case 'editAcara':    result = editAcara(body);    break;
      case 'resetExpiry':  result = resetExpiry(body);  break;
      case 'clearLog':     result = clearLog();         break;
      default:             result = { ok: false, msg: 'Action tidak dikenal' };
    }
  } catch (err) {
    result = { ok: false, msg: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── SETUP SHEET ────────────────────────────────────────────
// !! Jalankan sekali untuk membuat tab baru dengan kolom yang benar !!
// Kolom Acara: id | nama | tanggal | driveUrl | expiryDays | expiryAt | usedBy | createdAt
function setupSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  let stafSheet = ss.getSheetByName(TAB_STAF);
  if (!stafSheet) {
    stafSheet = ss.insertSheet(TAB_STAF);
    stafSheet.appendRow(['id', 'nama', 'email', 'createdAt']);
    stafSheet.getRange(1,1,1,4).setFontWeight('bold').setBackground('#1D4E2E').setFontColor('#fff');
    [
      ['s_alifah','Alifah Robiatula','alifahrobiatula@gmail.com'],
      ['s_azkal', 'Azkal Faiz',      'azkalfaiz27@gmail.com'],
      ['s_kirana','Kirana Pram',      'kiranaprammm@gmail.com'],
      ['s_mega',  'Mega Putri',       'megaputri66@gmail.com'],
      ['s_novita','Novita Khoiriyah', 'novitakhoiriyah@gmail.com'],
    ].forEach(r => stafSheet.appendRow([...r, new Date().toISOString()]));
  }

  let acaraSheet = ss.getSheetByName(TAB_ACARA);
  if (!acaraSheet) {
    acaraSheet = ss.insertSheet(TAB_ACARA);
    acaraSheet.appendRow(['id','nama','tanggal','driveUrl','expiryDays','expiryAt','usedBy','createdAt']);
    acaraSheet.getRange(1,1,1,8).setFontWeight('bold').setBackground('#1D4E2E').setFontColor('#fff');
  }

  let logSheet = ss.getSheetByName(TAB_LOG);
  if (!logSheet) {
    logSheet = ss.insertSheet(TAB_LOG);
    logSheet.appendRow(['ts','email','acara','ok','alasan']);
    logSheet.getRange(1,1,1,5).setFontWeight('bold').setBackground('#1D4E2E').setFontColor('#fff');
  }

  return { ok: true, msg: 'Sheet berhasil dibuat!' };
}

// ─── STAF ────────────────────────────────────────────────────
function getStaf() {
  const sheet = getSheet(TAB_STAF);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { ok: true, data: [] };
  return { ok: true, data: rows.slice(1).map(r => ({ id:r[0], nama:r[1], email:r[2], createdAt:r[3] })) };
}

function addStaf(body) {
  const { nama, email } = body;
  if (!nama || !email) throw new Error('Nama dan email wajib diisi');
  const sheet  = getSheet(TAB_STAF);
  const rows   = sheet.getDataRange().getValues();
  if (rows.slice(1).find(r => r[2].toLowerCase() === email.toLowerCase()))
    throw new Error('Email sudah terdaftar');
  const id = 's_' + Date.now();
  sheet.appendRow([id, nama, email.toLowerCase(), new Date().toISOString()]);
  return { ok: true, id };
}

function delStaf(body) {
  deleteRowById(TAB_STAF, body.id, 0);
  return { ok: true };
}

function editStaf(body) {
  const { id, nama, email } = body;
  if (!nama || !email) throw new Error('Nama dan email wajib diisi');
  const sheet = getSheet(TAB_STAF);
  const rows  = sheet.getDataRange().getValues();
  const idx   = rows.findIndex(r => r[0] === id);
  if (idx < 1) throw new Error('Staf tidak ditemukan');
  sheet.getRange(idx+1, 2).setValue(nama);
  sheet.getRange(idx+1, 3).setValue(email.toLowerCase());
  return { ok: true };
}

// ─── ACARA ───────────────────────────────────────────────────
function getAcara() {
  const sheet = getSheet(TAB_ACARA);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { ok: true, data: [] };
  const now  = Date.now();
  const data = rows.slice(1).map(r => {
    const expiryAt   = r[5] ? new Date(r[5]).getTime() : 0;
    const isExpired  = expiryAt > 0 && now > expiryAt;
    return {
      id: r[0], nama: r[1], tanggal: r[2], driveUrl: r[3],
      expiryDays: Number(r[4]),
      expiryAt:   r[5] || '',
      usedBy:     safeParseJSON(r[6], {}),
      createdAt:  r[7],
      isExpired
    };
  });
  return { ok: true, data };
}

function addAcara(body) {
  const { nama, tanggal, driveUrl, expiryDays } = body;
  if (!nama || !driveUrl) throw new Error('Nama dan link Drive wajib diisi');
  const days     = Number(expiryDays) || 1;
  const now      = new Date();
  // expiryDays 0 = one-time (tanpa batas waktu tapi tiap email hanya sekali)
  const expiryAt = days > 0
    ? new Date(now.getTime() + days * 86400000).toISOString()
    : '';
  const id = 'e_' + Date.now();
  getSheet(TAB_ACARA).appendRow([id, nama, tanggal||'', driveUrl, days, expiryAt, '{}', now.toISOString()]);
  return { ok: true, id };
}

function delAcara(body) {
  deleteRowById(TAB_ACARA, body.id, 0);
  return { ok: true };
}

function editAcara(body) {
  const { id, nama, tanggal, driveUrl } = body;
  if (!nama || !driveUrl) throw new Error('Nama dan link Drive wajib diisi');
  const sheet = getSheet(TAB_ACARA);
  const rows  = sheet.getDataRange().getValues();
  const idx   = rows.findIndex(r => r[0] === id);
  if (idx < 1) throw new Error('Acara tidak ditemukan');
  sheet.getRange(idx+1, 2).setValue(nama);
  sheet.getRange(idx+1, 3).setValue(tanggal||'');
  sheet.getRange(idx+1, 4).setValue(driveUrl);
  return { ok: true };
}

// Reset/perpanjang expiry QR dari sekarang + reset usedBy
function resetExpiry(body) {
  const { id, expiryDays } = body;
  const days  = Number(expiryDays) || 1;
  const sheet = getSheet(TAB_ACARA);
  const rows  = sheet.getDataRange().getValues();
  const idx   = rows.findIndex(r => r[0] === id);
  if (idx < 1) throw new Error('Acara tidak ditemukan');
  const now      = new Date();
  const expiryAt = days > 0 ? new Date(now.getTime() + days * 86400000).toISOString() : '';
  sheet.getRange(idx+1, 5).setValue(days);       // expiryDays
  sheet.getRange(idx+1, 6).setValue(expiryAt);   // expiryAt
  sheet.getRange(idx+1, 7).setValue('{}');        // reset usedBy
  sheet.getRange(idx+1, 8).setValue(now.toISOString()); // createdAt baru
  return { ok: true, expiryAt };
}

// ─── VERIFIKASI ──────────────────────────────────────────────
function verify(params) {
  const eventId = params.eventId;
  const email   = (params.email || '').toLowerCase().trim();
  if (!eventId || !email) throw new Error('Parameter tidak lengkap');

  // Cek staf
  const stafRows = getSheet(TAB_STAF).getDataRange().getValues();
  const staf     = stafRows.slice(1).find(r => r[2].toLowerCase() === email);
  if (!staf) {
    addLog(email, '—', false, 'Email tidak terdaftar sebagai staf');
    return { ok: false, msg: 'Email tidak terdaftar sebagai staf' };
  }

  // Cek acara
  const acaraSheet = getSheet(TAB_ACARA);
  const acaraRows  = acaraSheet.getDataRange().getValues();
  const rowIndex   = acaraRows.findIndex(r => r[0] === eventId);
  if (rowIndex < 1) {
    addLog(email, eventId, false, 'Acara tidak ditemukan');
    return { ok: false, msg: 'Acara tidak ditemukan' };
  }

  const row        = acaraRows[rowIndex];
  const namaAcara  = row[1];
  const driveUrl   = row[3];
  const expiryDays = Number(row[4]);
  const expiryAt   = row[5] ? new Date(row[5]).getTime() : 0;
  const usedBy     = safeParseJSON(row[6], {});

  // Cek expired
  if (expiryAt > 0 && Date.now() > expiryAt) {
    addLog(email, namaAcara, false, 'QR sudah expired');
    return { ok: false, msg: 'QR code sudah expired' };
  }

  // Cek one-time (expiryDays 0)
  if (expiryDays === 0 && usedBy[email]) {
    addLog(email, namaAcara, false, 'Sudah digunakan (one-time)');
    return { ok: false, msg: 'QR sudah pernah digunakan oleh akun ini' };
  }

  // LOLOS
  usedBy[email] = new Date().toISOString();
  acaraSheet.getRange(rowIndex+1, 7).setValue(JSON.stringify(usedBy));
  addLog(email, namaAcara, true, '');
  return { ok: true, driveUrl, namaAcara, stafNama: staf[1] };
}

// ─── LOG ─────────────────────────────────────────────────────
function getLog() {
  const sheet = getSheet(TAB_LOG);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { ok: true, data: [] };
  return { ok: true, data: rows.slice(1).map(r => ({
    ts: r[0], email: r[1], acara: r[2],
    ok: r[3] === true || r[3] === 'TRUE', alasan: r[4]
  }))};
}

function addLog(email, acara, ok, alasan) {
  getSheet(TAB_LOG).appendRow([new Date().toISOString(), email, acara, ok, alasan]);
}

function clearLog() {
  const sheet = getSheet(TAB_LOG);
  const last  = sheet.getLastRow();
  if (last > 1) sheet.deleteRows(2, last - 1);
  return { ok: true };
}

// ─── HELPERS ─────────────────────────────────────────────────
function getSheet(name) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
  if (!sheet) throw new Error('Tab "' + name + '" tidak ditemukan. Jalankan setupSheet() dulu.');
  return sheet;
}

function deleteRowById(tabName, id, colIndex) {
  const sheet = getSheet(tabName);
  const rows  = sheet.getDataRange().getValues();
  const idx   = rows.findIndex(r => r[colIndex] === id);
  if (idx > 0) sheet.deleteRow(idx + 1);
}

function safeParseJSON(val, fallback) {
  try { return JSON.parse(val); } catch { return fallback; }
}
