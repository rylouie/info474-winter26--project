class VizPeakAge {
  constructor() {
    this.chart = null;
    this.canvasEl = null;
  }

  preload() {}

  setup(p) {
    // Create a container for Chart.js inside the #vis div
    const vis = document.getElementById("vis");

    // Remove any previous canvas
    vis.innerHTML = "";

    // Create a canvas element for Chart.js
    this.canvasEl = document.createElement("canvas");
    this.canvasEl.id = "peakAgeChart";
    this.canvasEl.width = 720;
    this.canvasEl.height = 360;
    vis.appendChild(this.canvasEl);

    // Data
    const positions = ['RB', 'WR', 'TE', 'CB', 'LB', 'OL', 'QB'];
    const peakAges = [25, 27, 27, 26, 27, 29, 30];
    const errors = [1.2, 1.2, 1.3, 1.2, 1.2, 1.5, 2.0];

    const ctx = this.canvasEl.getContext("2d");

    // Create Chart.js visualization
    this.chart = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [{
          label: "Peak age",
          data: peakAges.map((age, i) => ({ x: age, y: i })),
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
                  (peakAges[i] - errors[i]).toFixed(1) + "–" + 
                  (peakAges[i] + errors[i]).toFixed(1);
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
            max: positions.length - 0.5,
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
          const yScale = chart.scales.y;
          const err = chart.data.datasets[0].errorBar;
          if (!err) return;

          const ctx = chart.ctx;
          ctx.save();
          ctx.strokeStyle = "rgba(0,0,0,0.5)";
          ctx.lineWidth = 1.5;

          meta.data.forEach((pt, i) => {
            const left = xScale.getPixelForValue(peakAges[i] - err[i]);
            const right = xScale.getPixelForValue(peakAges[i] + err[i]);
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
