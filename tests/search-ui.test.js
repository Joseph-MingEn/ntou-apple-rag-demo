const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const rag = require('../rag.js');
const app = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
function setup() {
  const elements = {};
  const get = s => elements[s] ||= {value:'', textContent:'', innerHTML:'', listeners:{}, addEventListener(type, callback){this.listeners[type]=callback}};
  get('#query').value = 'iPad 使用什麼晶片？';
  const example = {dataset:{query:'AirPods 有降噪嗎？'},addEventListener(type, callback){this.callback=callback}};
  vm.runInNewContext(app,{RAG:rag,document:{querySelector:get,querySelectorAll:()=>[example]}});
  return {get,example};
}
test('送出問題後立即顯示答案與完整比對統計，並移除控制列',()=>{
  const {get}=setup(); get('#query').value='MacBook Air 尺寸'; get('#form').listeners.submit({preventDefault(){}});
  assert.match(get('#answer').innerHTML,/13 吋/);
  assert.equal(get('#compared').textContent,50);
  assert.doesNotMatch(html,/class="controls"/);
});
test('範例問題立即顯示答案，空白問題提示且保留結果',()=>{
  const {get,example}=setup(); example.callback(); assert.match(get('#answer').innerHTML,/降噪/);
  get('#query').value='   '; get('#form').listeners.submit({preventDefault(){}});
  assert.match(get('#error').textContent,/輸入問題/); assert.match(get('#answer').innerHTML,/降噪/);
});
