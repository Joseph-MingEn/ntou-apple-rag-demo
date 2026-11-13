(function(root){
const topics=[['iPhone',['iphone','手機']],['iPad',['ipad','平板']],['Mac',['mac','筆電','電腦']],['Watch',['watch','手錶','手錶']],['AirPods',['airpods','耳機','降噪']],['Apple TV',['apple tv','電視']],['晶片',['晶片','處理器','效能','a16']],['換購',['換購','折抵','舊機']]];
const documents=[
{id:'D1',text:'iPad 配備 A16 晶片，起始儲存空間加倍。',keywords:'ipad 平板 晶片 a16',url:'https://www.apple.com/tw/',title:'Apple 台灣首頁 · iPad'},
{id:'D2',text:'MacBook Neo 是 Mac 系列的筆記型電腦。',keywords:'mac 筆電 電腦 macbook neo',url:'https://www.apple.com/tw/',title:'Apple 台灣首頁 · MacBook Neo'},
{id:'D3',text:'AirPods Pro 3 是入耳式耳機，提供主動式降噪。',keywords:'airpods 耳機 降噪 pro 3',url:'https://www.apple.com/tw/',title:'Apple 台灣首頁 · AirPods Pro 3'},
{id:'D4',text:'Apple Watch Series 12 提供心率感測功能。',keywords:'watch 手錶 心率',url:'https://www.apple.com/tw/',title:'Apple 台灣首頁 · Apple Watch'},
{id:'D5',text:'iPhone 18 Pro 是 Apple 的 iPhone 產品。',keywords:'iphone 手機 18 pro',url:'https://www.apple.com/tw/',title:'Apple 台灣首頁 · iPhone 18 Pro'},
{id:'D6',text:'iPhone Duo 是 Apple 的 iPhone 產品。',keywords:'iphone 手機 duo',url:'https://www.apple.com/tw/',title:'Apple 台灣首頁 · iPhone Duo'},
{id:'D7',text:'Apple TV 4K 是 Apple 的家庭娛樂裝置。',keywords:'apple tv 電視 4k',url:'https://www.apple.com/tw/',title:'Apple 台灣首頁 · Apple TV 4K'},
{id:'D8',text:'符合條件的裝置可以換購下一部 iPhone，享有折抵優惠；實際條件請以 Apple 官網為準。',keywords:'iphone 手機 換購 折抵 舊機',url:'https://www.apple.com/tw/',title:'Apple 台灣首頁 · 換購方案'}];
function vectorize(text){const t=text.toLowerCase();return topics.map(([,words])=>words.reduce((n,w)=>n+(t.includes(w)?1:0),0));}
function cosine(a,b){const dot=a.reduce((s,x,i)=>s+x*b[i],0),m=Math.hypot(...a)*Math.hypot(...b);return m?dot/m:0;}
class MinHeap{constructor(k){this.k=k;this.items=[]} offer(x){const a=this.items;if(a.length<this.k){a.push(x);let i=a.length-1;while(i>0){let p=Math.floor((i-1)/2);if(a[p].score<=a[i].score)break;[a[p],a[i]]=[a[i],a[p]];i=p}return 'PUSH'}if(x.score<=a[0].score)return 'SKIP';a[0]=x;let i=0;while(true){let l=2*i+1,r=l+1,s=i;if(l<a.length&&a[l].score<a[s].score)s=l;if(r<a.length&&a[r].score<a[s].score)s=r;if(s===i)break;[a[i],a[s]]=[a[s],a[i]];i=s}return 'REPLACE'}}
function search(query,k=2,threshold=.3){const vector=vectorize(query),heap=new MinHeap(k),steps=[{type:'EMBED',heap:[],message:'以主題關鍵字計數建立問題向量。'}];let rejected=0,best=0;documents.forEach((d,i)=>{const score=cosine(vector,vectorize(d.keywords));best=Math.max(best,score);let type;if(score<threshold){type='FILTER';rejected++}else type=heap.offer({...d,score});steps.push({type,doc:i,score,heap:heap.items.map(x=>({...x})),rejected,best,message:type==='FILTER'?'低於門檻，不加入堆積。':type==='PUSH'?'堆積未滿，加入候選資料。':type==='REPLACE'?'比堆頂更相關，取代最低分。':'未超過堆頂，保留目前候選資料。'});});const results=[...heap.items].sort((a,b)=>b.score-a.score);steps.push({type:'PROMPT',heap:[...heap.items],rejected,best,message:'將問題與選出的資料組成提示詞。'});steps.push({type:'ANSWER',heap:[...heap.items],rejected,best,message:results.length?'依據選出的資料整理回答並附上來源。':'沒有達到門檻的資料，無法根據資料回答。'});return{vector,results,steps,threshold,k,query}}
const api={topics,documents,vectorize,cosine,MinHeap,search};if(typeof module!=='undefined')module.exports=api;else root.RAG=api;
})(globalThis);
