// nflPerformance.js — restyled to match site palette
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
      // ── Palette (matches viz 1 & 2) ──────────────────────────────────
      const BG      = [249, 246, 241];
      const TEXT    = [26, 26, 26];
      const SUBTEXT = [85, 80, 68];
      const GRID    = [210, 205, 195];
      const GOLD    = [180, 120, 40];

      const W = 690, H = 460;
      const margin = { top: 40, right: 120, bottom: 60, left: 55 };
      const chartW = W - margin.left - margin.right;
      const chartH = H - margin.top - margin.bottom;

      const ageMin = 22, ageMax = 42;
      const perfMin = 0, perfMax = 100;

      const positions = [
        {
          label: 'Running Back', shortLabel: 'RB',
          color: [255, 107, 87],
          replacement: 38, intersectAge: 28,
          curve: [
            { age: 22, perf: 62 }, { age: 23, perf: 75 }, { age: 24, perf: 85 },
            { age: 25, perf: 88 }, { age: 26, perf: 84 }, { age: 27, perf: 76 },
            { age: 28, perf: 64 }, { age: 29, perf: 50 }, { age: 30, perf: 38 },
            { age: 31, perf: 28 }, { age: 32, perf: 20 }, { age: 33, perf: 14 },
            { age: 34, perf: 10 }, { age: 35, perf: 7  },
          ]
        },
        {
          label: 'Wide Receiver', shortLabel: 'WR',
          color: [72, 199, 142],
          replacement: 35, intersectAge: 30,
          curve: [
            { age: 22, perf: 50 }, { age: 23, perf: 62 }, { age: 24, perf: 72 },
            { age: 25, perf: 80 }, { age: 26, perf: 85 }, { age: 27, perf: 86 },
            { age: 28, perf: 83 }, { age: 29, perf: 75 }, { age: 30, perf: 63 },
            { age: 31, perf: 50 }, { age: 32, perf: 38 }, { age: 33, perf: 28 },
            { age: 34, perf: 20 }, { age: 35, perf: 14 }, { age: 36, perf: 10 },
          ]
        },
        {
          label: 'Quarterback', shortLabel: 'QB',
          color: [64, 169, 255],
          replacement: 30, intersectAge: 36,
          curve: [
            { age: 22, perf: 42 }, { age: 23, perf: 54 }, { age: 24, perf: 63 },
            { age: 25, perf: 70 }, { age: 26, perf: 76 }, { age: 27, perf: 80 },
            { age: 28, perf: 83 }, { age: 29, perf: 85 }, { age: 30, perf: 86 },
            { age: 31, perf: 85 }, { age: 32, perf: 83 }, { age: 33, perf: 79 },
            { age: 34, perf: 74 }, { age: 35, perf: 67 }, { age: 36, perf: 58 },
            { age: 37, perf: 48 }, { age: 38, perf: 38 }, { age: 39, perf: 30 },
            { age: 40, perf: 22 }, { age: 41, perf: 16 }, { age: 42, perf: 11 },
          ]
        },
      ];

      const xScale = age  => p.map(age,  ageMin,  ageMax,  0, chartW);
      const yScale = perf => p.map(perf, perfMin, perfMax, chartH, 0);

      p.setup = function () {
        p.createCanvas(W, H).parent(renderer.canvasContainer);
        p.textFont('Georgia');
        p.noLoop();
      };

      p.draw = function () {
        p.background(...BG);
        p.push();
        p.translate(margin.left, margin.top);

        drawGrid();
        drawAxes();

        positions.forEach((pos, i) => {
          const start = i / positions.length;
          const end   = (i + 1) / positions.length;
          const localP = p.constrain((renderer.scrollProgress - start) / (end - start), 0, 1);
          drawCurve(pos, localP);
        });

        drawLegend();
        p.pop();
      };

      function drawGrid() {
        p.stroke(...GRID); p.strokeWeight(1);
        for (let v = 0; v <= 100; v += 20) p.line(0, yScale(v), chartW, yScale(v));
        for (let a = ageMin; a <= ageMax; a += 2) p.line(xScale(a), 0, xScale(a), chartH);
      }

      function drawAxes() {
        p.stroke(160, 150, 135); p.strokeWeight(1.5);
        p.line(0, chartH, chartW, chartH);
        p.line(0, 0, 0, chartH);

        p.noStroke(); p.fill(...SUBTEXT); p.textSize(10);
        p.textAlign(p.CENTER, p.TOP);
        for (let a = ageMin; a <= ageMax; a += 4) p.text(a, xScale(a), chartH + 8);

        p.textAlign(p.RIGHT, p.CENTER);
        for (let v = 0; v <= 100; v += 20) p.text(v, -8, yScale(v));

        p.fill(...SUBTEXT); p.textSize(11); p.textAlign(p.CENTER, p.CENTER);
        p.text('Age', chartW / 2, chartH + 40);

        p.push();
        p.translate(-38, chartH / 2);
        p.rotate(-p.HALF_PI);
        p.text('Performance Score', 0, 0);
        p.pop();

        // Subtitle
        p.fill(...SUBTEXT); p.textSize(9.5); p.textAlign(p.LEFT, p.TOP);
        p.text('Expected performance relative to replacement-level · dashed line = replacement threshold', 0, -margin.top + 8);
      }

      function drawCurve(pos, progress) {
        if (progress <= 0) return;
        const [r, g, b] = pos.color;
        const total   = pos.curve.length;
        const drawTo  = Math.floor(progress * (total - 1));
        const rem     = (progress * (total - 1)) - drawTo;

        // Replacement threshold dashed
        p.stroke(r, g, b, 100); p.strokeWeight(1.5);
        p.drawingContext.setLineDash([5, 5]);
        p.line(0, yScale(pos.replacement), chartW, yScale(pos.replacement));
        p.drawingContext.setLineDash([]);
        p.noStroke(); p.fill(r, g, b, 160); p.textSize(9); p.textAlign(p.LEFT, p.CENTER);
        p.text(`${pos.shortLabel} replacement`, chartW + 6, yScale(pos.replacement));

        if (drawTo < 1) return;

        // Curve
        p.stroke(r, g, b); p.strokeWeight(2.5); p.noFill();
        p.beginShape();
        for (let i = 0; i <= drawTo; i++) {
          p.vertex(xScale(pos.curve[i].age), yScale(pos.curve[i].perf));
        }
        if (drawTo < total - 1 && rem > 0) {
          const ptA = pos.curve[drawTo], ptB = pos.curve[drawTo + 1];
          p.vertex(xScale(p.lerp(ptA.age, ptB.age, rem)), yScale(p.lerp(ptA.perf, ptB.perf, rem)));
        }
        p.endShape();

        // Intersection marker
        if (progress >= 0.85) {
          const ix = xScale(pos.intersectAge);
          const iy = yScale(pos.replacement);
          const alpha = p.map(progress, 0.85, 1.0, 0, 255);
          p.stroke(r, g, b, alpha * 0.4); p.strokeWeight(1);
          p.drawingContext.setLineDash([3, 4]);
          p.line(ix, iy, ix, chartH);
          p.drawingContext.setLineDash([]);
          p.noStroke(); p.fill(r, g, b, alpha);
          p.ellipse(ix, iy, 9, 9);
          p.fill(r, g, b, alpha); p.textSize(9.5); p.textAlign(p.CENTER, p.BOTTOM);
          p.text(`Age ${pos.intersectAge}`, ix, iy - 8);
        }

        // Tip dot
        if (drawTo >= 1) {
          let tip;
          if (drawTo < total - 1 && rem > 0) {
            const ptA = pos.curve[drawTo], ptB = pos.curve[drawTo + 1];
            tip = { age: p.lerp(ptA.age, ptB.age, rem), perf: p.lerp(ptA.perf, ptB.perf, rem) };
          } else {
            tip = pos.curve[Math.min(drawTo, total - 1)];
          }
          p.noStroke(); p.fill(r, g, b);
          p.ellipse(xScale(tip.age), yScale(tip.perf), 7, 7);
        }
      }

      function drawLegend() {
        const lx = chartW + 10, ly0 = 20;
        positions.forEach((pos, i) => {
          const [r, g, b] = pos.color;
          const ly = ly0 + i * 36;
          p.stroke(r, g, b); p.strokeWeight(2.5);
          p.line(lx, ly + 6, lx + 20, ly + 6);
          p.noStroke(); p.fill(r, g, b); p.textSize(12); p.textAlign(p.LEFT, p.TOP);
          p.text(pos.shortLabel, lx + 26, ly);
          p.fill(...SUBTEXT); p.textSize(9.5);
          p.text(pos.label, lx + 26, ly + 14);
        });
      }
    };

    this.p5Instance = new p5(sketch);
  }

  draw() {}

  destroy() {
    if (this.p5Instance) { this.p5Instance.remove(); this.p5Instance = null; }
    if (this.canvasContainer && this.canvasContainer.parentNode) {
      this.canvasContainer.parentNode.removeChild(this.canvasContainer);
      this.canvasContainer = null;
    }
  }
}

window.VizNFLPerformanceCurve = VizNFLPerformanceCurve;