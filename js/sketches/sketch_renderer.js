// sketch_renderer.js

// Responsible for rendering the main visualization based on the current active index
(function () {
    window.Renderer = {

        setData: function (manager) {
            var self = this;

            manager.offsetX = (manager.margin && manager.margin.left) || 20;
            manager.offsetY = (manager.margin && manager.margin.top) || 0;

            // Load Basic_Stats.csv and compute mean age (+ std) by position for peak-age chart
            function aggregatePeakAgeByPosition(rows) {
                var byPos = {};
                var ageMin = 18, ageMax = 45;
                for (var i = 0; i < rows.length; i++) {
                    var row = rows[i];
                    var pos = (row.Position || '').trim();
                    var a = parseInt(row.Age, 10);
                    if (!pos || isNaN(a) || a < ageMin || a > ageMax) continue;
                    if (!byPos[pos]) byPos[pos] = [];
                    byPos[pos].push(a);
                }
                var order = ['RB', 'WR', 'TE', 'CB', 'LB', 'OT', 'QB'];
                var positions = [], peakAges = [], errors = [];
                for (var j = 0; j < order.length; j++) {
                    var p = order[j];
                    var ages = byPos[p];
                    if (!ages || ages.length < 5) continue;
                    var n = ages.length, sum = 0, sum2 = 0;
                    for (var k = 0; k < n; k++) { sum += ages[k]; sum2 += ages[k] * ages[k]; }
                    var mean = sum / n;
                    var var_ = (sum2 / n) - mean * mean;
                    var std = var_ > 0 ? Math.sqrt(var_) : 0;
                    positions.push(p);
                    peakAges.push(Math.round(mean * 100) / 100);
                    errors.push(Math.round(std * 100) / 100);
                }
                return { positions: positions, peakAges: peakAges, errors: errors };
            }

            function computeLayout(peakData) {
                manager.data = peakData || { positions: [], peakAges: [], errors: [] };
            }

            function createPeakAgeChartOnce() {
                var chartEl = document.getElementById('peak-age-chart');
                if (!chartEl || self.peakAgeViz || typeof window.VizPeakAge === 'undefined') return;
                try {
                    var viz = new window.VizPeakAge();
                    viz.setup(null, manager, chartEl);
                    self.peakAgeViz = viz;
                    chartEl.setAttribute('aria-hidden', 'false');
                } catch (err) {
                    console.error('Peak age chart init failed:', err);
                }
            }

            function createYearOverYearChartOnce() {
                var chartEl = document.getElementById('year-over-year-chart');
                if (!chartEl || self.yearOverYearViz || typeof window.VizYearOverYear === 'undefined') return;
                try {
                    var viz = new window.VizYearOverYear();
                    viz.setup(null, manager, chartEl);
                    self.yearOverYearViz = viz;
                    chartEl.setAttribute('aria-hidden', 'false');
                } catch (err) {
                    console.error('Year-over-year chart init failed:', err);
                }
            }

            function createCharts() {
                createPeakAgeChartOnce();
                createYearOverYearChartOnce();
            }

            if (typeof window.DataLoader !== 'undefined' && window.DataLoader.loadCSV) {
                return window.DataLoader.loadCSV('data/Basic_Stats.csv')
                    .then(function (rows) {
                        var peakData = aggregatePeakAgeByPosition(rows);
                        computeLayout(peakData);
                        createCharts();
                        return manager.data;
                    })
                    .catch(function (err) {
                        console.warn('Basic_Stats.csv not loaded, using fallback data:', err);
                        computeLayout(null);
                        createCharts();
                        return manager.data;
                    });
            }
            computeLayout(null);
            createCharts();
            return Promise.resolve(manager.data);
        },

        draw: function (p, manager, ai, progress) {
    var peakWrap = document.getElementById('peak-age-chart');
    var yoyWrap = document.getElementById('year-over-year-chart');
    var visEl = document.getElementById('vis');

    // Section 0: peak-age chart
    if (ai === 0) {
        if (peakWrap) peakWrap.classList.remove('hidden');
        if (yoyWrap) yoyWrap.classList.add('hidden');
        if (visEl) visEl.style.display = 'none';
        return;
    }

    // Section 1: year-over-year (RB vs QB) line chart
    if (ai === 1) {
        if (peakWrap) peakWrap.classList.add('hidden');
        if (yoyWrap) yoyWrap.classList.remove('hidden');
        if (visEl) visEl.style.display = 'none';
        return;
    }

    // Other sections: hide both chart containers; show #vis only if we have a viz to draw
    if (peakWrap) peakWrap.classList.add('hidden');
    if (yoyWrap) yoyWrap.classList.add('hidden');
    var hasOtherViz = (ai === 1 || ai === 2) && window.VizTitle && typeof window.VizTitle.draw === 'function'
        || (ai >= 4 && ai < 7) && window.VizScatter && typeof window.VizScatter.draw === 'function'
        || (ai === 7) && window.VizBar && typeof window.VizBar.draw === 'function';
    if (visEl) visEl.style.display = hasOtherViz ? '' : 'none';

    if ((ai === 1 || ai === 2) && window.VizTitle && typeof window.VizTitle.draw === 'function') {
        window.VizTitle.draw(p, manager, ai, progress);
        return;
    }
    if (ai >= 4 && ai < 7 && window.VizScatter && typeof window.VizScatter.draw === 'function') {
        window.VizScatter.draw(p, manager, ai, progress);
        return;
    }
    if (ai === 7 && window.VizBar && typeof window.VizBar.draw === 'function') {
        window.VizBar.draw(p, manager, ai, progress);
        return;
    }
        }
    };

    })();
