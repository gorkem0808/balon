export class AudioManager{
  constructor(getSettings){
    this.getSettings=getSettings; this.unlocked=false;
    this.files={
      music:'assets/audio/music/carnival_loop.wav',
      coin:'assets/audio/sfx/coin.wav', start:'assets/audio/sfx/start.wav', launch:'assets/audio/sfx/balloon_spawn.wav', score:'assets/audio/sfx/score.wav', wrong:'assets/audio/sfx/wrong.wav', warning:'assets/audio/sfx/warning.wav', gameOver:'assets/audio/sfx/game_over.wav',
      voice_insertCoin:'assets/audio/voice/please_insert_coin.wav', voice_credit:'assets/audio/voice/credit_added.wav', voice_start:'assets/audio/voice/game_starting.wav', voice_score:'assets/audio/voice/score.wav', voice_wrong:'assets/audio/voice/wrong.wav', voice_warning:'assets/audio/voice/warning.wav', voice_gameOver:'assets/audio/voice/game_over.wav'
    };
    this.music=new Audio(this.files.music); this.music.loop=true; this.music.preload='auto';
  }
  vol(n){return Math.max(0,Math.min(1,(Number(n)||0)/100))}
  unlock(){this.unlocked=true;this.updateMusic()}
  updateMusic(){const s=this.getSettings();this.music.volume=this.vol(s.masterVolume)*this.vol(s.musicVolume);if(this.unlocked)this.music.play().catch(()=>{})}
  pauseMusic(){this.music.pause()}
  play(name,specific='effectsVolume',gain=1){if(!this.unlocked)return;const s=this.getSettings();const a=new Audio(this.files[name]);a.volume=Math.min(1,this.vol(s.masterVolume)*this.vol(s.effectsVolume)*this.vol(s[specific]??100)*gain);a.play().catch(()=>{})}
  voice(name,specific,gain=1){if(!this.unlocked)return;const s=this.getSettings();const a=new Audio(this.files['voice_'+name]);a.volume=Math.min(1,this.vol(s.masterVolume)*this.vol(s.voiceVolume)*this.vol(s[specific]??100)*gain);a.play().catch(()=>{})}
}
