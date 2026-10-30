const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const STORE = 'juru_vvip_v1';
let state = JSON.parse(localStorage.getItem(STORE) || '{"fixtures":[],"slip":[],"saved":[],"apiUrl":"","apiKey":""}');
const save = () => localStorage.setItem(STORE, JSON.stringify(state));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => Number(n || 0).toFixed(2);
function go(page){ $$('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${page}`)); $$('.nav').forEach(b=>b.classList.toggle('active',b.dataset.page===page)); $('#pageTitle').textContent=({dashboard:'Dashboard',fixtures:'Fixtures & Markets',slip:'My Bet Slip',saved:'Saved Slips',settings:'Settings / API',admin:'Owner Panel'})[page]||'Dashboard'; $('#sidebar').classList.remove('open'); render(); }
$$('[data-page]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
$('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');
$('#quickSlip').onclick=()=>go('slip');
function oddsTotal(){return state.slip.reduce((a,p)=>a*Number(p.odds),1)}
function render(){
 const count=state.slip.length, total=oddsTotal();
 $('#slipCount').textContent=count; $('#topSlipCount').textContent=count;
 $('#statSelections').textContent=count; $('#statOdds').textContent=money(total); $('#statSaved').textContent=state.saved.length;
 $('#statApi').textContent=state.apiUrl?'Connected*':'Not set';
 $('#adminFixtures').textContent=state.fixtures.length; $('#adminSaved').textContent=state.saved.length; $('#adminPicks').textContent=count;
 renderFixtures(); renderSlip(); renderSaved();
}
function renderFixtures(){
 const q=($('#fixtureSearch')?.value||'').toLowerCase(), league=$('#leagueFilter').value;
 const leagues=[...new Set(state.fixtures.map(f=>f.league).filter(Boolean))];
 $('#leagueFilter').innerHTML='<option value="">All leagues</option>'+leagues.map(l=>`<option ${l===league?'selected':''}>${esc(l)}</option>`).join('');
 const list=state.fixtures.filter(f=>(!league||f.league===league)&&(`${f.home} ${f.away} ${f.league}`.toLowerCase().includes(q)));
 $('#fixtureList').innerHTML=list.map(f=>`<article class="fixture-card"><div class="fixture-meta"><span>${esc(f.league||'FRIENDLY')}</span><span>${esc(f.date||'Date not set')}</span></div><div class="teams">${esc(f.home)} <span class="muted">vs</span> ${esc(f.away)}</div><div class="markets">${f.markets.map((m,i)=>{let selected=state.slip.some(p=>p.fixtureId===f.id&&p.marketIndex===i);return `<button class="market-btn ${selected?'selected':''}" data-fixture="${f.id}" data-market="${i}">${esc(m.name)} <b>${money(m.odds)}</b></button>`}).join('')}</div></article>`).join('');
 $('#noFixtures').classList.toggle('hidden',list.length!==0);
 $$('.market-btn').forEach(b=>b.onclick=()=>togglePick(b.dataset.fixture,Number(b.dataset.market)));
}
function togglePick(id,index){
 const f=state.fixtures.find(x=>x.id===id); if(!f)return;
 const existing=state.slip.findIndex(p=>p.fixtureId===id);
 if(existing>=0){if(state.slip[existing].marketIndex===index)state.slip.splice(existing,1);else state.slip[existing]={fixtureId:id,marketIndex:index,home:f.home,away:f.away,league:f.league,market:f.markets[index].name,odds:f.markets[index].odds};}
 else {state.slip.push({fixtureId:id,marketIndex:index,home:f.home,away:f.away,league:f.league,market:f.markets[index].name,odds:f.markets[index].odds});}
 save();render();
}
function renderSlip(){
 const n=state.slip.length,total=oddsTotal();
 $('#slipPanelCount').textContent=`${n} PICKS`;$('#sumSelections').textContent=n;$('#sumOdds').textContent=money(total);
 $('#potentialReturn').textContent=money(Math.max(0,Number($('#stake').value||0))*total);
 $('#slipItems').innerHTML=n?state.slip.map((p,i)=>`<div class="slip-item"><div><b>${esc(p.home)} vs ${esc(p.away)}</b><small>${esc(p.market)} • ${esc(p.league||'Match')}</small></div><div><b>${money(p.odds)}</b><button class="remove-pick" data-remove="${i}" aria-label="Remove selection">×</button></div></div>`).join(''):'<div class="empty">Your slip is empty. Go to Fixtures & Markets and tap an outcome.</div>';
 $$('[data-remove]').forEach(b=>b.onclick=()=>{state.slip.splice(Number(b.dataset.remove),1);save();render()});
}
function renderSaved(){
 $('#savedList').innerHTML=state.saved.map((s,i)=>`<div class="saved-card"><div class="saved-info"><b>${esc(s.name)}</b><small>${s.picks.length} selections • Combined odds ${money(s.odds)} • ${esc(s.date)}</small></div><button class="outline" data-open="${i}">OPEN</button><button class="outline danger" data-delete="${i}">DELETE</button></div>`).join('');
 $('#noSaved').classList.toggle('hidden',state.saved.length>0);
 $$('[data-open]').forEach(b=>b.onclick=()=>{state.slip=state.saved[Number(b.dataset.open)].picks.map(p=>({...p}));save();go('slip')});
 $$('[data-delete]').forEach(b=>b.onclick=()=>{state.saved.splice(Number(b.dataset.delete),1);save();render()});
}
$('#stake').addEventListener('input',renderSlip);
$('#clearSlip').onclick=()=>{if(confirm('Clear all current selections?')){state.slip=[];save();render()}};
$('#saveSlip').onclick=()=>{if(!state.slip.length){alert('Add at least one selection first.');return}const name=prompt('Name this slip:','My JURU VVIP slip');if(!name)return;state.saved.unshift({name,picks:state.slip.map(p=>({...p})),odds:oddsTotal(),date:new Date().toLocaleString()});save();render();alert('Slip saved on this device.');};
$('#addFixtureBtn').onclick=()=>$('#fixtureDialog').showModal();
$('#addMarket').onclick=()=>{const d=document.createElement('div');d.className='market-input';d.innerHTML='<input class="market-name" required placeholder="Market / outcome"><input class="market-odds" required type="number" min="1.01" step="0.01" placeholder="Odds"><button type="button" class="remove-market">×</button>';$('#marketFields').append(d);bindRemove()};
function bindRemove(){$$('.remove-market').forEach(b=>b.onclick=()=>{if($$('.market-input').length>1)b.parentElement.remove()})}bindRemove();
$('#fixtureForm').addEventListener('submit',e=>{e.preventDefault();const markets=$$('.market-input').map(row=>({name:row.querySelector('.market-name').value.trim(),odds:Number(row.querySelector('.market-odds').value)}));if(markets.some(m=>!m.name||m.odds<1.01||!Number.isFinite(m.odds))){alert('Enter a market name and valid odds (1.01 or higher).');return}state.fixtures.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),home:$('#homeTeam').value.trim(),away:$('#awayTeam').value.trim(),league:$('#league').value.trim(),date:$('#matchDate').value,markets});save();$('#fixtureForm').reset();$('#marketFields').innerHTML='<div class="market-input"><input class="market-name" required placeholder="Market / outcome (e.g. Home win)"><input class="market-odds" required type="number" min="1.01" step="0.01" placeholder="Odds"><button type="button" class="remove-market">×</button></div>';bindRemove();$('#fixtureDialog').close();go('fixtures')});
$('#fixtureSearch').oninput=renderFixtures;$('#leagueFilter').onchange=renderFixtures;
$('#saveApi').onclick=()=>{state.apiUrl=$('#apiUrl').value.trim();state.apiKey=$('#apiKey').value.trim();save();$('#apiMessage').textContent='Settings saved in this browser. For production, keep secret keys on a backend.';render()};
$('#testApi').onclick=async()=>{const url=$('#apiUrl').value.trim(),key=$('#apiKey').value.trim();if(!url){$('#apiMessage').textContent='Enter an API endpoint first.';return}$('#apiMessage').textContent='Connecting…';try{const res=await fetch(url,{headers:key?{Authorization:`Bearer ${key}`}:{}});if(!res.ok)throw new Error(`HTTP ${res.status}`);const data=await res.json();const rows=Array.isArray(data)?data:(data.fixtures||data.events||data.data);if(!Array.isArray(rows))throw new Error('Response is not a fixture array. See the expected format above.');let added=0;rows.forEach(r=>{if(!r.home||!r.away||!Array.isArray(r.markets))return;state.fixtures.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+added),home:r.home,away:r.away,league:r.league||'',date:r.date||'',markets:r.markets.filter(m=>m.name&&Number(m.odds)>=1.01).map(m=>({name:m.name,odds:Number(m.odds)}))});added++});state.apiUrl=url;state.apiKey=key;save();render();$('#apiMessage').textContent=`Loaded ${added} fixture(s).`;}catch(err){$('#apiMessage').textContent=`Could not load data: ${err.message}. Check URL, API key and CORS settings.`}};
$('#resetData').onclick=()=>{if(confirm('Permanently clear JURU VVIP data saved in this browser?')){localStorage.removeItem(STORE);state={fixtures:[],slip:[],saved:[],apiUrl:'',apiKey:''};$('#apiUrl').value='';$('#apiKey').value='';render();alert('Local data cleared.')}};
$('#apiUrl').value=state.apiUrl||'';$('#apiKey').value=state.apiKey||'';$('#year').textContent=new Date().getFullYear();render();