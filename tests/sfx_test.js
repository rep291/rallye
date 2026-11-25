const { chromium } = require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});const h=await (await b.newContext({viewport:{width:1280,height:720}})).newPage();const errs=[];h.on('pageerror',e=>errs.push(e.message));
await h.goto('http://localhost:3500/host');await new Promise(r=>setTimeout(r,800));await h.mouse.click(5,5);await new Promise(r=>setTimeout(r,1200)); await h.evaluate(() => Effekte.setLoop('lobby_loop')); await new Promise(r=>setTimeout(r,300));
const r=await h.evaluate(()=>{const out={files:Effekte.files,loaded:Effekte.loaded,loop:Effekte.looping};['wuerfel_rollen','rutsche','sieg_fanfare'].forEach(n=>Effekte.play(n));return out});
console.log(JSON.stringify(r),'errors',errs);await b.close(); if (errs.length || r.files.length !== 19 || r.loaded.length !== 19 || !r.loop) process.exit(1);})()
