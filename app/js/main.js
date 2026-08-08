import {SettingsController} from './settings.js';
import {AudioManager} from './audio-manager.js';
import {EnvironmentController} from './environment-controller.js';
import {CharacterController} from './character-controller.js';
import {BalloonController} from './balloon-controller.js';
import {GameEngine} from './game-engine.js';

const root=document.querySelector('#stage');
let engine;
const settings=new SettingsController(root,()=>engine?.applySettings());
const audio=new AudioManager(()=>settings.settings);
const env=new EnvironmentController(root,()=>settings.settings);
const characters=new CharacterController(root,()=>settings.settings);
const balloons=new BalloonController(root,()=>settings.settings,()=>{ if(engine?.state.mode==='playing'){engine.state.activeSide=null;engine.spawnNext(260)} });
engine=new GameEngine(root,settings,audio,env,characters,balloons);
settings.onChange=()=>engine.applySettings();

document.addEventListener('keydown',e=>{
  if(e.key==='F8'){e.preventDefault();settings.toggle();return}
  if(settings.isOpen()){if(e.key==='Escape')settings.close();return}
  audio.unlock();
  if(e.key.toLowerCase()==='c')engine.insertCoin();
  else if(e.code==='Space'){e.preventDefault();engine.start()}
  else if(e.key.toLowerCase()==='a')engine.hit('left');
  else if(e.key.toLowerCase()==='l')engine.hit('right');
  else if(e.key.toLowerCase()==='p')engine.pause();
  else if(e.key==='F11'){e.preventDefault();document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.().catch(()=>{})}
});
root.addEventListener('pointerdown',()=>audio.unlock(),{once:true});
document.querySelector('#pauseButton').addEventListener('click',()=>engine.pause());
window.addEventListener('blur',()=>{if(engine.state.mode==='playing'&&!engine.state.paused)engine.pause()});
