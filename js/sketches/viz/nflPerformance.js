/**
 * Visualization 6: Performance Curve with Replacement-Level Threshold
 * Line chart showing expected performance vs replacement level by position (RB, WR, QB)
 * Scroll-driven: lines draw in as section scrolls
 */
class VizNFLPerformanceCurve {
    constructor() {
      this.p5Instance = null;
      this.canvasContainer = null;
      this.scrollProgress = 0;
    }
  
    setScrollProgress(progress) {
      this.scrollProgress = progress;
      if (this.p5Instance) this.p5Instance.redraw();
    }
  
    setup(containerEl) {
      const container = containerEl || document.getElementById('vis');
      if (!container || typeof p5 === 'undefined') return;
  
      container.innerHTML = '';
      this.canvasContainer = document.createElement('div');
      container.appendChild(this.canvasContainer);
  
      const renderer = this;
  
      const sketch = function (p) {
  
        // ── Layout ──────────────────────────────────────────────
        const W = 860;
        const H = 480;
        const margin = { top: 70, right: 40, bottom: 60, left: 55 };
        const chartW = W - margin.left - margin.right;
        const chartH = H - margin.top - margin.bottom;
  
        // Age range on x-axis
        const ageMin = 22;
        const ageMax = 42;
  
        // Performance score range (0–100 arbitrary units)
        const perfMin = 0;
        const perfMax = 100;
  
        // ── Data: performance curves per position ────────────────
        // Each position has:
        //   curve: array of {age, perf} for the expected performance line
        //   replacement: flat replacement-level value
        //   intersectAge: approximate age where curve crosses replacement
        //   color: line color
        const positions = [
          {
            label: "Running Back",
            shortLabel: "RB",
            color: [220, 80, 60],
            replacement: 38,
            intersectAge: 28,
            curve: [
              { age: 22, perf: 62 },
              { age: 23, perf: 75 },
              { age: 24, perf: 85 },
              { age: 25, perf: 88 },
              { age: 26, perf: 84 },
              { age: 27, perf: 76 },
              { age: 28, perf: 64 },
              { age: 29, perf: 50 },
              { age: 30, perf: 38 },
              { age: 31, perf: 28 },
              { age: 32, perf: 20 },
              { age: 33, perf: 14 },
              { age: 34, perf: 10 },
              { age: 35, perf: 7 },
            ]
          },
          {
            label: "Wide Receiver",
            shortLabel: "WR",
            color: [60, 160, 200],
            replacement: 35,
            intersectAge: 30,
            curve: [
              { age: 22, perf: 50 },
              { age: 23, perf: 62 },
              { age: 24, perf: 72 },
              { age: 25, perf: 80 },
              { age: 26, perf: 85 },
              { age: 27, perf: 86 },
              { age: 28, perf: 83 },
              { age: 29, perf: 75 },
              { age: 30, perf: 63 },
              { age: 31, perf: 50 },
              { age: 32, perf: 38 },
              { age: 33, perf: 28 },
              { age: 34, perf: 20 },
              { age: 35, perf: 14 },
              { age: 36, perf: 10 },
            ]
          },
          {
            label: "Quarterback",
            shortLabel: "QB",
            color: [80, 180, 120],
            replacement: 30,
            intersectAge: 36,
            curve: [
              { age: 22, perf: 42 },
              { age: 23, perf: 54 },
              { age: 24, perf: 63 },
              { age: 25, perf: 70 },
              { age: 26, perf: 76 },
              { age: 27, perf: 80 },
              { age: 28, perf: 83 },
              { age: 29, perf: 85 },
              { age: 30, perf: 86 },
              { age: 31, perf: 85 },
              { age: 32, perf: 83 },
              { age: 33, perf: 79 },
              { age: 34, perf: 74 },
              { age: 35, perf: 67 },
              { age: 36, perf: 58 },
              { age: 37, perf: 48 },
              { age: 38, perf: 38 },
              { age: 39, perf: 30 },
              { age: 40, perf: 22 },
              { age: 41, perf: 16 },
              { age: 42, perf: 11 },
            ]
          }
        ];
  
        // ── Scale helpers ────────────────────────────────────────
        const xScale = age => p.map(age, ageMin, ageMax, 0, chartW);
        const yScale = perf => p.map(perf, perfMin, perfMax, chartH, 0);
  
        // ── Setup ────────────────────────────────────────────────
        p.setup = function () {
          p.createCanvas(W, H).parent(renderer.canvasContainer);
          p.textFont('Georgia');
          p.noLoop();
        };
  
        // ── Draw ─────────────────────────────────────────────────
        p.draw = function () {
          p.background(15, 18, 24);
          p.push();
          p.translate(margin.left, margin.top);
  
          drawGrid();
          drawAxes();
  
          // Draw each position, staggered by scroll thirds
          positions.forEach((pos, i) => {
            const start = i / positions.length;
            const end = (i + 1) / positions.length;
            const localProgress = p.constrain(
              (renderer.scrollProgress - start) / (end - start), 0, 1
            );
            drawPositionCurve(pos, localProgress);
          });
  
          drawLegend();
          drawTitles();
  
          p.pop();
        };
  
        // ── Grid lines ───────────────────────────────────────────
        function drawGrid() {
          p.stroke(40, 46, 58);
          p.strokeWeight(1);
          // Horizontal grid
          for (let perf = 0; perf <= 100; perf += 20) {
            const y = yScale(perf);
            p.line(0, y, chartW, y);
          }
          // Vertical grid
          for (let age = ageMin; age <= ageMax; age += 2) {
            const x = xScale(age);
            p.line(x, 0, x, chartH);
          }
        }
  
        // ── Axes ─────────────────────────────────────────────────
        function drawAxes() {
          p.stroke(100, 110, 130);
          p.strokeWeight(1.5);
          p.line(0, chartH, chartW, chartH); // x-axis
          p.line(0, 0, 0, chartH);           // y-axis
  
          p.noStroke();
          p.fill(140, 150, 165);
          p.textSize(11);
          p.textAlign(p.CENTER, p.TOP);
  
          // X labels
          for (let age = ageMin; age <= ageMax; age += 4) {
            p.text(age, xScale(age), chartH + 10);
          }
  
          // Y labels
          p.textAlign(p.RIGHT, p.CENTER);
          for (let perf = 0; perf <= 100; perf += 20) {
            p.text(perf, -8, yScale(perf));
          }
  
          // Axis titles
          p.fill(180, 185, 195);
          p.textSize(12);
          p.textAlign(p.CENTER, p.CENTER);
          p.text("Age", chartW / 2, chartH + 38);
  
          p.push();
          p.translate(-38, chartH / 2);
          p.rotate(-p.HALF_PI);
          p.text("Performance Score", 0, 0);
          p.pop();
        }
  
        // ── Per-position curve + replacement line ────────────────
        function drawPositionCurve(pos, progress) {
          if (progress <= 0) return;
  
          const [r, g, b] = pos.color;
  
          // How many curve points to draw
          const totalPoints = pos.curve.length;
          const drawUpTo = Math.floor(progress * (totalPoints - 1));
          const remainder = (progress * (totalPoints - 1)) - drawUpTo;
  
          // ── Replacement level dashed line ──
          p.stroke(r, g, b, 80);
          p.strokeWeight(1.5);
          p.drawingContext.setLineDash([6, 5]);
          p.line(0, yScale(pos.replacement), chartW, yScale(pos.replacement));
          p.drawingContext.setLineDash([]);
  
          // Replacement label on right
          p.noStroke();
          p.fill(r, g, b, 150);
          p.textSize(9.5);
          p.textAlign(p.LEFT, p.CENTER);
          p.text(`${pos.shortLabel} replacement`, chartW + 4, yScale(pos.replacement));
  
          if (drawUpTo < 1) return;
  
          // ── Performance curve ──
          p.stroke(r, g, b);
          p.strokeWeight(2.5);
          p.noFill();
          p.beginShape();
          for (let i = 0; i <= drawUpTo; i++) {
            const pt = pos.curve[i];
            p.vertex(xScale(pt.age), yScale(pt.perf));
          }
          // Interpolate the partial last segment
          if (drawUpTo < totalPoints - 1 && remainder > 0) {
            const ptA = pos.curve[drawUpTo];
            const ptB = pos.curve[drawUpTo + 1];
            const interpAge = p.lerp(ptA.age, ptB.age, remainder);
            const interpPerf = p.lerp(ptA.perf, ptB.perf, remainder);
            p.vertex(xScale(interpAge), yScale(interpPerf));
          }
          p.endShape();
  
          // ── Intersection marker ──
          if (progress >= 0.85) {
            const ix = xScale(pos.intersectAge);
            const iy = yScale(pos.replacement);
            const alpha = p.map(progress, 0.85, 1.0, 0, 255);
  
            // Vertical drop line to x-axis
            p.stroke(r, g, b, alpha * 0.5);
            p.strokeWeight(1);
            p.drawingContext.setLineDash([3, 4]);
            p.line(ix, iy, ix, chartH);
            p.drawingContext.setLineDash([]);
  
            // Circle at intersection
            p.noStroke();
            p.fill(r, g, b, alpha);
            p.circle(ix, iy, 9);
  
            // Age label at intersection
            p.fill(r, g, b, alpha);
            p.textSize(10);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.text(`Age ${pos.intersectAge}`, ix, iy - 8);
          }
  
          // ── Dot at current tip ──
          if (drawUpTo >= 1) {
            let tipPt;
            if (drawUpTo < totalPoints - 1 && remainder > 0) {
              const ptA = pos.curve[drawUpTo];
              const ptB = pos.curve[drawUpTo + 1];
              tipPt = {
                age: p.lerp(ptA.age, ptB.age, remainder),
                perf: p.lerp(ptA.perf, ptB.perf, remainder)
              };
            } else {
              tipPt = pos.curve[Math.min(drawUpTo, totalPoints - 1)];
            }
            p.noStroke();
            p.fill(r, g, b);
            p.circle(xScale(tipPt.age), yScale(tipPt.perf), 7);
          }
        }
  
        // ── Legend ───────────────────────────────────────────────
        function drawLegend() {
          const items = positions;
          const startX = chartW - 200;
          const startY = 10;
          items.forEach((pos, i) => {
            const [r, g, b] = pos.color;
            const x = startX;
            const y = startY + i * 22;
            p.stroke(r, g, b);
            p.strokeWeight(2.5);
            p.line(x, y + 6, x + 22, y + 6);
            p.noStroke();
            p.fill(r, g, b);
            p.circle(x + 11, y + 6, 6);
            p.fill(200, 205, 215);
            p.textSize(11);
            p.textAlign(p.LEFT, p.CENTER);
            p.text(pos.label, x + 28, y + 6);
          });
        }
  
        // ── Titles ───────────────────────────────────────────────
        function drawTitles() {
          p.push();
          p.translate(0, -margin.top);
          p.noStroke();
          p.fill(230, 232, 238);
          p.textSize(17);
          p.textAlign(p.LEFT, p.TOP);
          p.textFont('Georgia');
          p.text("Performance Curve vs. Replacement Level", 0, 10);
          p.fill(130, 138, 155);
          p.textSize(11.5);
          p.text("Expected performance relative to a replacement-level player, by position and age", 0, 36);
          p.pop();
        }
      };
  
      this.p5Instance = new p5(sketch);
    }
  
    draw() {}
  
    destroy() {
      if (this.p5Instance) {
        this.p5Instance.remove();
        this.p5Instance = null;
      }
      if (this.canvasContainer && this.canvasContainer.parentNode) {
        this.canvasContainer.parentNode.removeChild(this.canvasContainer);
        this.canvasContainer = null;
      }
    }
  }
  
  window.VizNFLPerformanceCurve = VizNFLPerformanceCurve;