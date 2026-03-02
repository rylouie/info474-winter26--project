class VizPeakAge {
  constructor() {
    this.chart = null;
    this.canvasEl = null;
  }

  preload() {}

  setup(p, manager, containerEl) {
    // Use provided container, or #vis, or #peak-age-chart so chart is never cleared by p5
    const container = containerEl || document.getElementById("peak-age-chart") || document.getElementById("vis");
    if (!container) return;

    container.innerHTML = "";

    // Create a canvas element for Chart.js (explicit size so it's visible)
    this.canvasEl = document.createElement("canvas");
    this.canvasEl.id = "peakAgeChart";
    this.canvasEl.width = 720;
    this.canvasEl.height = 360;
    this.canvasEl.style.width = "720px";
    this.canvasEl.style.height = "360px";
    this.canvasEl.setAttribute("aria-label", "Age of peak performance by position chart");
    container.appendChild(this.canvasEl);

    // Use data from Basic_Stats.csv (mean age by position, 18–45) or fallback
    const d = (manager && manager.data) || {};
    let positions = d.positions || ['RB', 'WR', 'TE', 'CB', 'LB', 'OL', 'QB'];
    let peakAges = d.peakAges || [25, 27, 27, 26, 27, 29, 30];
    let errors = d.errors || [1.2, 1.2, 1.3, 1.2, 1.2, 1.5, 2.0];
    if (positions.length === 0) {
      positions = ['RB', 'WR', 'TE', 'CB', 'LB', 'OT', 'QB'];
      peakAges = [25, 27, 27, 26, 27, 29, 30];
      errors = [1.2, 1.2, 1.3, 1.2, 1.2, 1.5, 2.0];
    }

    const ctx = this.canvasEl.getContext("2d");

    // Create Chart.js visualization
    this.chart = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [{
          label: "Peak age",
          data: peakAges.map(function(age, i) { return { x: age, y: i }; }),
          backgroundColor: "rgb(59, 130, 246)",
          borderColor: "rgb(30, 64, 175)",
          borderWidth: 1,
          pointRadius: 10,
          pointHoverRadius: 12,
          errorBar: errors
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function(items) {
                const i = items[0].dataIndex;
                return positions[i] + ": " + peakAges[i] + " years";
              },
              afterLabel: function(ctx) {
                const i = ctx.dataIndex;
                return "Range: " +
                  (peakAges[i] - (errors[i] || 0)).toFixed(1) + "–" +
                  (peakAges[i] + (errors[i] || 0)).toFixed(1);
              }
            }
          }
        },
        scales: {
          x: {
            min: 22,
            max: 34,
            title: { display: true, text: "Age of peak performance" },
            grid: { color: "rgba(0,0,0,0.06)" }
          },
          y: {
            min: -0.5,
            max: Math.max(positions.length - 0.5, 0),
            ticks: {
              stepSize: 1,
              callback: function(v) { return positions[v] ?? ""; }
            },
            grid: { display: false }
          }
        }
      },
      plugins: [{
        id: "errorBars",
        afterDatasetsDraw: function(chart) {
          const meta = chart.getDatasetMeta(0);
          const xScale = chart.scales.x;
          const err = chart.data.datasets[0].errorBar;
          if (!err) return;

          const peakAgesArr = chart.data.datasets[0].data.map(function(d) { return d.x; });
          const ctx = chart.ctx;
          ctx.save();
          ctx.strokeStyle = "rgba(0,0,0,0.5)";
          ctx.lineWidth = 1.5;

          meta.data.forEach(function(pt, i) {
            const e = err[i] || 0;
            const left = xScale.getPixelForValue(peakAgesArr[i] - e);
            const right = xScale.getPixelForValue(peakAgesArr[i] + e);
            const y = pt.y;

            ctx.beginPath();
            ctx.moveTo(left, y);
            ctx.lineTo(right, y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(left, y - 4);
            ctx.lineTo(left, y + 4);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(right, y - 4);
            ctx.lineTo(right, y + 4);
            ctx.stroke();
          });

          ctx.restore();
        }
      }]
    });
  }

  draw(p) {
    // Chart.js handles drawing; nothing needed here
  }

  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    if (this.canvasEl) {
      this.canvasEl.remove();
      this.canvasEl = null;
    }
  }
}

window.VizPeakAge = VizPeakAge;
