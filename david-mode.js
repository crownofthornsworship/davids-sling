(()=>{
'use strict';
const $=s=>document.querySelector(s),canvas=$('#davidCanvas'),ctx=canvas.getContext('2d');
const W=900,H=600,KEY='davids-sling-david-mode-v1';
const verses=[
 ['1 Samuel 17:32','Do not lose heart because of this giant.'],['1 Samuel 17:34–35','David learned courage while protecting the flock.'],['1 Samuel 17:37','The Lord who delivered David would deliver him again.'],['1 Samuel 17:40','David chose five smooth stones from the stream.'],['1 Samuel 17:45','David came in the name of the Lord Almighty.'],['1 Samuel 17:46','David stood so all would know the God of Israel.'],['1 Samuel 17:47','The battle is the LORD’s.'],['Psalm 18:2','The Lord is my rock, fortress, and deliverer.'],['Psalm 27:1','The Lord is my light and salvation—whom shall I fear?'],['Psalm 144:1','Praise God, who trains hands for battle.'],['1 Samuel 17:50','David triumphed with a sling and a stone.']
];
const chapterNames=['Shepherd’s Courage','Across the Brook','The Giant’s Challenge','No Borrowed Armor','Five Smooth Stones','The Valley Trembles','Stand in Faith','The Living God','Run to the Battle','True Aim','The Battle Is the Lord’s'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let save={unlocked:0,cleared:{},tutorial:'pending'};
try{save={...save,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
save.unlocked=clamp(Number(save.unlocked)||0,0,98); save.cleared=save.cleared||{};
let active=false,playing=false,level=0,lane=0,targetLane=0,pose='stand',poseTime=0,hearts=5,bossMax=3,bossHp=3,throwCooldown=0,stone=null,spear=null,nextSpear=1.8,time=0,last=0,flash=0,shake=0,messageTimer=0,difficulty='easy',tutorialStep=0;

function persist(){try{localStorage.setItem(KEY,JSON.stringify(save))}catch{}}
function readDifficulty(){try{return JSON.parse(localStorage.getItem('davids-sling-v1')||'{}').difficulty==='normal'?'normal':'easy'}catch{return 'easy'}}
function levelData(n){
 const chapter=Math.min(10,Math.floor(n/9));
 return {chapter,hits:Math.min(12,3+Math.floor(n/11)),telegraph:Math.max(.62,1.38-n*.006)+(readDifficulty()==='easy'?.42:0),travel:Math.max(.48,1.05-n*.004)+(readDifficulty()==='easy'?.25:0),interval:Math.max(1.12,2.7-n*.012)+(readDifficulty()==='easy'?.55:0),double:n>=36&&n%4===3,feint:n>=63&&n%5===0};
}
function setMode(which){
 active=which==='david'; $('#classicMode').hidden=active; $('#davidMode').hidden=!active;
 $('#classicModeBtn').classList.toggle('active',!active); $('#davidModeBtn').classList.toggle('active',active);
 $('#classicModeBtn').setAttribute('aria-pressed',String(!active)); $('#davidModeBtn').setAttribute('aria-pressed',String(active));
 if(active){difficulty=readDifficulty(); renderGrid(); if(save.tutorial==='pending')showIntro(); else startLevel(save.unlocked)} else playing=false;
}
function showIntro(){playing=false; $('#dmOverlay').hidden=false; $('#dmOverlay').innerHTML=`<div class="dm-card"><span class="overline">NEW GAME MODE</span><h2>David Mode</h2><p>Goliath is hurling spears. Read each warning, dodge at the right moment, and press <b>THROW</b> to sling a stone back at him.</p><div class="dm-lessons"><span>← →<small>Dodge lanes</small></span><span>↑<small>Jump low spears</small></span><span>↓<small>Dive-roll high spears</small></span><span>◉<small>Throw stone</small></span></div><p class="dm-faith">“The battle is the LORD’s.” — 1 Samuel 17:47</p><button class="primary" id="dmStartBtn">Begin training</button><button class="dm-text-button" id="dmSkipBtn">Skip training · Start level 1</button></div>`; $('#dmStartBtn').onclick=()=>{save.tutorial='training';persist();tutorialStep=1;startLevel(0,true)}; $('#dmSkipBtn').onclick=()=>{save.tutorial='skipped';persist();startLevel(0)} }
function startLevel(n,training=false){
 level=clamp(n,0,98); difficulty=readDifficulty(); const d=levelData(level); lane=targetLane=0;pose='stand';poseTime=0;hearts=difficulty==='easy'?5:3;bossMax=d.hits;bossHp=bossMax;throwCooldown=0;stone=null;spear=null;nextSpear=training?2.8:1.8;time=0;flash=shake=0;playing=true;$('#dmOverlay').hidden=true;$('#dmLevelGrid').hidden=true;
 $('#dmLevelLabel').textContent=`LEVEL ${String(level+1).padStart(2,'0')} / 99`;$('#dmWave').textContent=`${chapterNames[d.chapter]} · ${difficulty.toUpperCase()}`;$('#dmVerse').textContent=`${verses[d.chapter][1]} — ${verses[d.chapter][0]}`;say(training?'Training: use LEFT or RIGHT to move.':'Watch Goliath. Read the warning, then move!',2.4);updateHud();renderGrid();
}
function updateHud(){
 $('#dmHearts').textContent='♥ '.repeat(Math.max(0,hearts)).trim()||'—'; $('#dmBossHealth').textContent='● '.repeat(Math.max(0,bossHp)).trim()||'—'; $('#dmProgressLabel').textContent=`${Object.keys(save.cleared).length} / 99 cleared`;
}
function say(s,d=1.4){$('#dmMessage').textContent=s;messageTimer=d}
function action(type){if(!active||!playing)return;
 if(type==='left'){targetLane=clamp(targetLane-1,-1,1);say('Dodge left!',.6);if(tutorialStep===1)tutorialStep=2}
 if(type==='right'){targetLane=clamp(targetLane+1,-1,1);say('Dodge right!',.6);if(tutorialStep===1)tutorialStep=2}
 if(type==='jump'&&pose==='stand'){pose='jump';poseTime=.82;say('Jump!',.6);if(tutorialStep===2)tutorialStep=3}
 if(type==='roll'&&pose==='stand'){pose='roll';poseTime=.72;say('Dive-roll!',.6);if(tutorialStep===3)tutorialStep=4}
 if(type==='throw'&&throwCooldown<=0&&!stone){throwCooldown=.66;stone={t:0,lane};say('Stone away!',.55);if(tutorialStep===4){tutorialStep=0;save.tutorial='complete';persist()}}
}
function spawnSpear(){
 const d=levelData(level),available=level<3?['lane']:level<7?['lane','low']:['lane','low','high']; let kind=available[Math.floor(Math.random()*available.length)],sLane=Math.floor(Math.random()*3)-1;
 if(kind==='lane'&&sLane===lane&&Math.random()<.35)sLane=lane===1?0:lane+1;
 spear={kind,lane:sLane,phase:'tell',t:0,telegraph:d.telegraph,travel:d.travel,feint:d.feint&&Math.random()<.35};
 const info=kind==='low'?['↑','LOW SPEAR — JUMP!']:kind==='high'?['↓','HIGH SPEAR — ROLL!']:['↔',`SPEAR IN ${['LEFT','CENTER','RIGHT'][sLane+1]} LANE!`];
 $('#dmWarningIcon').textContent=info[0];$('#dmWarningText').textContent=info[1];$('#dmWarning').hidden=false;
}
function resolveSpear(){
 if(!spear)return; let safe=spear.kind==='low'?pose==='jump':spear.kind==='high'?pose==='roll':Math.round(lane)!==spear.lane;
 if(safe){say(spear.kind==='lane'?'Clean dodge!':spear.kind==='low'?'Leaped over it!':'Rolled beneath it!',.9)} else {hearts--;flash=.75;shake=.4;say('Hit! Keep your courage.',1.2);updateHud();if(hearts<=0){endLevel(false);return}}
 spear=null;$('#dmWarning').hidden=true;nextSpear=levelData(level).interval;
}
function hitGoliath(){bossHp--;flash=.35;say(bossHp?'Hit! Keep the pressure on!':'The stone finds its mark!',1.1);updateHud();if(bossHp<=0)endLevel(true)}
function endLevel(win){playing=false;spear=null;stone=null;$('#dmWarning').hidden=true;
 if(win){save.cleared[level]=true;save.unlocked=Math.max(save.unlocked,Math.min(98,level+1));persist();renderGrid();const final=level===98;$('#dmOverlay').innerHTML=`<div class="dm-card"><span class="overline">${final?'CAMPAIGN COMPLETE':'VICTORY'}</span><h2>${final?'The battle is the LORD’s!':'Courage wins the day!'}</h2><p>${verses[levelData(level).chapter][1]} — ${verses[levelData(level).chapter][0]}</p><p>${hearts} heart${hearts===1?'':'s'} remaining · Level ${level+1} cleared</p><button class="primary" id="dmNext">${final?'Play level 99 again':'Next battle →'}</button></div>`;$('#dmOverlay').hidden=false;$('#dmNext').onclick=()=>startLevel(final?98:level+1)}
 else{$('#dmOverlay').innerHTML=`<div class="dm-card"><span class="overline">TAKE COURAGE</span><h2>Stand up and try again.</h2><p>Watch the warning before each spear. Move lanes, jump low throws, and roll beneath high ones.</p><button class="primary" id="dmAgain">Retry level ${level+1}</button><button class="dm-text-button" id="dmEasy">Use Easy difficulty</button></div>`;$('#dmOverlay').hidden=false;$('#dmAgain').onclick=()=>startLevel(level);$('#dmEasy').onclick=()=>{$('#difficulty').value='easy';$('#difficulty').dispatchEvent(new Event('change'));startLevel(level)}}
}
function renderGrid(){const box=$('#dmLevelGrid');box.innerHTML=Array.from({length:99},(_,i)=>`<button data-dm-level="${i}" ${i>save.unlocked?'disabled':''} class="${i===level?'active':''} ${save.cleared[i]?'cleared':''}" aria-label="David Mode level ${i+1}${i>save.unlocked?' locked':''}">${save.cleared[i]?'✦':i+1}</button>`).join('')}
function step(dt){if(!active||!playing)return;time+=dt;lane+=(targetLane-lane)*Math.min(1,dt*11);if(poseTime>0){poseTime-=dt;if(poseTime<=0)pose='stand'}throwCooldown=Math.max(0,throwCooldown-dt);flash=Math.max(0,flash-dt*2);shake=Math.max(0,shake-dt*2.5);messageTimer=Math.max(0,messageTimer-dt);
 if(stone){stone.t+=dt*1.55;if(stone.t>=1){stone=null;hitGoliath();if(!playing)return}}
 if(spear){spear.t+=dt;if(spear.phase==='tell'&&spear.t>=spear.telegraph){spear.phase='fly';spear.t=0;$('#dmWarning').hidden=true}else if(spear.phase==='fly'&&spear.t>=spear.travel)resolveSpear()}
 else{nextSpear-=dt;if(nextSpear<=0)spawnSpear()}
}
function draw(){
 const sx=shake?Math.sin(time*70)*shake*15:0;ctx.save();ctx.translate(sx,0);let sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#789aa7');sky.addColorStop(.47,'#d7c69b');sky.addColorStop(1,'#806d45');ctx.fillStyle=sky;ctx.fillRect(-20,0,W+40,H);
 ctx.fillStyle='#6d7650';ctx.beginPath();ctx.moveTo(0,290);for(let x=0;x<=W;x+=90)ctx.lineTo(x,220+Math.sin(x*.02)*45);ctx.lineTo(W,430);ctx.lineTo(0,430);ctx.fill();
 ctx.fillStyle='#b6945c';ctx.beginPath();ctx.moveTo(0,380);ctx.lineTo(W,380);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();ctx.strokeStyle='#d0b27655';ctx.lineWidth=3;for(let x=0;x<W;x+=90){ctx.beginPath();ctx.moveTo(W/2,330);ctx.lineTo(x,H);ctx.stroke()}
 // Goliath: tall, readable armored silhouette.
 const bob=Math.sin(time*2.2)*4,gx=W/2,gy=205+bob;ctx.save();ctx.translate(gx,gy);ctx.shadowColor='#24180e99';ctx.shadowBlur=22;ctx.fillStyle='#543428';ctx.beginPath();ctx.arc(0,-82,34,0,7);ctx.fill();ctx.fillStyle='#9b6d35';ctx.beginPath();ctx.moveTo(-45,-56);ctx.lineTo(45,-56);ctx.lineTo(62,64);ctx.lineTo(-62,64);ctx.closePath();ctx.fill();ctx.fillStyle='#473b39';ctx.fillRect(-72,-34,144,18);ctx.fillStyle='#c6a25a';ctx.fillRect(-38,-105,76,14);ctx.fillStyle='#35261f';ctx.fillRect(-57,58,40,91);ctx.fillRect(17,58,40,91);ctx.fillStyle='#e0bf6b';ctx.font='900 16px system-ui';ctx.textAlign='center';ctx.fillText('GOLIATH',0,8);ctx.restore();
 // Flying spear grows toward the camera.
 if(spear&&spear.phase==='fly'){let p=clamp(spear.t/spear.travel,0,1),scale=.25+p*2.4,x=W/2+spear.lane*220*p,y=spear.kind==='low'?360+p*150:spear.kind==='high'?250+p*5:300+p*100;ctx.save();ctx.translate(x,y);ctx.rotate(spear.kind==='lane'?.22:-.12);ctx.scale(scale,scale);ctx.strokeStyle='#4b2b19';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(-85,0);ctx.lineTo(70,0);ctx.stroke();ctx.fillStyle='#c9cad0';ctx.beginPath();ctx.moveTo(70,-12);ctx.lineTo(106,0);ctx.lineTo(70,12);ctx.fill();ctx.restore()}
 // Stone from David's hand to Goliath.
 if(stone){let p=Math.min(1,stone.t),x=W/2+stone.lane*220*(1-p),y=545-p*305-Math.sin(p*Math.PI)*105,r=19-p*12;ctx.fillStyle='#fff0b5aa';ctx.beginPath();ctx.arc(x,y,r+10,0,7);ctx.fill();ctx.fillStyle='#685b47';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}
 // First-person hands and sling.
 let px=W/2+lane*220,py=pose==='jump'?H-118:pose==='roll'?H-42:H-72;ctx.save();ctx.translate(px,py);if(pose==='roll')ctx.rotate(-.45);ctx.fillStyle='#b97852';ctx.beginPath();ctx.ellipse(-54,20,31,65,-.4,0,7);ctx.ellipse(54,20,31,65,.4,0,7);ctx.fill();ctx.strokeStyle='#5a3a25';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-45,-22);ctx.quadraticCurveTo(0,-83,45,-22);ctx.stroke();ctx.fillStyle='#6c4328';ctx.beginPath();ctx.ellipse(0,-57,22,12,0,0,7);ctx.fill();ctx.restore();
 if(pose==='jump'){ctx.fillStyle='#fff0aeaa';ctx.font='900 18px system-ui';ctx.textAlign='center';ctx.fillText('JUMP',px,H-22)}if(pose==='roll'){ctx.fillStyle='#fff0aeaa';ctx.font='900 18px system-ui';ctx.textAlign='center';ctx.fillText('DIVE ROLL',px,H-22)}
 if(flash){ctx.fillStyle=`rgba(255,225,145,${flash*.25})`;ctx.fillRect(-20,0,W+40,H)}ctx.restore();
}
function loop(ts){let dt=Math.min(.034,(ts-last)/1000||0);last=ts;step(dt);if(active)draw();requestAnimationFrame(loop)}

$('#classicModeBtn').onclick=()=>setMode('classic');$('#davidModeBtn').onclick=()=>setMode('david');
document.querySelectorAll('[data-dm-action]').forEach(b=>{const go=e=>{e.preventDefault();b.classList.add('pressed');action(b.dataset.dmAction)};b.addEventListener('pointerdown',go);b.addEventListener('click',e=>{if(e.detail===0)go(e)});b.addEventListener('pointerup',()=>b.classList.remove('pressed'));b.addEventListener('pointercancel',()=>b.classList.remove('pressed'))});
document.addEventListener('keydown',e=>{if(!active)return;const k=e.key.toLowerCase(),map={arrowleft:'left',a:'left',arrowright:'right',d:'right',arrowup:'jump',w:'jump',arrowdown:'roll',s:'roll',' ':'throw',f:'throw'};if(map[k]){e.preventDefault();action(map[k])}});
$('#dmRetry').onclick=()=>startLevel(level);$('#dmReplayHelp').onclick=showIntro;$('#dmLevels').onclick=()=>{$('#dmLevelGrid').hidden=!$('#dmLevelGrid').hidden};$('#dmLevelGrid').onclick=e=>{const b=e.target.closest('[data-dm-level]');if(b&&!b.disabled)startLevel(Number(b.dataset.dmLevel))};
renderGrid();requestAnimationFrame(loop);
window.__davidModeQA={getState:()=>({level:level+1,unlocked:save.unlocked+1,cleared:Object.keys(save.cleared).length,hearts,bossHp,playing,difficulty}),startLevel:n=>{setMode('david');startLevel(clamp(n-1,0,98))},win:()=>{if(active&&playing){bossHp=1;hitGoliath()}},reset:()=>{localStorage.removeItem(KEY);location.reload()}};
})();
