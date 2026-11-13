const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
test('頁面說明 RAG 三階段與示範限制，右上角連到專案儲存庫', () => {
  assert.match(html, /<header[^>]*>[\s\S]*?href="https:\/\/github\.com\/Joseph-MingEn\/ntou-apple-rag-demo"[\s\S]*?<\/header>/);
  for (const text of ['檢索 Retrieval','增強 Augmentation','生成 Generation','沒有呼叫大型語言模型']) assert.ok(html.includes(text), text);
});
test('回答優先於檢索過程，知識庫預設收合且可展開', () => {
  assert.ok(html.indexOf('class="answer-card"') < html.indexOf('class="main-panel"'));
  assert.match(html, /<details class="knowledge"\s*>\s*<summary[\s\S]*?DOCUMENTS[\s\S]*?<\/summary>\s*<div id="documents" class="documents"><\/div>\s*<\/details>/);
});
