window.CareerLengthViz = (function () {

  const DATA_URL  = 'data/nfl_stats.csv';
  const POSITIONS = ['QB', 'RB', 'WR'];

  // Site palette
  const BG      = [249, 246, 241];
  const TEXT    = [26,  26,  26];
  const SUBTEXT = [140, 130, 115];
  const GRIDCOL = [200, 195, 185];
  const COLORS  = { QB: [41, 128, 210], RB: [192, 75, 55], WR: [42, 148, 90] };
  const LABELS  = { QB: 'Quarterback', RB: 'Running Back', WR: 'Wide Receiver' };

  // Data — loaded once
  let positionData=null, loadState='idle', loadError='', jitterCache={};

  // Interaction — reset on re-entry
  let hoveredPos=null, lastActiveIndex=null;

  function parseCSV(text) {
    text=text.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').replace(/\r/g,'\n');
    const lines=text.split('\n').filter(l=>l.trim());
    const headers=lines[0].split(',');
    return lines.slice(1).map(line=>{
      const vals=line.split(','), obj={};
      headers.forEach((h,i)=>{ obj[h.trim()]=(vals[i]||'').trim(); });
      return obj;
    });
  }

  function makeRng(seed) {
    let s=(seed>>>0)||1;
    return ()=>{ s=Math.imul(s,1664525)+1013904223>>>0; return s/4294967296; };
  }

  function quantile(sorted, q) {
    const pos=(sorted.length-1)*q, lo=Math.floor(pos), hi=Math.ceil(pos);
    return sorted[lo]+(sorted[hi]-sorted[lo])*(pos-lo);
  }

  function processRows(rows) {
    const playerSeasons={};
    for (const r of rows) {
      if (!POSITIONS.includes(r.position)||r.season_type!=='REG') continue;
      const season=parseInt(r.season); if(isNaN(season)) continue;
      const key=`${r.player_id}|${r.position}`;
      if (!playerSeasons[key]) playerSeasons[key]={pos:r.position,seasons:[]};
      playerSeasons[key].seasons.push(season);
    }
    const careersByPos={QB:[],RB:[],WR:[]};
    for (const {pos,seasons} of Object.values(playerSeasons))
      careersByPos[pos].push(Math.max(...seasons)-Math.min(...seasons)+1);

    const result={}, newJitter={};
    for (const pos of POSITIONS) {
      const lengths=careersByPos[pos].sort((a,b)=>a-b);
      if (!lengths.length) continue;
      result[pos]={
        lengths, min:lengths[0],
        q1:Math.round(quantile(lengths,0.25)*10)/10,
        median:Math.round(quantile(lengths,0.50)*10)/10,
        q3:Math.round(quantile(lengths,0.75)*10)/10,
        max:lengths[lengths.length-1],
        mean:Math.round(lengths.reduce((a,b)=>a+b,0)/lengths.length*100)/100
      };
      const rng=makeRng(POSITIONS.indexOf(pos)*1337+7);
      newJitter[pos]=lengths.map(()=>(rng()-0.5)*2);
    }
    jitterCache=newJitter;
    return result;
  }

  function loadData() {
    if (loadState!=='idle') return;
    loadState='loading';
    fetch(DATA_URL)
      .then(r=>{ if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then(text=>{ positionData=processRows(parseCSV(text)); loadState='ready'; })
      .catch(err=>{ loadState='error'; loadError=err.message; });
  }

  function getBounds(p) {
    return { x:72, y:30, w:p.width-72-50, h:p.height-30-90 };
  }

  function yFor(len, b, maxLen) { return b.y+b.h-(len/maxLen)*b.h; }

  function draw(p, manager, activeIndex, progress) {
    if (activeIndex!==lastActiveIndex) {
      hoveredPos=null; lastActiveIndex=activeIndex;
      p.mouseMoved=()=>{
        if (!positionData) return;
        const b=getBounds(p), colW=b.w/POSITIONS.length;
        hoveredPos=null;
        for (let i=0;i<POSITIONS.length;i++) {
          const cx=b.x+(i+0.5)*colW;
          if (Math.abs(p.mouseX-cx)<colW*0.44&&p.mouseY>b.y&&p.mouseY<b.y+b.h) {
            hoveredPos=POSITIONS[i]; break;
          }
        }
      };
    }

    if (loadState==='idle') loadData();

    // Clear with site background color
    p.background(BG[0], BG[1], BG[2]);

    if (loadState==='loading') { showMsg(p,'Loading data…'); return; }
    if (loadState==='error')   { showMsg(p,'Error: '+loadError); return; }
    if (!positionData)         { showMsg(p,'No data.'); return; }

    const maxLen=Math.max(...POSITIONS.map(pos=>positionData[pos]?.max||0))+2;
    const b=getBounds(p), colW=b.w/POSITIONS.length;
    const anim=Math.min(progress*1.4,1);

    // Grid
    const step=maxLen<=16?2:4;
    p.stroke(GRIDCOL[0],GRIDCOL[1],GRIDCOL[2]); p.strokeWeight(1);
    for (let len=0;len<=maxLen;len+=step) p.line(b.x,yFor(len,b,maxLen),b.x+b.w,yFor(len,b,maxLen));

    // Y axis
    p.noStroke(); p.fill(SUBTEXT[0],SUBTEXT[1],SUBTEXT[2]); p.textSize(11); p.textAlign(p.RIGHT,p.CENTER);
    for (let len=0;len<=maxLen;len+=step) p.text(len,b.x-8,yFor(len,b,maxLen));
    p.push(); p.fill(TEXT[0],TEXT[1],TEXT[2]); p.textSize(11);
    p.translate(b.x-52,b.y+b.h/2); p.rotate(-p.HALF_PI);
    p.textAlign(p.CENTER,p.CENTER); p.text('Career Length (seasons)',0,0); p.pop();

    // X axis position labels
    p.textAlign(p.CENTER,p.TOP);
    for (let i=0;i<POSITIONS.length;i++) {
      const pos=POSITIONS[i], stat=positionData[pos], col=COLORS[pos];
      const cx=b.x+(i+0.5)*colW;
      p.fill(col[0],col[1],col[2]); p.textSize(14); p.text(pos,cx,b.y+b.h+12);
      p.fill(SUBTEXT[0],SUBTEXT[1],SUBTEXT[2]); p.textSize(10); p.text(LABELS[pos],cx,b.y+b.h+30);
      if (stat) { p.fill(SUBTEXT[0],SUBTEXT[1],SUBTEXT[2]); p.textSize(9); p.text(`median: ${stat.median} yrs`,cx,b.y+b.h+48); }
    }

    // Columns
    for (let i=0;i<POSITIONS.length;i++) {
      const pos=POSITIONS[i]; if(!positionData[pos]) continue;
      const stat=positionData[pos], col=COLORS[pos], cx=b.x+(i+0.5)*colW;
      const isHovered=hoveredPos===pos;
      const dotAlpha=isHovered?180:(hoveredPos===null?120:30);
      const boxAlpha=isHovered?255:(hoveredPos===null?200:50);
      const jitter=jitterCache[pos]||[], dots=stat.lengths;
      const jitterW=colW*0.28, count=Math.floor(dots.length*anim);

      // Beeswarm dots
      p.noStroke();
      for (let j=0;j<count;j++) {
        const jx=cx+(jitter[j]||0)*jitterW;
        p.fill(col[0],col[1],col[2],dotAlpha);
        p.ellipse(jx,yFor(dots[j],b,maxLen),5,5);
      }

      // Box plot
      const bw=colW*0.16, ww=6;
      const yMed=yFor(stat.median,b,maxLen), yQ1=yFor(stat.q1,b,maxLen);
      const yQ3=yFor(stat.q3,b,maxLen), yMin=yFor(stat.min,b,maxLen);
      const yMax=yFor(stat.max,b,maxLen), yMn=yFor(stat.mean,b,maxLen);

      p.fill(col[0],col[1],col[2],isHovered?50:30);
      p.stroke(col[0],col[1],col[2],boxAlpha); p.strokeWeight(1.5);
      p.rect(cx-bw,yQ3,bw*2,yQ1-yQ3,2);

      // Median — gold accent to match site
      p.stroke(180,120,40,boxAlpha); p.strokeWeight(2.5);
      p.line(cx-bw,yMed,cx+bw,yMed);

      p.stroke(col[0],col[1],col[2],boxAlpha); p.strokeWeight(1.5);
      p.line(cx,yQ1,cx,yMin); p.line(cx,yQ3,cx,yMax);
      p.line(cx-ww,yMin,cx+ww,yMin); p.line(cx-ww,yMax,cx+ww,yMax);

      // Mean dot
      p.noStroke();
      p.fill(col[0],col[1],col[2],boxAlpha); p.ellipse(cx,yMn,11,11);
      p.fill(BG[0],BG[1],BG[2]); p.ellipse(cx,yMn,6,6);

      // Hover tooltip
      if (isHovered) {
        const tw=162, th=126;
        let tx=cx+colW*0.5+8, ty=b.y+20;
        if (tx+tw>p.width-10) tx=cx-colW*0.5-tw-8;
        p.fill(252, 250, 246, 255); p.stroke(180,120,40); p.strokeWeight(1.5);
        p.rect(tx,ty,tw,th,5);
        p.noStroke(); p.textAlign(p.LEFT,p.TOP);
        p.fill(col[0],col[1],col[2]); p.textSize(12); p.text(LABELS[pos],tx+10,ty+8);
        const trows=[
          ['Median',stat.median+' seasons'],['Mean',stat.mean.toFixed(1)+' seasons'],
          ['IQR',stat.q1+' – '+stat.q3+' seasons'],['Range',stat.min+' – '+stat.max+' seasons'],
          ['Players',stat.lengths.length]
        ];
        p.textSize(10.5); let oy=28;
        for (const [label,val] of trows) {
          p.fill(SUBTEXT[0],SUBTEXT[1],SUBTEXT[2]); p.text(label+':',tx+10,ty+oy);
          p.fill(TEXT[0],TEXT[1],TEXT[2]); p.text(val,tx+76,ty+oy); oy+=17;
        }
      }
    }

    // Subtitle only — title explained by sidebar
    p.noStroke();
    p.fill(SUBTEXT[0],SUBTEXT[1],SUBTEXT[2]); p.textSize(10); p.textAlign(p.LEFT,p.TOP);
    p.text('Each dot = one player\'s career  ·  Box shows the middle 50%  ·  Hover a column to explore',b.x,b.y-16);

    // Hover prompt in gold to match aging curve
    p.noStroke(); p.fill(180,120,40); p.textSize(9); p.textAlign(p.LEFT,p.BOTTOM);
    p.text('↑ Hover a column to explore the full distribution',b.x,b.y+b.h+72);
    // Footnote
    p.fill(SUBTEXT[0],SUBTEXT[1],SUBTEXT[2]); p.textSize(9);
    p.text('nfl_stats.csv · 2012–2024 REG seasons · career = last season − first season + 1',b.x,b.y+b.h+85);
  }

  function showMsg(p, text) {
    p.noStroke(); p.fill(SUBTEXT[0],SUBTEXT[1],SUBTEXT[2]);
    p.textSize(13); p.textAlign(p.CENTER,p.CENTER); p.text(text,p.width/2,p.height/2);
  }

  return { draw };
})();