
var APP_VERSION="14.1.0";
const firebaseConfig={apiKey:"AIzaSyB5oFSIDXhzHaFgTR5cr1LvGHXFNStLSWk",authDomain:"minority-game-45d67.firebaseapp.com",databaseURL:"https://minority-game-45d67-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"minority-game-45d67",storageBucket:"minority-game-45d67.firebasestorage.app",messagingSenderId:"49514258718",appId:"1:49514258718:web:b89014318539af2e13e90f"};
firebase.initializeApp(firebaseConfig);
const db=firebase.database();
const A={el:null,mode:"home",room:"",state:{},ref:null,teacherBuilt:false,studentKey:""};
const BANK=(Array.isArray(window.QUESTION_BANK)?window.QUESTION_BANK:[]).map((x,i)=>({id:x.id||i+1,category:x.category||"기본",q:x.q||x.question||`문제 ${i+1}`,o:(x.o||x.options||["보기 1","보기 2","보기 3"]).slice(0,3)}));
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const now=()=>Date.now();
const ref=(r=A.room)=>db.ref("rooms/"+r);
function sid(){let s=localStorage.getItem("mg14_sid");if(!s){try{s="s_"+crypto.randomUUID()}catch(e){s="s_"+Math.random().toString(36).slice(2)+Date.now()}localStorage.setItem("mg14_sid",s)}return s}
function code(){const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";return Array.from({length:6},()=>c[Math.floor(Math.random()*c.length)]).join("")}
function url(m,r=A.room){return `${location.pathname}?mode=${m}${r?"&room="+encodeURIComponent(r):""}`}
function go(m,r=A.room){location.href=url(m,r)}
function full(m){return location.origin+url(m)}
function qr(u){return "https://api.qrserver.com/v1/create-qr-code/?size=260x260&data="+encodeURIComponent(u)}
function copy(t){navigator.clipboard.writeText(t).then(()=>alert("복사했습니다."))}
function openDisplay(){let w=window.open(full("display"),"_blank");if(!w){copy(full("display"));alert("팝업 차단으로 전자칠판 주소를 복사했습니다.")}}
function settings(s=A.state){return Object.assign({gameMode:"personal",teamCount:4,teamAssign:"choice"},s.settings||{})}
function isTeam(){return settings().gameMode==="team"}
function teamN(){return Math.max(2,Math.min(10,Number(settings().teamCount||4)))}
function teamAssign(){return settings().teamAssign||"choice"}
function counts(s=A.state){let opts=s.options||[], vals=Object.values(s.answers||{});return {counts:opts.map((_,i)=>vals.filter(a=>Number(a.choice)===i).length),total:vals.length}}
function scoreFor(c){let u=[...new Set(c)].sort((a,b)=>a-b);if(u.length===1)return c.map(()=>50);if(u.length===2)return c.map(x=>x===u[0]?50:30);return c.map(x=>x===u[0]?50:x===u[1]?40:30)}
function ranks(s=A.state){return Object.entries(s.scores||{}).map(([id,v])=>({id,name:v.name||"이름없음",team:v.team||"",total:Number(v.total||0),last:Number(v.last||0)})).sort((a,b)=>b.total-a.total)}
function teamStats(){let ps=Object.values(A.state.participants||{}), ss=Object.values(A.state.scores||{}), out=[];for(let i=1;i<=teamN();i++){let mem=ps.filter(p=>String(p.team)===String(i)).length, sc=ss.filter(s=>String(s.team)===String(i)), total=sc.reduce((a,b)=>a+Number(b.total||0),0);out.push({team:String(i),name:i+"조",members:mem,avg:sc.length?Math.round(total/sc.length):0})}return out.sort((a,b)=>b.avg-a.avg)}
function pickTeam(){let ps=Object.values(A.state.participants||{}), min=999, cand=[];for(let i=1;i<=teamN();i++){let n=ps.filter(p=>String(p.team)===String(i)).length;if(n<min){min=n;cand=[String(i)]}else if(n===min)cand.push(String(i))}return cand[Math.floor(Math.random()*cand.length)]||"1"}
function myAns(){let a=(A.state.answers||{})[sid()];return a&&a.choice!==undefined?Number(a.choice):-1}
function err(e){console.error(e);A.el.innerHTML=`<main class="home"><section class="hero"><h1>화면 표시 오류</h1><pre class="errorBox">${esc(e&&e.message?e.message:e)}</pre><button onclick="go('home','')">처음으로</button></section></main>`}
function safe(f){try{f()}catch(e){err(e)}}
function text(id,v){let e=$(id);if(e&&e.textContent!==String(v))e.textContent=String(v)}
function html(id,v){let e=$(id);if(e&&e.innerHTML!==v)e.innerHTML=v}
function init(){A.el=$("app");let p=new URLSearchParams(location.search);A.mode=p.get("mode")||"home";A.room=(p.get("room")||"").toUpperCase();if(A.mode==="teacher")teacher();else if(A.mode==="student")student();else if(A.mode==="display")display();else home()}
function home(){A.el.innerHTML=`<main class="home"><section class="hero"><div class="version">Ultimate v${APP_VERSION}</div><h1>🎮 소수결 게임</h1><p>v14 구조 개편 · 교사용 화면 부분 갱신 · 화면 흔들림 최소화</p><div class="homeGrid"><div class="card"><h2>방 만들기</h2><label>방 이름</label><input id="roomTitle" value="소수결 게임"><label>교사 이름</label><input id="teacherName" placeholder="예: 최정훈"><button id="makeBtn" onclick="makeRoom()">새 방 만들기</button></div><div class="card"><h2>방 참가하기</h2><label>방코드</label><input id="joinCode" placeholder="예: A8KJX2" oninput="this.value=this.value.toUpperCase()"><button class="blue" onclick="join('student')">학생으로 참가</button><button class="ghost" onclick="join('teacher')">교사용으로 열기</button><button class="ghost" onclick="join('display')">전자칠판으로 열기</button></div></div></section></main>`}
async function makeRoom(){let c=code(),b=$("makeBtn");if(b){b.disabled=true;b.textContent="방 만드는 중..."}try{await ref(c).set({title:$("roomTitle")?.value||"소수결 게임",teacher:$("teacherName")?.value||"선생님",appVersion:APP_VERSION,createdAt:now(),settings:{gameMode:"personal",teamCount:4,teamAssign:"choice"},round:0,question:"문제를 열어 주세요.",options:["치킨","피자","떡볶이"],openedAt:0,showResults:false,scored:false,pointMultiplier:1,participants:{},answers:{},scores:{},history:[]});go("teacher",c)}catch(e){alert("방 만들기 실패: "+(e.message||e));if(b){b.disabled=false;b.textContent="새 방 만들기"}}}
function join(m){let c=($("joinCode").value||"").trim().toUpperCase();if(!c)return alert("방코드를 입력해 주세요.");go(m,c)}
function teacher(){if(A.ref)A.ref.off();A.ref=ref();A.ref.on("value",s=>{A.state=s.val()||{};if(!A.teacherBuilt){buildTeacher();A.teacherBuilt=true}updateTeacher()},e=>err(e))}
function draft(){let f=BANK[0]||{q:"문제",o:["보기 1","보기 2","보기 3"]},o=f.o;try{o=JSON.parse(localStorage.getItem("mg14_o_"+A.room)||"null")||f.o}catch(e){}return {q:localStorage.getItem("mg14_q_"+A.room)||f.q,o:[o[0]||"보기 1",o[1]||"보기 2",o[2]||"보기 3"]}}
function saveDraft(){localStorage.setItem("mg14_q_"+A.room,$("question")?.value||"");localStorage.setItem("mg14_o_"+A.room,JSON.stringify([0,1,2].map(i=>$("opt"+i)?.value||`보기 ${i+1}`)))}
function buildTeacher(){let d=draft();A.el.innerHTML=`<main class="dash"><header class="dashHeader"><div><h1>소수결 게임 <span>Ultimate v${APP_VERSION}</span></h1><p>방코드 <b class="code">${A.room}</b> · ${esc(A.state.title||"")}</p></div><button class="ghost" onclick="go('home','')">처음으로</button></header><section class="summary"><div><span>모드</span><b id="mMode"></b></div><div><span>제출</span><b id="mSubmit"></b></div><div><span>접속</span><b id="mJoin"></b></div><div><span>라운드</span><b id="mRound"></b></div></section><section class="card"><div class="stageHead"><h2>학생 접속 현황</h2><div id="joinPill" class="pill"></div></div><div id="partBox"></div></section><section class="card"><h2>수업 설정</h2><div class="settingGrid"><div><label>게임 모드</label><select id="gameMode" onchange="saveSettings()"><option value="personal">개인전</option><option value="team">팀전</option></select></div><div id="teamCountBox"><label>조 개수</label><input id="teamCount" type="number" min="2" max="10" onchange="saveSettings()"></div><div><label>이번 문제 배수</label><input id="mult" type="number" min="1" max="10" onchange="localStorage.setItem('mg14_mult_${A.room}',Math.max(1,Number(this.value)||1));updateTeacher()"></div><div><label>예상 참여 인원</label><input id="expected" type="number" onchange="localStorage.setItem('mg14_expected_${A.room}',this.value);updateTeacher()"></div></div><div id="teamPanel" class="teamPanel"><h3>팀 설정</h3><div class="settingGrid two"><div><label>조 배정 방식</label><select id="teamAssign" onchange="saveSettings()"><option value="choice">학생이 직접 선택</option><option value="random">랜덤 균형 배정</option></select></div><div><label>팀 점수</label><input value="팀 평균 점수" disabled></div></div><div id="teamSummary"></div></div></section><section class="grid2"><div class="card"><h2>학생 접속</h2><div class="codeBox">${A.room}</div><div class="urlbox">${esc(full("student"))}</div><button class="smallBtn" onclick="copy('${esc(full("student"))}')">학생 주소 복사</button><button class="smallBtn" onclick="openDisplay()">전자칠판 열기</button><button class="smallBtn" onclick="copy('${esc(full("display"))}')">전자칠판 주소 복사</button><br><img class="qr" src="${qr(full("student"))}"></div><div class="card"><h2>문제은행</h2><div class="bankControls"><select id="cat"><option>전체</option>${[...new Set(BANK.map(x=>x.category))].map(c=>`<option>${esc(c)}</option>`).join("")}</select><input id="search" placeholder="검색"></div><button onclick="randomQ()">랜덤 문제</button><button class="ghost" onclick="listQ()">목록 보기</button><div id="qList" class="qList"></div></div></section><section class="card"><h2>문제 준비</h2><label>문제</label><input id="question" value="${esc(d.q)}" oninput="saveDraft()"><div class="optionGrid">${[0,1,2].map(i=>`<div><label>보기 ${i+1}</label><input id="opt${i}" value="${esc(d.o[i])}" oninput="saveDraft()"></div>`).join("")}</div><button onclick="openQ()">문제 열기 / 다음 문제</button><button class="secondary" onclick="resetAns()">응답 초기화</button></section><section class="card stage"><div class="stageHead"><h2 id="stageQ"></h2><div id="stagePill" class="pill"></div></div><div class="progress"><div id="bar"></div></div><button class="reveal" onclick="finishRound()">라운드 종료 / 결과 공개 + 점수 반영</button><div id="resultBox"></div></section><section class="rankGrid"><div class="card" id="teamRankCard"><h2>팀 랭킹</h2><div id="teamRank"></div></div><div class="card"><h2>개인 랭킹</h2><button class="ghost" onclick="downloadCSV()">CSV 저장</button><button class="ghost" onclick="resetScores()">점수 초기화</button><div id="rankBox"></div></div></section><section class="card" id="managerCard"><h2>참가자 조 관리</h2><div id="manager"></div></section><section class="card"><h2>문제별 통계</h2><div id="history"></div></section></main>`;$("expected").value=localStorage.getItem("mg14_expected_"+A.room)||25;$("mult").value=localStorage.getItem("mg14_mult_"+A.room)||1}
function updateTeacher(){let s=settings(),ct=counts(),pc=Object.keys(A.state.participants||{}).length,exp=Number(localStorage.getItem("mg14_expected_"+A.room)||25),prog=Math.min(100,Math.round(ct.total/Math.max(1,exp)*100));$("gameMode").value=s.gameMode;$("teamCount").value=s.teamCount;$("teamAssign").value=s.teamAssign;$("teamPanel").style.display=s.gameMode==="team"?"block":"none";$("teamCount").disabled=s.gameMode!=="team";$("teamCountBox").className=s.gameMode==="team"?"":"off";text("mMode",s.gameMode==="team"?"팀전":"개인전");text("mSubmit",`${ct.total}/${exp}`);text("mJoin",`${pc}명`);text("mRound",A.state.round||0);text("joinPill",`제출 ${ct.total}명 / 접속 ${pc}명`);html("partBox",partHTML());html("teamSummary",teamSummaryHTML());text("stageQ",`${A.state.round?A.state.round+"번. ":""}${A.state.question||"문제를 열어 주세요."}${Number(A.state.pointMultiplier||1)>1?" 🔥 "+A.state.pointMultiplier+"배":""}`);text("stagePill",`제출 ${ct.total}명 / 예상 ${exp}명`);$("bar").style.width=prog+"%";html("resultBox",A.state.showResults?resultHTML(ct.counts,scoreFor(ct.counts),Number(A.state.pointMultiplier||1)):`<p class="hint bigHint">라운드 진행 중입니다. 학생들은 결과 공개 전까지 선택을 바꿀 수 있습니다.</p>`);$("teamRankCard").style.display=isTeam()?"block":"none";$("managerCard").style.display=isTeam()?"block":"none";html("teamRank",teamRankHTML());html("rankBox",rankHTML(ranks()));html("manager",managerHTML());html("history",historyHTML(A.state.history||[]))}
function partHTML(){let p=A.state.participants||{},a=A.state.answers||{},rows=Object.entries(p).sort((x,y)=>Number(y[1].at||0)-Number(x[1].at||0));if(!rows.length)return `<p class="hint">아직 접속한 학생이 없습니다.</p>`;let t=now();return `<div class="participantStatusList">${rows.map(([id,v])=>{let ans=a[id]&&a[id].choice!==undefined,last=Number(v.at||0),recent=last&&t-last<300000,min=last?Math.floor((t-last)/60000):null,team=v.team?`${v.team}조`:(isTeam()?"조 미선택":"개인전");return `<div class="participantStatusItem ${ans?"answered":"waiting"}"><div><b>${esc(v.name||"이름없음")}</b><small>${team}</small></div><span class="statusBadge ${ans?"ok":"wait"}">${ans?"제출":"접속"}</span><em>${recent?"접속 중":(min===null?"시간 없음":`${min}분 전`)}</em></div>`}).join("")}</div>`}
async function saveSettings(){await ref().child("settings").update({gameMode:$("gameMode").value,teamCount:Math.max(2,Math.min(10,Number($("teamCount").value)||4)),teamAssign:$("teamAssign").value})}
function filtered(){let c=$("cat")?.value||"전체",k=($("search")?.value||"").trim();return BANK.filter(x=>(c==="전체"||x.category===c)&&(!k||x.q.includes(k)||x.o.join(" ").includes(k)))}
function listQ(){html("qList",filtered().slice(0,100).map(x=>`<button class="qItem" onclick="loadQ(${x.id})"><b>${esc(x.category)}</b> ${esc(x.q)}</button>`).join(""))}
function loadQ(id){let x=BANK.find(q=>q.id===id);if(!x)return;$("question").value=x.q;[0,1,2].forEach(i=>$("opt"+i).value=x.o[i]||`보기 ${i+1}`);saveDraft()}
function randomQ(){let l=filtered();loadQ((l[Math.floor(Math.random()*l.length)]||BANK[0]).id)}
async function openQ(){let q=$("question").value.trim()||"문제",o=[0,1,2].map(i=>$("opt"+i).value.trim()||`보기 ${i+1}`);saveDraft();await ref().update({question:q,options:o,openedAt:now(),showResults:false,scored:false,round:Number(A.state.round||0)+1,pointMultiplier:Number(localStorage.getItem("mg14_mult_"+A.room)||1),answers:{}})}
async function resetAns(){await ref().update({answers:{},showResults:false,scored:false})}
async function resetScores(){if(confirm("점수를 초기화할까요?"))await ref().update({scores:{}})}
async function finishRound(){let snap=await ref().once("value"),s=snap.val()||{},ct=counts(s),sc=scoreFor(ct.counts),ans=s.answers||{},old=s.scores||{},next={...old},mult=Number(s.pointMultiplier||1);if(!s.scored)Object.entries(ans).forEach(([id,a])=>{let add=(sc[Number(a.choice)]||0)*mult;next[id]={name:a.name||old[id]?.name||"이름없음",team:a.team||old[id]?.team||"",total:Number(old[id]?.total||0)+add,last:add,lastChoice:Number(a.choice)}});let hist=[...(Array.isArray(s.history)?s.history:[]),{round:s.round,question:s.question,options:s.options,counts:ct.counts,score:sc,pointMultiplier:mult,at:now()}].slice(-50);await ref().update({showResults:true,scored:true,scores:next,history:hist})}
function resultHTML(c,sc,m){let mx=Math.max(1,...c);return `<div class="results">${(A.state.options||[]).map((o,i)=>`<div class="result"><div class="row"><b>${esc(o)}</b><span>${c[i]}명 · ${sc[i]*m}점</span></div><div class="meter"><div style="width:${Math.round(c[i]/mx*100)}%"></div></div></div>`).join("")}</div>`}
function rankHTML(list){return list.length?`<div class="scoreboard">${list.map((s,i)=>`<div class="scoreRow ${i===0?"topRank":""}"><span class="rank">${i+1}</span><b>${esc(s.name)} ${s.team?`<small>${s.team}조</small>`:""}</b><span>총 ${s.total}점</span><em>이번 +${s.last}</em></div>`).join("")}</div>`:`<p class="hint">아직 점수가 없습니다.</p>`}
function teamSummaryHTML(){return `<div class="teamSummary">${teamStats().sort((a,b)=>Number(a.team)-Number(b.team)).map(t=>`<div><b>${t.name}</b><span>${t.members}명 참가</span><em>평균 ${t.avg}점</em></div>`).join("")}</div>`}
function teamRankHTML(){return `<div class="teamRankBox">${teamStats().map((t,i)=>`<div class="teamRank ${i===0?"firstTeam":""}"><span>${i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</span><b>${t.name}</b><em>평균 ${t.avg}점</em><small>${t.members}명</small></div>`).join("")}</div>`}
function managerHTML(){let r=Object.entries(A.state.participants||{});return r.length?`<div class="participantList">${r.map(([id,p])=>`<div class="participantItem"><b>${esc(p.name||"이름없음")}</b><select onchange="moveTeam('${id}',this.value)"><option value="">미배정</option>${Array.from({length:teamN()},(_,i)=>i+1).map(n=>`<option value="${n}" ${String(p.team)===String(n)?"selected":""}>${n}조</option>`).join("")}</select></div>`).join("")}</div>`:`<p class="hint">아직 참가자가 없습니다.</p>`}
async function moveTeam(id,team){let u={};u[`participants/${id}/team`]=team;if((A.state.answers||{})[id])u[`answers/${id}/team`]=team;if((A.state.scores||{})[id])u[`scores/${id}/team`]=team;await ref().update(u)}
function historyHTML(h){return h.length?`<div class="historyList">${h.slice(-8).reverse().map(x=>`<div class="historyItem"><b>${x.round}번. ${esc(x.question)}</b><div>${(x.options||[]).map((o,i)=>`${esc(o)} ${(x.counts||[])[i]||0}명`).join(" · ")}</div></div>`).join("")}</div>`:`<p class="hint">아직 통계가 없습니다.</p>`}
function downloadCSV(){let rows=[["순위","이름","조","총점","이번점수"]];ranks().forEach((s,i)=>rows.push([i+1,s.name,s.team?`${s.team}조`:"",s.total,s.last]));let csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");let a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.download=`소수결_${A.room}.csv`;a.click()}
/* student */
let nt=null, ht=null, comp=false;
function skey(s){let my=(s.answers||{})[sid()]||{},me=(s.participants||{})[sid()]||{};return [s.round||0,s.question||"",JSON.stringify(s.options||[]),s.openedAt||0,s.showResults?1:0,s.scored?1:0,JSON.stringify(s.settings||{}),my.choice??"",me.team||""].join("|")}
function student(){if(A.ref)A.ref.off();startHeart();A.ref=ref();A.ref.on("value",s=>{A.state=s.val()||{};let k=skey(A.state);if(k!==A.studentKey){A.studentKey=k;safe(renderStudent)}})}
async function touch(){let name=($("sName")?$("sName").value:localStorage.getItem("mg14_name")||"").trim();if(!name)return;let team=localStorage.getItem("mg14_team_"+A.room)||"",me=(A.state.participants||{})[sid()]||{};if(me.team)team=me.team;let sel=$("sTeam");if(isTeam()&&teamAssign()==="choice"&&sel&&sel.value)team=sel.value;if(isTeam()&&teamAssign()==="random"&&!team){team=pickTeam();localStorage.setItem("mg14_team_"+A.room,team)}await ref().child("participants/"+sid()).update({name,team:team||"",at:now(),online:true})}
function sched(){clearTimeout(nt);nt=setTimeout(()=>touch().catch(()=>{}),700)}
function startHeart(){clearInterval(ht);ht=setInterval(()=>touch().catch(()=>{}),15000)}
function renderStudent(){let name=localStorage.getItem("mg14_name")||"",me=(A.state.participants||{})[sid()]||{},team=me.team||localStorage.getItem("mg14_team_"+A.room)||"",ended=!!A.state.showResults||!!A.state.scored,opened=Number(A.state.openedAt||0),sel=myAns(),can=opened&&!ended&&(!isTeam()||teamAssign()==="random"||team);A.el.innerHTML=`<main class="student"><section class="studentCard"><h1>소수결 게임</h1><p class="center">방코드 <b class="code">${A.room}</b> · ${isTeam()?"팀전":"개인전"}</p><div class="studentInfo"><label>이름 또는 번호</label><input id="sName" value="${esc(name)}" oncompositionstart="comp=true" oncompositionend="comp=false;localStorage.setItem('mg14_name',this.value);sched()" oninput="localStorage.setItem('mg14_name',this.value);if(!comp)sched()" onblur="comp=false;touch()">${isTeam()&&teamAssign()==="choice"?`<label>조 선택</label><select id="sTeam" onchange="localStorage.setItem('mg14_team_${A.room}',this.value);touch().then(()=>renderStudent())"><option value="">조를 선택하세요</option>${Array.from({length:teamN()},(_,i)=>i+1).map(n=>`<option value="${n}" ${String(team)===String(n)?"selected":""}>${n}조</option>`).join("")}</select>`:""}${isTeam()&&teamAssign()==="random"?`<div class="assigned">${team?`🎉 ${team}조에 배정되었습니다.`:"이름을 입력하면 자동으로 조가 배정됩니다."}</div>`:""}</div><h2>${A.state.round?A.state.round+"번. ":""}${esc(A.state.question||"선생님이 문제를 열 때까지 기다려 주세요.")}</h2><div class="choices">${(A.state.options||[]).map((o,i)=>`<button class="choice ${sel===i?"selectedChoice":""}" ${!can?"disabled":""} onclick="submit(${i})">${esc(o)}${sel===i?"<small>선택됨</small>":""}</button>`).join("")}</div><p class="status">${!name.trim()?"이름을 입력하면 선생님 화면에 표시됩니다.":ended?"라운드가 종료되었습니다.":!opened?"대기 중입니다.":sel>=0?"선택되었습니다. 결과 공개 전까지 바꿀 수 있습니다.":"하나를 골라 주세요."}</p></section></main>`}
async function submit(choice){let name=($("sName")?.value||"").trim();if(!name){alert("이름을 입력해 주세요.");return}await touch();let me=(A.state.participants||{})[sid()]||{},team=me.team||localStorage.getItem("mg14_team_"+A.room)||"";if(isTeam()&&teamAssign()==="choice"&&!team){alert("조를 선택해 주세요.");return}await ref().child("answers/"+sid()).set({choice,name,team,at:now()})}
function display(){if(A.ref)A.ref.off();A.ref=ref();A.ref.on("value",s=>{A.state=s.val()||{};safe(renderDisplay)})}

function renderDisplay(){
  let ct = counts();
  let sc = scoreFor(ct.counts);
  let sum = Math.max(1, ct.counts.reduce((a,b)=>a+b,0));
  let personalTop = ranks().slice(0,8);
  let teamTop = teamStats().slice(0,8);

  const rankContent = isTeam()
    ? `<div class="displaySubTitle">팀 랭킹 TOP</div>${
        teamTop.length
          ? teamTop.map((t,i)=>`<div class="rankBig"><span>${i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</span><b>${esc(t.name)}</b><em>평균 ${t.avg}점</em><small>${t.members}명</small></div>`).join("")
          : `<p class="displayHint">아직 팀 점수가 없습니다.</p>`
      }<div class="displaySubTitle smallTop">개인 랭킹 TOP</div>${
        personalTop.length
          ? personalTop.slice(0,5).map((s,i)=>`<div class="rankMini"><span>${i+1}</span><b>${esc(s.name)}${s.team?` <small>${s.team}조</small>`:""}</b><em>${s.total}점</em></div>`).join("")
          : `<p class="displayHint">아직 개인 점수가 없습니다.</p>`
      }`
    : (personalTop.length
        ? personalTop.map((s,i)=>`<div class="rankBig"><span>${i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</span><b>${esc(s.name)}</b><em>${s.total}점</em><small>+${s.last}</small></div>`).join("")
        : `<p class="displayHint">아직 랭킹이 없습니다. 결과 공개 후 점수가 반영됩니다.</p>`);

  A.el.innerHTML=`<main class="display">
    <section class="displayHeader">
      <div>
        <div class="badge">${A.state.round?A.state.round+"번 문제":"대기 중"} · ${isTeam()?`팀전(${teamAssign()==="random"?"랜덤배정":"직접선택"})`:"개인전"} ${Number(A.state.pointMultiplier||1)>1?"🔥 "+A.state.pointMultiplier+"배":""}</div>
        <h1>${esc(A.state.question||"선생님이 문제를 열 때까지 기다려 주세요.")}</h1>
      </div>
      <div class="submitBox"><b>${ct.total}</b><span>명 제출</span></div>
    </section>
    ${!A.state.showResults
      ? `<section class="waiting"><div class="pulse">소수결을 노려보세요!</div><div class="displayChoices">${(A.state.options||[]).map((o,i)=>`<div>${i+1}. ${esc(o)}</div>`).join("")}</div>${isTeam()?`<div class="displayCard"><h2>팀 현황</h2>${teamSummaryHTML()}</div>`:""}</section>`
      : `<section class="displayGrid">
          <div class="displayCard">
            <h2>선택 비율</h2>
            ${(A.state.options||[]).map((o,i)=>{let p=Math.round(ct.counts[i]/sum*100);return `<div class="barLabel"><b>${esc(o)}</b><span>${ct.counts[i]}명 · ${p}% · ${sc[i]*Number(A.state.pointMultiplier||1)}점</span></div><div class="bar"><div style="width:${Math.max(4,p)}%"></div></div>`}).join("")}
          </div>
          <div class="displayCard">
            <h2>${isTeam()?"랭킹 TOP":"개인 랭킹 TOP"}</h2>
            ${rankContent}
          </div>
        </section>`
    }
  </main>`;
}

init();
