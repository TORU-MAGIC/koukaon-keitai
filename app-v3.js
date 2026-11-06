(() => {
  'use strict';
  const effects = [
    {name:'ピンポーン',file:'sfx_correct_pingpong.wav'},
    {name:'ブザー',file:'sfx_wrong_buzzer.wav'},
    {name:'キラキラ',file:'sfx_magic_sparkle_reveal.wav'},
    {name:'出現',file:'sfx_magic_whoosh_appear.wav'},
    {name:'消失',file:'sfx_magic_vanish_poof.wav'},
    {name:'ジャーン',file:'sfx_magic_tada_sting.wav'},
    {name:'シャキーン',file:'sfx_shakiin.mp3'},
    {name:'テレレレッテレー',file:'sfx_tetererettelei.mp3'},
    {name:'ピューイーン',file:'sfx_pyuiin.mp3'},
    {name:'ルービックキューブがそろう',file:'sfx_rubik_complete.wav'},
    {name:'大砲',file:'sfx_cannon.wav'}
  ].map(x=>({...x, binding:null, audio:new Audio(`./sound-effects/${x.file}`)}));
  const storageKey='magic-show-cue.iphone-remote.v1';
  const $=s=>document.querySelector(s);
  const status=$('#connectionStatus'), help=$('#statusHelp'), dot=$('#connectionDot'), last=$('#lastInput'), list=$('#effectList'), stop=$('#stopAll'), keyboardCapture=$('#keyboardCapture');
  let audioReady=false, learning=-1, learningTimer=0, connectedGamepad=false;
  const held=new Set();
  try { const saved=JSON.parse(localStorage.getItem(storageKey)||'[]'); effects.forEach((e,i)=>{if(saved[i])e.binding=saved[i]}); } catch(_){}
  function persist(){try{localStorage.setItem(storageKey,JSON.stringify(effects.map(e=>e.binding)))}catch(_){}}
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function describe(binding){if(!binding)return '未登録';if(binding.type==='gamepad')return `コントローラー ${binding.button+1} 番`;return binding.label||binding.key}
  function render(){list.innerHTML=effects.map((e,i)=>`<article class="effect"><div><h3 class="effect-title">${esc(e.name)}</h3><span class="binding">ボタン：${esc(describe(e.binding))}</span></div><div class="effect-buttons"><button class="learn" data-learn="${i}">${learning===i?'入力待ち…':'ボタン登録'}</button><button class="play" data-play="${i}">再生</button></div></article>`).join('')}
  function setStatus(title,message,isOn){status.textContent=title;help.textContent=message;dot.classList.toggle('on',!!isOn)}
  function showInput(label){last.textContent=`${label}　${new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`}
  function stopAll(){effects.forEach(e=>{e.audio.pause();try{e.audio.currentTime=0}catch(_){}});stop.disabled=true}
  async function prepare(){
    try{await Promise.all(effects.map(e=>new Promise((resolve,reject)=>{if(e.audio.readyState>=2){resolve();return}e.audio.addEventListener('canplaythrough',resolve,{once:true});e.audio.addEventListener('error',()=>reject(Error(`${e.name}を読み込めません`)),{once:true});e.audio.load()})));audioReady=true;setStatus(connectedGamepad?'コントローラー接続中':'音の準備ができました',connectedGamepad?'登録したボタンで効果音を鳴らせます':'コントローラーを接続し、ボタン登録を行ってください',connectedGamepad)}catch(e){setStatus('音を読み込めません',e.message,false)}
  }
  function play(i){if(!audioReady){setStatus('先に音を準備してください','「音を準備する」を一度タップしてください。',false);return}const a=effects[i].audio;try{a.pause();a.currentTime=0}catch(_){}a.play().catch(()=>setStatus('再生できません','もう一度「音を準備する」を押してください。',false));stop.disabled=false;setStatus(`再生中：${effects[i].name}`,'画面の再生ボタン、登録したキー、またはコントローラーで操作できます。',connectedGamepad)}
  function bind(binding,label){showInput(label);if(learning>=0){effects.forEach((e,i)=>{if(i!==learning&&e.binding&&JSON.stringify(e.binding)===JSON.stringify(binding))e.binding=null});effects[learning].binding=binding;const name=effects[learning].name;learning=-1;clearTimeout(learningTimer);persist();render();setStatus(`${name} に登録しました`,`${label} を押すと効果音が鳴ります。`,connectedGamepad);return}const i=effects.findIndex(e=>e.binding&&JSON.stringify(e.binding)===JSON.stringify(binding));if(i>=0)play(i)}
  function learn(i){learning=i;render();setStatus(`${effects[i].name} のボタン待ち`,`コントローラーのボタンを1回押してください。ページ送り・矢印キー型は入力欄にフォーカスします。10秒以内に入力が届くと登録します。`,connectedGamepad);try{keyboardCapture.focus({preventScroll:true})}catch(_){keyboardCapture.focus()}clearTimeout(learningTimer);learningTimer=setTimeout(()=>{if(learning!==i)return;learning=-1;render();setStatus('入力を受信できませんでした','Bluetooth接続とコントローラーの入力方式を確認してください。音量・再生ボタンはiOSが処理し、取得できないことがあります。',connectedGamepad)},10000)}
  list.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;if(b.dataset.learn!==undefined)learn(Number(b.dataset.learn));if(b.dataset.play!==undefined)play(Number(b.dataset.play))});
  $('#enableAudio').addEventListener('click',prepare);$('#scanButton').addEventListener('click',()=>{pollGamepads();setStatus(connectedGamepad?'コントローラーを検出しました':'コントローラーを確認中','Safariを開いたまま、接続済みコントローラーのボタンを押してください。',connectedGamepad)});stop.addEventListener('click',stopAll);
  document.addEventListener('keydown',ev=>{if(['Shift','Control','Alt','Meta'].includes(ev.key))return;const id=`key:${ev.code||ev.key}`;if(held.has(id)||ev.repeat)return;held.add(id);const label=ev.code||ev.key;if(learning>=0||effects.some(e=>e.binding?.type==='keyboard'&&e.binding.key===(ev.code||ev.key)))ev.preventDefault();bind({type:'keyboard',key:ev.code||ev.key,label},`キー ${label}`)},true);
  document.addEventListener('keyup',ev=>held.delete(`key:${ev.code||ev.key}`),true);
  keyboardCapture.addEventListener('input',()=>{keyboardCapture.value=''});
  keyboardCapture.addEventListener('focus',()=>{if(learning<0)setStatus('キーボード入力を受け付けています','ページ送り・矢印キー型のリモコンを登録できます。',connectedGamepad)});
  window.addEventListener('gamepadconnected',ev=>{connectedGamepad=true;setStatus('コントローラーを検出しました',`${ev.gamepad.id||'Bluetoothコントローラー'}。ボタンを登録できます。`,true)});
  window.addEventListener('gamepaddisconnected',()=>{connectedGamepad=Array.from(navigator.getGamepads?.()||[]).some(Boolean);setStatus(connectedGamepad?'コントローラー接続中':'コントローラーが切断されました',connectedGamepad?'登録したボタンが使えます':'iPhoneのBluetooth設定とコントローラーの電源を確認してください。',connectedGamepad)});
  function pollGamepads(){if(!navigator.getGamepads){setStatus('ゲームパッドAPIを利用できません','Safariを最新版に更新してください。画面の再生ボタンは使えます。',false);return}let any=false;for(const gp of navigator.getGamepads()){if(!gp)continue;any=true;gp.buttons.forEach((b,i)=>{const id=`gp:${gp.id}:${i}`,pressed=!!(b.pressed||b.value>.55);if(pressed&&!held.has(id)){held.add(id);bind({type:'gamepad',id:gp.id,button:i},`コントローラー ${i+1} 番`)}else if(!pressed)held.delete(id)})}if(any&&!connectedGamepad){connectedGamepad=true;setStatus('コントローラーを検出しました','ボタン登録を押してから、使いたいボタンを押してください。',true)}requestAnimationFrame(pollGamepads)}
  effects.forEach(e=>e.audio.addEventListener('ended',()=>{stop.disabled=effects.every(x=>x.audio.paused)}));
  render();requestAnimationFrame(pollGamepads);
  if('serviceWorker' in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
