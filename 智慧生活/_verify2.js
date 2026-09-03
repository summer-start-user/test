const puppeteer = require('puppeteer-core');
const path = 'C:/Users/Summer/Desktop/UX/campus-app/phone/智能生活/Smart-Living/Smart-Living.html';
const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
(async () => {
  const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 900, deviceScaleFactor: 2 });
  const errors = [];
  page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERR: '+e.message));
  await page.goto('file://'+path, { waitUntil:'networkidle0' });
  await page.waitForSelector('#sc-home.on', { timeout:8000 });
  await new Promise(r=>setTimeout(r,400));
  const info = async () => page.evaluate(() => {
    const sc = document.getElementById('sc-home');
    const ht = document.getElementById('homeTop');
    const s  = document.querySelector('#homeTop .search');
    const cs = getComputedStyle(sc); const st = getComputedStyle(ht);
    return { scOverflowY: cs.overflowY, scHeight: cs.height, homeTopPos: st.position,
      collapsed: ht.classList.contains('collapsed'), scScrollTop: sc.scrollTop,
      searchH: getComputedStyle(s).height, searchFont: getComputedStyle(s).fontSize,
      h1: getComputedStyle(document.querySelector('#homeTop .h1')).fontSize }; });
  const atTop = await info();
  await page.evaluate(() => { const sc=document.getElementById('sc-home'); sc.scrollTop=200; sc.dispatchEvent(new Event('scroll')); });
  await new Promise(r=>setTimeout(r,500));
  const scrolled = await info();
  await page.evaluate(() => { const sc=document.getElementById('sc-home'); sc.scrollTop=0; sc.dispatchEvent(new Event('scroll')); });
  await new Promise(r=>setTimeout(r,500));
  const backTop = await info();
  console.log('at top  :', JSON.stringify(atTop));
  console.log('scrolled:', JSON.stringify(scrolled));
  console.log('back top:', JSON.stringify(backTop));
  console.log('errors  :', errors.length, errors.slice(0,5).join(' | '));
  const ok = atTop.homeTopPos==='sticky' && atTop.scOverflowY==='auto'
    && atTop.collapsed===false && parseFloat(atTop.searchH)>=39 && parseFloat(atTop.searchH)<=41
    && scrolled.collapsed===true && parseFloat(scrolled.searchH)===32 && parseFloat(scrolled.searchFont)===12
    && backTop.collapsed===false && errors.length===0;
  console.log(ok ? 'PASS' : 'FAIL');
  await browser.close();
  process.exit(ok?0:1);
})().catch(e=>{ console.error('SCRIPT ERROR', e); process.exit(2); });
