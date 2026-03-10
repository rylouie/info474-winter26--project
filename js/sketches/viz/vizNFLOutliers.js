// vizNFLOutliers.js — restyled to match site palette
class VizNFLOutliers {
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
      const BG        = [249, 246, 241];
      const TEXT      = [26, 26, 26];
      const SUBTEXT   = [85, 80, 68];
      const GRID      = [210, 205, 195];
      const GOLD      = [180, 120, 40];
      const COL_AVG   = [100, 140, 200];   // blue dashed = average
      const COL_OUT   = [192, 75, 55];     // red = outlier

      const positions = ['Running Back', 'Wide Receiver', 'Quarterback'];
      const data = [
        { position: 'Running Back',  avg: 27, outlier: 39, outlierName: 'Frank Gore'  },
        { position: 'Wide Receiver', avg: 29, outlier: 42, outlierName: 'Jerry Rice'  },
        { position: 'Quarterback',   avg: 36, outlier: 45, outlierName: 'Tom Brady'   },
      ];

      const W = 690, H = 400;
      const margin = { top: 50, right: 30, bottom: 50, left: 50 };
      const chartW = Math.floor((W - margin.left - margin.right - 60) / 3);
      const chartH = H - margin.top - margin.bottom;

      p.setup = function () {
        p.createCanvas(W, H).parent(renderer.canvasContainer);
        p.textFont('Georgia');
        p.noLoop();
      };

      p.draw = function () {
        p.background(...BG);

        // Subtitle
        p.noStroke();
        p.fill(...SUBTEXT); p.textSize(10); p.textAlign(p.LEFT, p.TOP);
        p.text('Average retirement age vs. career outliers by position  ·  scroll to reveal', margin.left, 14);

        positions.forEach((pos, i) => {
          const d    = data[i];
          const offX = margin.left + i * (chartW + 30);
          const offY = margin.top;
          drawChart(p, d, offX, offY, chartW, chartH, renderer.scrollProgress);
        });
      };

      function drawChart(p, d, ox, oy, cw, ch, progress) {
        const minAge = d.avg - 4;
        const maxAge = d.outlier + 3;
        const yScale = age => p.map(age, minAge, maxAge, ch, 0);

        p.push();
        p.translate(ox, oy);

        // Panel background
        p.fill(240, 237, 231); p.noStroke();
        p.rect(0, 0, cw, ch, 4);

        // Grid lines
        for (let a = Math.ceil(minAge); a <= Math.floor(maxAge); a += 4) {
          const y = yScale(a);
          p.stroke(...GRID); p.strokeWeight(1);
          p.line(0, y, cw, y);
          p.noStroke(); p.fill(...SUBTEXT); p.textSize(9); p.textAlign(p.RIGHT, p.CENTER);
          p.text(a, -6, y);
        }

        // Average dashed line
        const avgY = yScale(d.avg);
        p.stroke(...COL_AVG); p.strokeWeight(1.5);
        p.drawingContext.setLineDash([5, 5]);
        p.line(0, avgY, cw, avgY);
        p.drawingContext.setLineDash([]);
        p.noStroke(); p.fill(...COL_AVG); p.textSize(9); p.textAlign(p.CENTER, p.BOTTOM);
        p.text(`Avg · ${d.avg}`, cw / 2, avgY - 5);

        // Outlier bar (scroll-driven)
        if (progress > 0) {
          const localP  = Math.min(1, progress * 2);
          const outlierY = yScale(d.outlier);
          const currentY = p.lerp(avgY, outlierY, localP);

          p.stroke(...COL_OUT); p.strokeWeight(2.5);
          p.line(cw / 2, avgY, cw / 2, currentY);

          // Dot at tip
          p.noStroke(); p.fill(...COL_OUT);
          p.ellipse(cw / 2, currentY, 9, 9);

          // Label when fully revealed
          if (localP >= 0.98) {
            p.fill(...COL_OUT); p.textSize(9.5); p.textAlign(p.CENTER, p.BOTTOM);
            p.text(`${d.outlierName} · ${d.outlier}`, cw / 2, currentY - 7);
          }
        }

        // Y-axis
        p.stroke(...GRID); p.strokeWeight(1);
        p.line(0, 0, 0, ch);

        // Position label
        p.noStroke(); p.fill(...TEXT); p.textSize(11); p.textAlign(p.CENTER, p.BOTTOM);
        p.text(d.position, cw / 2, -8);

        p.pop();
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

window.VizNFLOutliers = VizNFLOutliers;