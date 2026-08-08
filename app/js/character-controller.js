export class CharacterController{
  constructor(root,getSettings){this.root=root;this.getSettings=getSettings;this.panda=root.querySelector('#pandaPatch');this.pig=root.querySelector('#pigPatch');this.pandaEye=root.querySelector('#pandaEye');this.pigEye=root.querySelector('#pigEye');this.timers=[];this.apply();this.startBlink()}
  apply(){this.panda.classList.add('idle');this.pig.classList.add('idle');if(!this.getSettings().blink){this.pandaEye.classList.remove('closed');this.pigEye.classList.remove('closed')}}
  startBlink(){this.timers.forEach(clearTimeout);this.timers=[];const loop=(eye,offset=0)=>{const fn=()=>{if(this.getSettings().blink){eye.classList.add('closed');setTimeout(()=>eye.classList.remove('closed'),145)}this.timers.push(setTimeout(fn,2600+offset+Math.random()*3400))};this.timers.push(setTimeout(fn,1300+offset+Math.random()*2200))};loop(this.pandaEye,0);loop(this.pigEye,700)}
  celebrate(side){const el=side==='left'?this.panda:this.pig;el.classList.remove('idle','wrong');void el.offsetWidth;el.classList.add('celebrate');setTimeout(()=>{el.classList.remove('celebrate');el.classList.add('idle')},980)}
  wrong(side){const el=side==='left'?this.panda:this.pig;el.classList.remove('idle','celebrate');void el.offsetWidth;el.classList.add('wrong');setTimeout(()=>{el.classList.remove('wrong');el.classList.add('idle')},520)}
}
