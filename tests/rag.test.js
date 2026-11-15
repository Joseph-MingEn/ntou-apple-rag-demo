const test = require('node:test');
const assert = require('node:assert/strict');
const {vectorize, cosine, MinHeap, search, documents, recommend,topics} = require('../rag.js');
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
  assert.ok(found.results.every(x=>x.score>=0.3 && /^https:\/\/(www\.apple\.com\/tw\/|support\.apple\.com\/zh-tw\/)/.test(x.url)));
  assert.equal(found.steps.at(-1).type,'ANSWER');
  assert.equal(search('火星上的香蕉').results.length,0);
  assert.ok(documents.length>=8);
});
test('知識庫包含 1000 筆唯一、可追溯且均參與比對的資料', () => {
  assert.equal(topics.length,100); assert.equal(vectorize('iPhone 相機').length,100);
  assert.equal(documents.length, 1000);
  assert.equal(new Set(documents.map(d => d.id)).size, 1000);
  assert.equal(new Set(documents.map(d => d.text)).size, 1000);
  assert.ok(documents.every(d => d.text && d.keywords && d.title && /^https:\/\/(www\.apple\.com\/tw\/|support\.apple\.com\/zh-tw\/)/.test(d.url)));
  const run=search('AirPods 降噪');
  assert.equal(run.steps.filter(s => s.doc !== undefined).length, 1000);
  assert.equal(run.steps.filter(s => s.doc !== undefined).at(-1).doc, 999);
  assert.ok(documents.some(d=>d.url.includes('/nccid/') && d.text.includes('A3714')));
  assert.ok(new Set(documents.map(d => d.url)).size >= 8);
  const ranked=search('MacBook Air 尺寸',10).results;
  assert.equal(new Set(ranked.map(d=>d.factId)).size,ranked.length);
});
test('歷代產品能依指定世代找到官方技術規格',()=>{
  for(const [question, expected] of [['iPhone 13 晶片','A15'],['iPhone 14 相機幾萬像素','1200 萬像素'],['iPhone 15 Pro 晶片','A17 Pro'],['iPhone 16 Pro 晶片','A18 Pro'],['iPad Air 第 5 代 晶片','M1'],['MacBook Air M3 晶片','M3'],['Apple Watch Series 9 晶片','S9'],['AirPods Pro 2 降噪','降噪']]) {
    const results=search(question,2).results; assert.ok(results.some(d=>d.text.includes(expected)),question); assert.ok(results.some(d=>d.url.startsWith('https://support.apple.com/zh-tw/')),question);
  }
  assert.ok(search('iPhone 15 晶片',2).results.every(d=>!/iPhone 15 Pro/.test(d.text)));
});
test('各產品與功能問題可找到相關資訊', () => {
  for (const [q, term] of [['iPad 晶片','A16'],['AirPods 降噪','降噪'],['MacBook Air 尺寸','13 吋'],['Apple Watch 換購','換購']]) {
    assert.ok(search(q).results.some(d=>d.text.includes(term)), q);
  }
});

test('檢索會區分產品內的具體功能，避免只因產品名稱得高分',()=>{
  assert.ok(search('AirPods 降噪').results.every(d=>d.text.includes('降噪')));
  assert.ok(search('iPhone 相機').results.every(d=>/相機|鏡頭|攝影/.test(d.text)));
  assert.ok(search('Apple Watch 睡眠').results.every(d=>d.text.includes('睡眠')));
});

test('價格、其他品牌及未收錄規格不應憑產品類別回答',()=>{
  for(const q of ['iPhone 價格多少錢','Samsung 手機','Android 手機','iPhone 支援衛星網路嗎']) assert.equal(search(q).results.length,0,q);
});
test('型號與像素資訊可區分相似的產品文件',()=>{
  const results=search('iPhone 18 Pro 相機幾萬像素').results;
  assert.ok(results.length); assert.match(results[0].text,/4800\s*萬像素/);
  assert.ok(results.every(d=>d.text.includes('iPhone 18 Pro')));
  const cert=search('iPhone 18 Pro 型號 NCC 認證').results;
  assert.ok(cert.some(d=>d.text.includes('A3714')));
  assert.ok(cert.every(d=>!d.text.includes('iPhone 18 Pro Max')));
});
test('整理回答根據證據回答是或否，並保留來源',()=>{
  const {answer,results}=search('AirPods 有降噪嗎？');
  assert.match(answer,/有/); assert.ok(results.some(d=>answer.includes(d.id)));
  assert.match(search('Samsung 手機').answer,/無法/);
});

test('需求推薦可指出符合用途的產品與真實知識庫依據',()=>{
  const laptop=recommend('我需要輕巧筆電帶去上課');
  assert.ok(laptop.some(p=>p.name==='MacBook Air'));
  const noise=recommend('我需要降噪耳機');
  assert.ok(noise.some(p=>p.name==='AirPods Pro 3'));
  assert.ok(noise.every(p=>p.evidence.length && p.evidence.every(d=>documents.includes(d))));
  assert.deepEqual(recommend('火星上的香蕉'),[]);
  assert.deepEqual(recommend('Samsung 手機'),[]);
  assert.deepEqual(recommend('多少錢的筆電'),[]);
  assert.deepEqual(recommend(''),[]);
});
test('指定具體型號時不應推薦其他型號',()=>{
  for(const query of ['MacBook PRO','macbookpro','想要 MacBook Pro 做影片剪輯']) {
    const results=recommend(query);
    assert.ok(results.length>0,query);
    assert.ok(results.every(p=>p.name==='MacBook Pro'),query);
    assert.ok(results[0].evidence.some(d=>d.text.includes('MacBook Pro')));
  }
  assert.ok(recommend('MacBook Air').every(p=>p.name==='MacBook Air'));
  assert.deepEqual(recommend('iPhone 17'),[]);
  assert.deepEqual(recommend('iPad mini'),[]);
});
