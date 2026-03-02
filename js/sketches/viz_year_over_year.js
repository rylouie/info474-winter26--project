/**
 * Year-to-Year Change in Performance by Age — RB vs QB line chart (Chart.js).
 * Shown when section 1 is active.
 */
class VizYearOverYear {
  constructor() {
    this.chart = null;
    this.canvasEl = null;
  }

  setup(p, manager, containerEl) {
    var container = containerEl || document.getElementById('year-over-year-chart') || document.getElementById('vis');
    if (!container || typeof Chart === 'undefined') return;

    container.innerHTML = '';

    this.canvasEl = document.createElement('canvas');
    this.canvasEl.id = 'yearOverYearChart';
    this.canvasEl.width = 720;
    this.canvasEl.height = 360;
    this.canvasEl.style.width = '720px';
    this.canvasEl.style.height = '360px';
    this.canvasEl.setAttribute('aria-label', 'Year-to-year change in performance by age, RB vs QB');
    container.appendChild(this.canvasEl);

    // Representative year-over-year % change by age (negative = decline)
    var ages = [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38];
    var rbDelta = [2, 0, -2, -6, -10, -14, -18, -22, -26, -28, -30, -32, -34, -36, -38];
    var qbDelta = [0, 1, 2, 3, 2, 0, -2, -4, -8, -14, -20, -26, -30, -34, -38];

    var ctx = this.canvasEl.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ages,
        datasets: [
          {
            label: 'RB (year-over-year % change)',
            data: rbDelta,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'QB (year-over-year % change)',
            data: qbDelta,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.dataset.label + ': ' + ctx.raw + '%';
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Age' },
            grid: { color: 'rgba(0,0,0,0.06)' }
          },
          y: {
            title: { display: true, text: '% change from previous year' },
            min: -45,
            max: 8,
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: { callback: function (v) { return v + '%'; } }
          }
        }
      }
    });
  }

  draw(p) {}

  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    if (this.canvasEl && this.canvasEl.parentNode) {
      this.canvasEl.parentNode.removeChild(this.canvasEl);
      this.canvasEl = null;
    }
  }
}

window.VizYearOverYear = VizYearOverYear;
