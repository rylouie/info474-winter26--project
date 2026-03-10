window.AgingCurveViz = (function () {

  const DATA_URL    = 'data/nfl_stats.csv';
  const POSITIONS   = ['QB', 'RB', 'WR'];
  const MIN_GAMES   = 6;
  const MIN_SAMPLES = 2;

  // Site palette: cream background, dark text, gold accent
  const BG       = [249, 246, 241];   // #f9f6f1
  const TEXT     = [26,  26,  26];    // #1a1a1a
  const SUBTEXT  = [140, 130, 115];
  const GRIDCOL  = [200, 195, 185];
  const COLORS   = { QB: [41, 128, 210], RB: [192, 75, 55], WR: [42, 148, 90] };
  const LABELS   = { QB: 'Quarterback', RB: 'Running Back', WR: 'Wide Receiver' };

  // Data — loaded once
  let curveData = null, loadState = 'idle', loadError = '';

  // Interaction — reset on re-entry
  let hoveredAge = null, activePos = null, tooltipInfo = null, lastActiveIndex = null;
  const legendButtons = {};

  function parseCSV(text) {
    text = text.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').replace(/\r/g,'\n');
    const lines = text.split('\n').filter(l=>l.trim());
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const vals=line.split(','), obj={};
      headers.forEach((h,i)=>{ obj[h.trim()]=(vals[i]||'').trim(); });
      return obj;
    });
  }

  function processRows(rows) {
    const groups = {};
    for (const r of rows) {
      if (!POSITIONS.includes(r.position)||r.season_type!=='REG') continue;
      const age=parseInt(r.age), ppg=parseFloat(r.season_average_ppr_ppg), gp=parseInt(r.games_played_season);
      if (isNaN(age)||isNaN(ppg)||isNaN(gp)||gp<MIN_GAMES||age<20||age>42||ppg<=0) continue;
      const key=`${r.position}:${age}`;
      if (!groups[key]) groups[key]=[];
      groups[key].push(ppg);
    }
    const raw={};
    for (const [k,v] of Object.entries(groups))
      if (v.length>=MIN_SAMPLES) raw[k]=v.reduce((a,b)=>a+b,0)/v.length;

    const smoothed={};
    for (const pos of POSITIONS) {
      const ages=Object.keys(raw).filter(k=>k.startsWith(pos+':')).map(k=>parseInt(k.split(':')[1])).sort((a,b)=>a-b);
      for (let i=0;i<ages.length;i++) {
        const win=ages.slice(Math.max(0,i-1),i+2);
        const vals=win.map(a=>raw[`${pos}:${a}`]).filter(v=>v!==undefined);
        smoothed[`${pos}:${ages[i]}`]=vals.reduce((a,b)=>a+b,0)/vals.length;
      }
    }
    const normalized={};
    for (const pos of POSITIONS) {
      const entries=Object.entries(smoothed).filter(([k])=>k.startsWith(pos+':'));
      if (!entries.length) continue;
      const vals=entries.map(([,v])=>v);
      const mn=Math.min(...vals), mx=Math.max(...vals), rng=mx-mn||1;
      for (const [k,v] of entries) normalized[k]=Math.round(((v-mn)/rng)*1000)/10;
    }
    const allAges=new Set(Object.keys(normalized).map(k=>parseInt(k.split(':')[1])));
    return Array.from(allAges).sort((a,b)=>a-b).map(age=>{
      const row={age};
      for (const pos of POSITIONS) { const v=normalized[`${pos}:${age}`]; if(v!==undefined) row[pos]=v; }
      return row;
    }).filter(r=>Object.keys(r).length>1);
  }

  function loadData() {
    if (loadState!=='idle') return;
    loadState='loading';
    fetch(DATA_URL)
      .then(r=>{ if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then(text=>{ curveData=processRows(parseCSV(text)); loadState='ready'; })
      .catch(err=>{ loadState='error'; loadError=err.message; });
  }

  function getBounds(p) {
    return { x:72, y:30, w:p.width-72-195, h:p.height-30-80 };
  }

  function toScreen(age, value, b, minAge, maxAge) {
    return { sx:b.x+((age-minAge)/(maxAge-minAge))*b.w, sy:b.y+b.h-(value/100)*b.h };
  }

  function catmullSmooth(pts, steps) {
    const out=[];
    for (let i=0;i<pts.length-1;i++) {
      const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];
      for (let t=0;t<steps;t++) {
        const s=t/steps,s2=s*s,s3=s2*s;
        out.push({
          sx:0.5*((2*p1.sx)+(-p0.sx+p2.sx)*s+(2*p0.sx-5*p1.sx+4*p2.sx-p3.sx)*s2+(-p0.sx+3*p1.sx-3*p2.sx+p3.sx)*s3),
          sy:0.5*((2*p1.sy)+(-p0.sy+p2.sy)*s+(2*p0.sy-5*p1.sy+4*p2.sy-p3.sy)*s2+(-p0.sy+3*p1.sy-3*p2.sy+p3.sy)*s3)
        });
      }
    }
    if (pts.length) out.push(pts[pts.length-1]);
    return out;
  }

  function draw(p, manager, activeIndex, progress) {
    if (activeIndex !== lastActiveIndex) {
      hoveredAge=null; activePos=null; tooltipInfo=null;
      lastActiveIndex=activeIndex;
      p.mouseMoved = () => {
        if (!curveData) return;
        const b=getBounds(p), minAge=curveData[0].age, maxAge=curveData[curveData.length-1].age;
        const age=Math.round(minAge+((p.mouseX-b.x)/b.w)*(maxAge-minAge));
        if (age>=minAge&&age<=maxAge&&p.mouseX>=b.x&&p.mouseX<=b.x+b.w&&p.mouseY>=b.y&&p.mouseY<=b.y+b.h) {
          hoveredAge=age; const row=curveData.find(d=>d.age===age); tooltipInfo=row?{age,row}:null;
        } else { hoveredAge=null; tooltipInfo=null; }
      };
      p.mouseClicked = () => {
        for (const pos of POSITIONS) {
          const btn=legendButtons[pos];
          if (btn&&p.mouseX>=btn.x&&p.mouseX<=btn.x+btn.w&&p.mouseY>=btn.y&&p.mouseY<=btn.y+btn.h) {
            activePos=(activePos===pos)?null:pos; return;
          }
        }
      };
    }

    if (loadState==='idle') loadData();

    // Clear with site background color
    p.background(BG[0], BG[1], BG[2]);

    if (loadState==='loading') { showMsg(p,'Loading data…'); return; }
    if (loadState==='error')   { showMsg(p,'Error: '+loadError); return; }
    if (!curveData||!curveData.length) { showMsg(p,'No data.'); return; }

    const b=getBounds(p);
    const minAge=curveData[0].age, maxAge=curveData[curveData.length-1].age;

    // Grid lines
    p.stroke(GRIDCOL[0],GRIDCOL[1],GRIDCOL[2]); p.strokeWeight(1);
    for (let v=0;v<=100;v+=25) p.line(b.x,b.y+b.h-(v/100)*b.h,b.x+b.w,b.y+b.h-(v/100)*b.h);
    p.stroke(GRIDCOL[0],GRIDCOL[1],GRIDCOL[2],120);
    for (let a=minAge;a<=maxAge;a+=3) {
      const sx=b.x+((a-minAge)/(maxAge-minAge))*b.w; p.line(sx,b.y,sx,b.y+b.h);
    }

    // Axis labels
    p.noStroke(); p.fill(SUBTEXT[0],SUBTEXT[1],SUBTEXT[2]); p.textSize(12);
    p.textAlign(p.CENTER,p.TOP);
    for (let a=minAge;a<=maxAge;a+=2) p.text(a,b.x+((a-minAge)/(maxAge-minAge))*b.w,b.y+b.h+8);
    p.textAlign(p.RIGHT,p.CENTER);
    for (let v=0;v<=100;v+=25) p.text(v,b.x-8,b.y+b.h-(v/100)*b.h);
    p.fill(TEXT[0],TEXT[1],TEXT[2]); p.textSize(11);
    p.textAlign(p.CENTER,p.BOTTOM); p.text('Player Age',b.x+b.w/2,b.y+b.h+52);
    p.push(); p.translate(b.x-52,b.y+b.h/2); p.rotate(-p.HALF_PI);
    p.textAlign(p.CENTER,p.CENTER); p.text('Performance Index (0–100)',0,0); p.pop();

    // Curves
    for (const pos of POSITIONS) {
      const col=COLORS[pos], isActive=activePos===null||activePos===pos;
      const alpha=isActive?230:35;
      const rows=curveData.filter(d=>pos in d);
      if (rows.length<2) continue;
      const pts=rows.map(d=>toScreen(d.age,d[pos],b,minAge,maxAge));
      const spts=catmullSmooth(pts,10);
      const count=Math.floor(spts.length*Math.min(progress*1.5,1));
      p.noFill(); p.stroke(col[0],col[1],col[2],alpha); p.strokeWeight(isActive?2.5:1);
      p.beginShape();
      for (let i=0;i<count;i++) p.vertex(spts[i].sx,spts[i].sy);
      p.endShape();
      // Small dots at data points only
      if (isActive&&count>0) {
        p.noStroke();
        for (const d of rows) {
          const {sx,sy}=toScreen(d.age,d[pos],b,minAge,maxAge);
          p.fill(col[0],col[1],col[2],hoveredAge===d.age?255:alpha);
          p.ellipse(sx,sy,hoveredAge===d.age?8:4,hoveredAge===d.age?8:4);
        }
      }
    }

    // Peak dot only — no text label on chart
    if (activePos===null) {
      for (const pos of POSITIONS) {
        const rows=curveData.filter(d=>pos in d); if(!rows.length) continue;
        const peak=rows.reduce((best,d)=>d[pos]>best[pos]?d:best);
        const col=COLORS[pos]; const {sx,sy}=toScreen(peak.age,peak[pos],b,minAge,maxAge);
        p.noStroke(); p.fill(col[0],col[1],col[2]); p.ellipse(sx,sy,9,9);
        p.fill(249,246,241); p.ellipse(sx,sy,4,4);
      }
    }

    // Crosshair
    if (hoveredAge!==null) {
      const sx=b.x+((hoveredAge-minAge)/(maxAge-minAge))*b.w;
      p.stroke(SUBTEXT[0],SUBTEXT[1],SUBTEXT[2],80); p.strokeWeight(1); p.line(sx,b.y,sx,b.y+b.h);
    }

    // Tooltip
    if (tooltipInfo) {
      const {age,row}=tooltipInfo;
      const posInRow=POSITIONS.filter(pos=>pos in row);
      const sx=b.x+((age-minAge)/(maxAge-minAge))*b.w;
      const tw=158, th=18+posInRow.length*18+10;
      let tx=sx+12, ty=b.y+12; if(tx+tw>p.width-10) tx=sx-tw-12;
      p.fill(255,255,255,240); p.stroke(GRIDCOL[0],GRIDCOL[1],GRIDCOL[2]); p.strokeWeight(1);
      p.rect(tx,ty,tw,th,5);
      p.noStroke(); p.textAlign(p.LEFT,p.TOP);
      p.fill(TEXT[0],TEXT[1],TEXT[2]); p.textSize(11); p.text(`Age ${age}`,tx+8,ty+5);
      let oy=21;
      for (const pos of posInRow) {
        const col=COLORS[pos]; p.fill(col[0],col[1],col[2]); p.textSize(10);
        p.text(`${LABELS[pos]}: ${row[pos]}`,tx+8,ty+oy); oy+=18;
      }
    }

    // Legend — styled as clickable buttons
    const lx=b.x+b.w+14, ly0=b.y+10;
    const btnW=178, btnH=42;
    for (let i=0;i<POSITIONS.length;i++) {
      const pos=POSITIONS[i], col=COLORS[pos];
      const isActive=activePos===null||activePos===pos;
      const isSelected=activePos===pos;
      const ly=ly0+i*50;
      legendButtons[pos]={x:lx,y:ly,w:btnW,h:btnH};

      // Button background
      if (isSelected) {
        p.fill(col[0],col[1],col[2],30);
      } else {
        p.fill(255,255,255,isActive?180:80);
      }
      // Button border — solid colored border when selected, light gray otherwise
      p.stroke(isSelected ? col[0] : 210, isSelected ? col[1] : 205, isSelected ? col[2] : 198);
      p.strokeWeight(isSelected?2:1);
      p.rect(lx, ly, btnW, btnH, 6);

      // Color line swatch inside button
      p.stroke(col[0],col[1],col[2],isActive?255:80); p.strokeWeight(3);
      p.line(lx+10, ly+btnH/2, lx+26, ly+btnH/2);

      // Position name
      p.noStroke();
      p.fill(col[0],col[1],col[2],isActive?255:100); p.textSize(13); p.textAlign(p.LEFT,p.TOP);
      p.text(pos, lx+32, ly+6);

      // Sublabel with peak age
      const posRows=curveData.filter(d=>pos in d);
      const peakAge=posRows.length ? posRows.reduce((best,d)=>d[pos]>best[pos]?d:best).age : '?';
      p.fill(SUBTEXT[0],SUBTEXT[1],SUBTEXT[2],isActive?220:80); p.textSize(9.5);
      p.text(LABELS[pos]+' · peak age '+peakAge, lx+32, ly+23);
    }

    // "Click to filter" prompt below buttons
    const ny=ly0+POSITIONS.length*50+8;
    p.noStroke(); p.fill(180,120,40); p.textSize(9); p.textAlign(p.LEFT,p.TOP);
    p.text('↑ Click a position to focus',lx,ny);
    p.fill(SUBTEXT[0],SUBTEXT[1],SUBTEXT[2]);
    p.text('Hover chart to compare values',lx,ny+13);

  }

  function showMsg(p, text) {
    p.noStroke(); p.fill(SUBTEXT[0],SUBTEXT[1],SUBTEXT[2]);
    p.textSize(13); p.textAlign(p.CENTER,p.CENTER); p.text(text,p.width/2,p.height/2);
  }

  return { draw };
})();