const COLORS=[['#ff6a63','#ef2436','#a90f25'],['#64c7ff','#1586df','#0754aa'],['#ffef63','#f2bc20','#be7810'],['#9bef55','#52b72d','#217c22'],['#ff8fc2','#ed4b91','#ac2364'],['#ca78ff','#8e3ed0','#5c2096']];
export class BalloonController{
  constructor(root,getSettings,onExpire){this.layer=root.querySelector('#balloonLayer');this.getSettings=getSettings;this.onExpire=onExpire;this.active=null}
  spawn(side){this.clear();const s=this.getSettings();const c=COLORS[Math.floor(Math.random()*COLORS.length)];const el=document.createElement('div');el.className='game-balloon '+side;el.style.setProperty('--c1',c[0]);el.style.setProperty('--c2',c[1]);el.style.setProperty('--c3',c[2]);el.style.setProperty('--scale',String(s.balloonScale/100));el.style.setProperty('--life',`${s.balloonLife}ms`);this.layer.appendChild(el);const token=Symbol();this.active={side,el,token};setTimeout(()=>{if(this.active?.token===token){this.active=null;el.remove();this.onExpire?.(side)}},s.balloonLife+80);return this.active}
  pop(){if(!this.active)return null;const a=this.active;this.active=null;a.el.classList.add('pop');setTimeout(()=>a.el.remove(),180);return a}
  clear(){if(this.active?.el)this.active.el.remove();this.active=null}
}
