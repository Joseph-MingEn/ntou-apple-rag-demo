const test = require('node:test');
const assert = require('node:assert/strict');
const {vectorize, cosine, MinHeap, search, documents, recommend} = require('../rag.js');
test('關鍵字向量識別產品及主題，未知文字為零向量', () => {
  assert.ok(vectorize('iPad 使用什麼晶片')[1] > 0);
  assert.ok(vectorize('iPad 使用什麼晶片')[6] > 0);
  assert.ok(vectorize('火星上的香蕉').every(x => x === 0));
});
test('餘弦相似度處理零向量與相同向量', () => {
  assert.equal(cosine([0,0],[1,0]), 0);
  assert.equal(cosine([1,0],[1,0]), 1);
});
test('最小堆積保留最高 k 筆並維持堆頂最低', () => {
  const h = new MinHeap(2); [0.4,0.9,0.7,0.2].forEach((score,i)=>h.offer({id:String(i),score}));
  assert.deepEqual(h.items.map(x=>x.score).sort(), [0.7,0.9]);
  assert.equal(h.items[0].score,0.7);
});
test('搜尋提供追溯來源、步驟且排除無關問題', () => {
  const found=search('iPad 晶片');
  assert.ok(found.results.some(x=>x.id==='D1'));
  assert.ok(found.results.every(x=>x.score>=0.3 && x.url.startsWith('https://www.apple.com/tw/')));
  assert.equal(found.steps.at(-1).type,'ANSWER');
  assert.equal(search('火星上的香蕉').results.length,0);
  assert.ok(documents.length>=8);
});
test('知識庫包含 200 筆唯一、可追溯且均參與比對的資料', () => {
  assert.equal(documents.length, 200);
  assert.equal(new Set(documents.map(d => d.id)).size, 200);
  assert.ok(documents.every(d => d.text && d.keywords && d.title && /^https:\/\/www\.apple\.com\/tw\//.test(d.url)));
  const run=search('AirPods 降噪');
  assert.equal(run.steps.filter(s => s.doc !== undefined).length, 200);
  assert.equal(run.steps.filter(s => s.doc !== undefined).at(-1).doc, 199);
});
test('各產品與功能問題可找到相關資訊', () => {
  for (const [q, term] of [['iPad 晶片','A16'],['AirPods 降噪','降噪'],['MacBook Air 尺寸','13 吋'],['Apple Watch 換購','換購']]) {
    assert.ok(search(q).results.some(d=>d.text.includes(term)), q);
  }
});

test('需求推薦可指出符合用途的產品與真實知識庫依據',()=>{
  const laptop=recommend('我需要輕巧筆電帶去上課');
  assert.ok(laptop.some(p=>p.name==='MacBook Air'));
  const noise=recommend('我需要降噪耳機');
  assert.ok(noise.some(p=>p.name==='AirPods Pro 3'));
  assert.ok(noise.every(p=>p.evidence.length && p.evidence.every(d=>documents.includes(d))));
  assert.deepEqual(recommend('火星上的香蕉'),[]);
  assert.deepEqual(recommend(''),[]);
});
