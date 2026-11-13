const test = require('node:test');
const assert = require('node:assert/strict');
const {vectorize, cosine, MinHeap, search, documents} = require('../rag.js');
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
