import { useCallback, useEffect, useRef, useState } from 'react';
import { Crosshair, Heart, Shield, Zap, Skull, Coins, Play, RotateCcw, UserRound, Volume2, VolumeX, Trophy, ChevronRight } from 'lucide-react';

type Character = {
  id: string; name: string; role: string; color: string; accent: string;
  hp: number; speed: number; damage: number; perk: string; glyph: string;
};
const CHARACTERS: Character[] = [
  { id: 'rebel', name: 'Rebel', role: 'All-rounder', color: '#65baff', accent: '#192d56', hp: 100, speed: 2.7, damage: 16, perk: 'Stat seimbang untuk pemula', glyph: '✦' },
  { id: 'soldier', name: 'Soldier', role: 'Tank', color: '#8de28c', accent: '#274d36', hp: 140, speed: 2.25, damage: 18, perk: '+40 HP, lebih tahan serangan', glyph: '⬟' },
  { id: 'hacker', name: 'Hacker', role: 'Critical', color: '#f17ce8', accent: '#502450', hp: 80, speed: 3.15, damage: 24, perk: 'Damage tinggi, HP rendah', glyph: '⌘' },
  { id: 'ninja', name: 'Ninja', role: 'Speed', color: '#b6a1ff', accent: '#302b59', hp: 90, speed: 3.6, damage: 15, perk: 'Karakter paling cepat', glyph: '影' },
  { id: 'medic', name: 'Medic', role: 'Support', color: '#ffb6d0', accent: '#5b2c45', hp: 110, speed: 2.65, damage: 14, perk: 'Memulihkan sedikit HP tiap 10 detik', glyph: '+' },
  { id: 'engineer', name: 'Engineer', role: 'Builder', color: '#ffc36b', accent: '#594126', hp: 105, speed: 2.55, damage: 17, perk: 'Bonus koin dari monster', glyph: '⚙' },
  { id: 'android', name: 'Android', role: 'Shield', color: '#73e5ff', accent: '#1d485a', hp: 120, speed: 2.5, damage: 16, perk: 'Perisai energi visual', glyph: '◈' },
  { id: 'phantom', name: 'Phantom', role: 'Assassin', color: '#ff686f', accent: '#54202d', hp: 85, speed: 3.25, damage: 22, perk: 'Damage tinggi dan lincah', glyph: '☠' },
];
type Enemy = { x:number; y:number; hp:number; maxHp:number; speed:number; size:number; color:string; boss:boolean; hit:number };
type Bullet = { x:number; y:number; vx:number; vy:number; damage:number; life:number };
type Pickup = { x:number; y:number; type:'coin'|'heal'|'xp'; life:number };
type GameState = {
  running:boolean; over:boolean; won:boolean; time:number; hp:number; maxHp:number; xp:number; level:number;
  coins:number; kills:number; wave:number; enemies:Enemy[]; bullets:Bullet[]; pickups:Pickup[];
  px:number; py:number; vx:number; vy:number; shootTimer:number; spawnTimer:number; hitFlash:number; lastMedicHeal:number;
  phase:'normal'|'boss';
};
const initialState = (c:Character):GameState => ({
  running:false, over:false, won:false, time:60, hp:c.hp, maxHp:c.hp, xp:0, level:1, coins:0, kills:0, wave:1,
  enemies:[], bullets:[], pickups:[], px:0.5, py:0.5, vx:0, vy:0, shootTimer:0, spawnTimer:0, hitFlash:0, lastMedicHeal:0,
  phase:'normal'
});

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState | null>(null);
  const keys = useRef<Record<string, boolean>>({});
  const mouse = useRef({ x: 0, y: 0, down: false });
  const selectedRef = useRef<Character>(CHARACTERS[0]);
  const [selected, setSelected] = useState<Character>(CHARACTERS[0]);
  const [screen, setScreen] = useState<'menu'|'playing'|'result'>('menu');
  const [hud, setHud] = useState({time:60,hp:100,maxHp:100,xp:0,level:1,coins:0,kills:0,wave:1,phase:'normal' as 'normal'|'boss'});
  const [sound, setSound] = useState(true);
  const [pause, setPause] = useState(false);
  const [lastResult, setLastResult] = useState({kills:0,coins:0,time:0,won:false});
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [damageBoost, setDamageBoost] = useState(0);
  const [speedBoost, setSpeedBoost] = useState(0);
  const [hpBoost, setHpBoost] = useState(0);
  selectedRef.current = selected;

  const startGame = useCallback(() => {
    const c = selectedRef.current;
    const g = initialState(c);
    g.hp += hpBoost * 15; g.maxHp += hpBoost * 15;
    g.px = 0.5; g.py = 0.5;
    gameRef.current = g;
    keys.current = {};
    setHud({time:60,hp:g.hp,maxHp:g.maxHp,xp:0,level:1,coins:0,kills:0,wave:1,phase:'normal'});
    setScreen('playing'); setPause(false); setUpgradeOpen(false);
  }, [hpBoost]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
      keys.current[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'p' && screen === 'playing') setPause(p => !p);
    };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [screen]);

  useEffect(() => {
    if (screen !== 'playing' || pause || upgradeOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0, last = performance.now(), hudTick = 0, raf = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr); canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    resize(); window.addEventListener('resize', resize);
    mouse.current.x = canvas.clientWidth / 2; mouse.current.y = canvas.clientHeight / 2;
    canvas.style.cursor = 'none';
    const updateAim = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left; mouse.current.y = e.clientY - rect.top;
    };
    const onMouseDown = (e: MouseEvent) => { if (e.button === 0) { updateAim(e); mouse.current.down = true; } };
    const onMouseUp = () => { mouse.current.down = false; };
    canvas.addEventListener('mousemove', updateAim);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseleave', onMouseUp);
    window.addEventListener('mouseup', onMouseUp);
    const drawCharacter = (x:number,y:number,c:Character,size=17) => {
      ctx.save(); ctx.translate(x,y);
      ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.beginPath(); ctx.ellipse(0,size*.9,size*.85,size*.3,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = c.accent; ctx.fillRect(-size*.65,-size*.25,size*1.3,size*1.1);
      ctx.fillStyle = c.color; ctx.fillRect(-size*.52,-size*.2,size*1.04,size*.85);
      ctx.fillStyle = '#f2c7a5'; ctx.fillRect(-size*.42,-size*.95,size*.84,size*.78);
      ctx.fillStyle = '#1a2135'; ctx.fillRect(-size*.48,-size*1.02,size*.96,size*.28);
      ctx.fillStyle = '#f8fbff'; ctx.fillRect(size*.1,-size*.72,size*.16,size*.12);
      ctx.fillStyle = c.accent; ctx.fillRect(-size*.95,size*.05,size*.4,size*.48);
      ctx.fillStyle = '#dbeeff'; ctx.fillRect(size*.45,size*.1,size*.8,size*.18);
      ctx.restore();
    };
    const spawnEnemy = (g:GameState,w:number,h:number) => {
      const edge = Math.floor(Math.random()*4); let x=0,y=0;
      if(edge===0){x=Math.random()*w;y=-20;} else if(edge===1){x=w+20;y=Math.random()*h;}
      else if(edge===2){x=Math.random()*w;y=h+20;} else {x=-20;y=Math.random()*h;}
      const boss = g.time < 15 && Math.random() < .12;
      const hp = boss ? 150 + g.wave*10 : 28 + g.wave*3;
      g.enemies.push({x,y,hp,maxHp:hp,speed:(boss?0.48:0.55+Math.random()*.5)+g.wave*.035,size:boss?25:13+Math.random()*3,color:boss?'#e66bff':['#a7f078','#ff6c86','#ffd16d'][Math.floor(Math.random()*3)],boss,hit:0});
    };
    const loop = (now:number) => {
      raf = requestAnimationFrame(loop);
      const g = gameRef.current;
      if (!g || g.over || !g.running) return;
      const dt = Math.min((now-last)/16.67,2); last=now; frame++; hudTick++;
      const w=canvas.clientWidth,h=canvas.clientHeight;
      const c=selectedRef.current;
      g.time=Math.max(0,g.time-dt/60);
      g.wave=Math.min(10,1+Math.floor((60-g.time)/6));
      if (c.id==='medic') { g.lastMedicHeal += dt/60; if(g.lastMedicHeal>=10){g.hp=Math.min(g.maxHp,g.hp+8);g.lastMedicHeal=0;} }
      const k=keys.current;
      let dx=(k['d']||k['arrowright']?1:0)-(k['a']||k['arrowleft']?1:0);
      let dy=(k['s']||k['arrowdown']?1:0)-(k['w']||k['arrowup']?1:0);
      const mag=Math.hypot(dx,dy)||1;
      // Gerakan mulus: kecepatan diinterpolasi menuju arah input (akselerasi & deselerasi).
      const speed=(c.speed+speedBoost*.2)*0.8;
      const tvx=(dx/mag)*speed/w, tvy=(dy/mag)*speed/h;
      const ease=1-Math.pow(0.78,dt);
      g.vx+=(tvx-g.vx)*ease; g.vy+=(tvy-g.vy)*ease;
      g.px=Math.max(.04,Math.min(.96,g.px+g.vx*dt));
      g.py=Math.max(.07,Math.min(.94,g.py+g.vy*dt));
      const px=g.px*w,py=g.py*h;
      g.spawnTimer+=dt;
      // Naik level; modal upgrade terbuka setiap kali level naik.
      const gainXp=(n:number)=>{g.xp+=n;while(g.xp>=100){g.xp-=100;g.level++;setUpgradeOpen(true);}};
      if(g.spawnTimer>(g.phase==='boss'?55:Math.max(10,34-g.wave*2))){spawnEnemy(g,w,h);g.spawnTimer=0;}
      if(frame%105===0 && g.enemies.length<45) spawnEnemy(g,w,h);
      // Manual aim: fire toward the mouse only while left button is held.
      if (mouse.current.down) {
        g.shootTimer += dt;
        if (g.shootTimer >= Math.max(7, 19 - damageBoost)) {
          const aimX = mouse.current.x, aimY = mouse.current.y;
          const d = Math.max(1, Math.hypot(aimX - px, aimY - py));
          g.bullets.push({x:px,y:py-3,vx:(aimX-px)/d*5.4,vy:(aimY-py)/d*5.4,damage:c.damage+damageBoost*4,life:65});
          g.shootTimer = 0;
        }
      } else {
        g.shootTimer = Math.max(7, 19 - damageBoost); // klik pertama langsung menembak
      }
      // Background
      ctx.clearRect(0,0,w,h);
      const grad=ctx.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#101e35');grad.addColorStop(1,'#071222');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
      ctx.strokeStyle='rgba(65,139,191,.11)';ctx.lineWidth=1;
      for(let x=0;x<w;x+=36){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
      for(let y=0;y<h;y+=36){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
      // Scattered arena debris
      for(let i=0;i<22;i++){const x=(i*127+43)%w,y=(i*79+29)%h;ctx.fillStyle=i%2?'#1a3445':'#27374a';ctx.fillRect(x,y,7+(i%4)*2,5+(i%3)*2);}
      // Pickups
      for(let i=g.pickups.length-1;i>=0;i--){const p=g.pickups[i];p.life-=dt;ctx.font='17px sans-serif';ctx.textAlign='center';ctx.fillText(p.type==='coin'?'🟡':p.type==='heal'?'✚':'◆',p.x,p.y);if(Math.hypot(p.x-px,p.y-py)<24){if(p.type==='coin')g.coins+=c.id==='engineer'?3:2;else if(p.type==='heal')g.hp=Math.min(g.maxHp,g.hp+18);else {gainXp(12);}g.pickups.splice(i,1);}else if(p.life<=0)g.pickups.splice(i,1);}
      // Enemies
      for(let i=g.enemies.length-1;i>=0;i--){const e=g.enemies[i];const d=Math.max(1,Math.hypot(px-e.x,py-e.y));e.x+=(px-e.x)/d*e.speed*dt*1.8;e.y+=(py-e.y)/d*e.speed*dt*1.8;
        if(e.hit>0)e.hit-=dt;
        ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(e.x,e.y+e.size*.7,e.size*.9,e.size*.35,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=e.hit>0?'#fff':e.color;ctx.fillRect(e.x-e.size*.62,e.y-e.size*.45,e.size*1.24,e.size*1.1);
        ctx.fillStyle='#26334a';ctx.fillRect(e.x-e.size*.58,e.y-e.size*.7,e.size*1.16,e.size*.4);
        ctx.fillStyle='#ff4f6d';ctx.fillRect(e.x-e.size*.38,e.y-e.size*.55,e.size*.2,e.size*.12);ctx.fillRect(e.x+e.size*.18,e.y-e.size*.55,e.size*.2,e.size*.12);
        ctx.fillStyle='#e9f2ff';ctx.fillRect(e.x-e.size*.32,e.y-e.size*.18,e.size*.18,e.size*.13);ctx.fillRect(e.x+e.size*.12,e.y-e.size*.18,e.size*.18,e.size*.13);
        ctx.fillStyle='#301e32';ctx.fillRect(e.x-e.size,e.y-e.size-7,e.size*2,3);ctx.fillStyle=e.boss?'#e66bff':'#ff657e';ctx.fillRect(e.x-e.size,e.y-e.size-7,e.size*2*Math.max(0,e.hp/e.maxHp),3);
        if(d<e.size+13){g.hp-=(e.boss?.55:.22)*dt;g.hitFlash=3;}
      }
      // Bullets and hit detection
      for(let i=g.bullets.length-1;i>=0;i--){const b=g.bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;ctx.fillStyle='#65e6ff';ctx.shadowColor='#38dfff';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(b.x,b.y,3.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
        let hit=-1;for(let j=0;j<g.enemies.length;j++){if(Math.hypot(g.enemies[j].x-b.x,g.enemies[j].y-b.y)<g.enemies[j].size+4){hit=j;break;}}
        if(hit>=0){const e=g.enemies[hit];e.hp-=b.damage;e.hit=4;if(e.hp<=0){g.kills++;gainXp(e.boss?45:12);g.pickups.push({x:e.x,y:e.y,type:Math.random()<.7?'coin':'xp',life:450});if(Math.random()<.08)g.pickups.push({x:e.x+9,y:e.y,type:'heal',life:450});g.enemies.splice(hit,1);}g.bullets.splice(i,1);}else if(b.life<=0)g.bullets.splice(i,1);
      }
      // Player shield ring and sprite
      if(c.id==='android'){ctx.strokeStyle='rgba(88,222,255,.5)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(px,py,25,0,Math.PI*2);ctx.stroke();}
      if(g.hitFlash>0){ctx.fillStyle='rgba(255,45,90,.08)';ctx.fillRect(0,0,w,h);g.hitFlash-=dt;}
      ctx.strokeStyle='rgba(82,205,255,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,22+Math.sin(now/110)*2,0,Math.PI*2);ctx.stroke();
      drawCharacter(px,py,c,16);
      // Crosshair + garis bidik mengikuti mouse
      const mx=mouse.current.x,my=mouse.current.y;
      const adx=mx-px,ady=my-py,ad=Math.max(1,Math.hypot(adx,ady));
      ctx.strokeStyle='rgba(80,217,255,.35)';ctx.lineWidth=1;ctx.setLineDash([4,6]);
      ctx.beginPath();ctx.moveTo(px+adx/ad*24,py+ady/ad*24);ctx.lineTo(mx,my);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle='rgba(80,217,255,.9)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(mx,my,9,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(mx-14,my);ctx.lineTo(mx-5,my);ctx.moveTo(mx+5,my);ctx.lineTo(mx+14,my);
      ctx.moveTo(mx,my-14);ctx.lineTo(mx,my-5);ctx.moveTo(mx,my+5);ctx.lineTo(mx,my+14);ctx.stroke();
      ctx.fillStyle='#6cecff';ctx.beginPath();ctx.arc(mx,my,1.8,0,Math.PI*2);ctx.fill();
      // Progress and arena vignette
      const vignette=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.2,w/2,h/2,Math.max(w,h)*.7);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.5)');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
      if(hudTick%8===0)setHud({time:g.time,hp:g.hp,maxHp:g.maxHp,xp:g.xp,level:g.level,coins:g.coins,kills:g.kills,wave:g.wave,phase:g.phase});
      // Boss fight setelah timer habis; menang hanya jika boss dikalahkan.
      if (g.hp <= 0) {
        g.over=true;g.running=false;
        setLastResult({kills:g.kills,coins:g.coins,time:60-Math.ceil(g.time),won:false});setScreen('result');
      } else if (g.time <= 0 && g.phase === 'normal') {
        g.time = 0; g.phase = 'boss';
        g.enemies.push({x:w/2,y:-40,hp:850,maxHp:850,speed:0.5,size:42,color:'#e66bff',boss:true,hit:0});
      } else if (g.phase === 'boss' && !g.enemies.some(e=>e.boss)) {
        g.over=true;g.running=false;
        setLastResult({kills:g.kills,coins:g.coins,time:60,won:true});setScreen('result');
      }
    };
    if(gameRef.current){gameRef.current.running=true;}
    raf=requestAnimationFrame(loop);
    return ()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);
      canvas.removeEventListener('mousemove', updateAim);canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseleave', onMouseUp);window.removeEventListener('mouseup', onMouseUp);
      canvas.style.cursor = '';if(gameRef.current)gameRef.current.running=false;};
  }, [screen,pause,upgradeOpen,damageBoost,speedBoost]);

  const chooseCharacter = (c:Character) => { setSelected(c); };
  const buyUpgrade = (type:'damage'|'speed'|'hp') => {
    const g=gameRef.current;
    if(!g || g.coins<20) return;
    g.coins-=20;
    if(type==='damage')setDamageBoost(v=>v+1);
    if(type==='speed')setSpeedBoost(v=>v+1);
    if(type==='hp'){setHpBoost(v=>v+1);g.maxHp+=15;g.hp=Math.min(g.maxHp,g.hp+15);}
    setHud(h=>({...h,coins:g.coins,hp:g.hp,maxHp:g.maxHp}));
  };
  const continueAfterUpgrade = () => setUpgradeOpen(false);
  const leaveGame = () => { if(gameRef.current)gameRef.current.running=false;setScreen('menu');setPause(false);setUpgradeOpen(false); };

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" onClick={e=>{e.preventDefault();leaveGame();}}><span className="brand-mark"><Skull size={22}/></span><span>LAST <b>60</b> SECONDS<small>SURVIVAL ARENA</small></span></a>
      <div className="top-status"><span className="status-dot"/> SURVIVE THE NIGHT <i/> <span>BUILD 0.1.0</span></div>
      <button className="icon-btn" onClick={()=>setSound(s=>!s)} aria-label="Toggle sound">{sound?<Volume2 size={18}/>:<VolumeX size={18}/>}</button>
    </header>

    {screen==='menu' && <section className="menu-layout">
      <div className="hero-panel">
        <div className="hero-glow"/><div className="eyebrow"><span/> THE CITY HAS FALLEN</div>
        <h1>LAST <em>60</em><br/>SECONDS<span className="title-period">.</span></h1>
        <div className="hero-subtitle">SURVIVAL ARENA</div>
        <p className="hero-copy">Satu menit. Gelombang tanpa akhir.<br/>Berapa lama kamu bisa bertahan?</p>
        <div className="hero-actions"><button className="primary-btn" onClick={startGame}><Play size={17} fill="currentColor"/> MULAI BERTAHAN <ChevronRight size={17}/></button></div>
        <div className="hero-bottom"><span><Crosshair size={14}/> MANUAL AIM</span><span><Shield size={14}/> SURVIVAL</span><span><Trophy size={14}/> HIGH SCORE</span></div>
        <div className="hero-art"><div className="moon"/><div className="cityline cityline-back"/><div className="cityline cityline-front"/><div className="silhouette"><span/></div><div className="embers">{Array.from({length:14},(_,i)=><i key={i} style={{left:`${(i*19)%96}%`,top:`${20+(i*23)%70}%`,animationDelay:`${i*.3}s`}}/>)}</div></div>
      </div>
      <div className="menu-right">
        <div className="section-head"><div><span className="eyebrow">CHOOSE YOUR SURVIVOR</span><h2>Pilih Karakter</h2></div><span className="counter">{String(CHARACTERS.findIndex(c=>c.id===selected.id)+1).padStart(2,'0')} <i>/ 08</i></span></div>
        <p className="section-desc">Setiap survivor punya statistik dan gaya bermain yang unik.</p>
        <div className="character-grid">{CHARACTERS.map(c=><button key={c.id} className={`character-card ${selected.id===c.id?'selected':''}`} onClick={()=>chooseCharacter(c)} aria-pressed={selected.id===c.id}>
          <span className="character-art" style={{'--char':c.color,'--accent':c.accent} as React.CSSProperties}><span className="avatar-hair"/><span className="avatar-face"/><span className="avatar-body"/><span className="avatar-glyph">{c.glyph}</span></span>
          <span className="char-name">{c.name}</span><span className="char-role">{c.role}</span>{selected.id===c.id&&<span className="selected-check">✓</span>}
        </button>)}</div>
        <div className="selected-info">
          <div className="selected-info-top"><div className="mini-avatar" style={{'--char':selected.color,'--accent':selected.accent} as React.CSSProperties}><span className="avatar-hair"/><span className="avatar-face"/><span className="avatar-body"/></div><div><span className="eyebrow">SURVIVOR PROFILE</span><h3>{selected.name}<small>{selected.role}</small></h3></div><span className="ready-pill">READY</span></div>
          <p>{selected.perk}</p>
          <div className="stat-list"><Stat label="HEALTH" value={Math.min(100,selected.hp/1.4)} text={`${selected.hp} HP`} color="green"/><Stat label="DAMAGE" value={selected.damage*3.1} text={`${selected.damage}`} color="red"/><Stat label="SPEED" value={selected.speed*25} text={`${selected.speed.toFixed(1)}`} color="blue"/></div>
          <button className="select-confirm" onClick={startGame}>PILIH {selected.name.toUpperCase()} <ChevronRight size={17}/></button>
        </div>
        <div className="tip"><Zap size={17}/><div><b>TIP SURVIVAL</b><span>Terus bergerak! Musuh akan mengepung dari segala arah.</span></div></div>
      </div>
    </section>}

    {screen==='playing' && <section className="game-layout">
      <div className="game-topline"><button className="back-btn" onClick={leaveGame}>← MENU</button><div className="arena-label"><span className="status-dot"/> ACTIVE ZONE <span className="muted">/ OUTSKIRTS</span></div><button className="pause-btn" onClick={()=>setPause(p=>!p)}>{pause?'▶ LANJUT':'Ⅱ JEDA'}</button></div>
      <div className="game-hud">
        <div className="hud-player"><div className="hud-avatar" style={{'--char':selected.color,'--accent':selected.accent} as React.CSSProperties}><span className="avatar-hair"/><span className="avatar-face"/><span className="avatar-body"/></div><div className="hud-health"><div className="hud-label">{selected.name.toUpperCase()} <b>LV. {hud.level}</b></div><div className="bar"><i style={{width:`${Math.max(0,hud.hp/hud.maxHp*100)}%`}}/></div><small>{Math.max(0,Math.ceil(hud.hp))} / {hud.maxHp} HP</small></div></div>
        <div className="timer-box"><Skull size={19}/><strong>{hud.phase==='boss'?'BOSS!':'00:'+String(Math.max(0,Math.ceil(hud.time))).padStart(2,'0')}</strong><span>{hud.phase==='boss'?'DEFEAT THE BOSS':'REMAINING'}</span></div>
        <div className="hud-resources"><span><Coins size={17}/>{hud.coins}</span><span><Skull size={17}/>{hud.kills} KILLS</span><span><Zap size={17}/>{hud.wave}/10 WAVE</span></div>
      </div>
      <div className="canvas-wrap"><canvas ref={canvasRef}/>{pause&&<div className="overlay"><div className="overlay-card"><span className="eyebrow">TACTICAL PAUSE</span><h2>Waktu berhenti.</h2><p>Atur napas, survivor. Kota belum aman.</p><button className="primary-btn" onClick={()=>setPause(false)}>LANJUTKAN <ChevronRight size={16}/></button><button className="secondary-btn" onClick={leaveGame}>KEMBALI KE MENU</button></div></div>}
        {upgradeOpen&&<div className="overlay"><div className="overlay-card upgrade-card"><span className="eyebrow">LEVEL UP // UPGRADE</span><h2>Jadi lebih kuat.</h2><p>Pilih peningkatan untuk melanjutkan survival.</p><div className="upgrade-options"><button onClick={()=>{setDamageBoost(v=>v+1);setUpgradeOpen(false);}}><Crosshair/><b>Damage +4</b><small>Serangan lebih sakit</small></button><button onClick={()=>{setSpeedBoost(v=>v+1);setUpgradeOpen(false);}}><Zap/><b>Speed +0.2</b><small>Bergerak lebih cepat</small></button><button onClick={()=>{const g=gameRef.current;if(g){g.maxHp+=20;g.hp=Math.min(g.maxHp,g.hp+20);}setUpgradeOpen(false);}}><Heart/><b>Heal +20</b><small>Tambah health maksimum</small></button></div><button className="secondary-btn" onClick={continueAfterUpgrade}>LEWATI UPGRADE</button></div></div>}
      </div>
      <div className="game-footer"><span><i className="keycap">W</i><i className="keycap">A</i><i className="keycap">S</i><i className="keycap">D</i> MOVE</span><span><i className="keycap">P</i> PAUSE</span><span className="footer-note">AIM: MOUSE · KLIK KIRI: TEMBAK <span className="status-dot"/></span></div>
      <div className="xp-line"><span>EXPERIENCE <b>LV.{hud.level}</b></span><div className="xp-bar"><i style={{width:`${hud.xp}%`}}/></div><span>{Math.floor(hud.xp)}%</span></div>
    </section>}

    {screen==='result' && <section className="result-screen"><div className="result-card"><div className={`result-icon ${lastResult.won?'win':''}`}>{lastResult.won?<Trophy size={34}/>:<Skull size={34}/>}</div><span className="eyebrow">{lastResult.won?'MISSION COMPLETE':'SIGNAL LOST'}</span><h1>{lastResult.won?'YOU SURVIVED.':'YOU FELL.'}</h1><p>{lastResult.won?'Kamu bertahan 60 detik dan mengalahkan boss.':'Kota ini belum menyerah. Coba lagi, survivor.'}</p><div className="result-stats"><div><Skull/><b>{lastResult.kills}</b><span>KILLS</span></div><div><Coins/><b>{lastResult.coins}</b><span>COINS</span></div><div><Heart/><b>{lastResult.time}s</b><span>SURVIVED</span></div></div><div className="result-character"><div className="mini-avatar" style={{'--char':selected.color,'--accent':selected.accent} as React.CSSProperties}><span className="avatar-hair"/><span className="avatar-face"/><span className="avatar-body"/></div><span>Survivor: <b>{selected.name}</b></span></div><button className="primary-btn" onClick={startGame}><RotateCcw size={17}/> COBA LAGI</button><button className="secondary-btn" onClick={leaveGame}>GANTI KARAKTER</button></div></section>}

    <footer className="site-footer"><span>LAST 60 SECONDS <b>© 2026</b></span><span>BUILT TO SURVIVE <i/> REACT + TYPESCRIPT</span></footer>
  </main>;
}

function Stat({label,value,text,color}:{label:string;value:number;text:string;color:string}) {
  return <div className="stat-row"><span>{label}</span><div className={`stat-track ${color}`}><i style={{width:`${Math.max(4,Math.min(100,value))}%`}}/></div><b>{text}</b></div>;
}
export default App;