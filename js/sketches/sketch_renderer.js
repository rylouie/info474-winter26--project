// sketch_renderer.js
(function () {
    window.Renderer = {
  
      setData: function (manager) {
        var self = this;
  
        manager.offsetX = (manager.margin && manager.margin.left) || 20;
        manager.offsetY = (manager.margin && manager.margin.top) || 0;
  
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

        // Initialize outliers and perf curve into their own dedicated containers
        // so they never touch #vis and never wipe the main p5 canvas
        function createCustomVizzesOnce() {
          var outlierEl = document.getElementById('outlier-vis');
          if (outlierEl && !self.vizNFLOutliers && typeof VizNFLOutliers !== 'undefined') {
            try {
              self.vizNFLOutliers = new VizNFLOutliers();
              self.vizNFLOutliers.setup(outlierEl);
            } catch (err) { console.error('VizNFLOutliers init failed:', err); }
          }
          var perfEl = document.getElementById('perf-vis');
          if (perfEl && !self.vizPerformanceCurve && typeof VizNFLPerformanceCurve !== 'undefined') {
            try {
              self.vizPerformanceCurve = new VizNFLPerformanceCurve();
              self.vizPerformanceCurve.setup(perfEl);
            } catch (err) { console.error('VizNFLPerformanceCurve init failed:', err); }
          }
        }
  
        function createCharts() {
          createPeakAgeChartOnce();
          createYearOverYearChartOnce();
          createCustomVizzesOnce();
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
        var peakWrap   = document.getElementById('peak-age-chart');
        var yoyWrap    = document.getElementById('year-over-year-chart');
        var visEl      = document.getElementById('vis');
        var outlierEl  = document.getElementById('outlier-vis');
        var perfEl     = document.getElementById('perf-vis');

        // Hide everything, then selectively show what this section needs
        function hideAll() {
          if (peakWrap)  peakWrap.classList.add('hidden');
          if (yoyWrap)   yoyWrap.classList.add('hidden');
          if (outlierEl) outlierEl.style.display = 'none';
          if (perfEl)    perfEl.style.display = 'none';
          if (visEl)     visEl.style.display = '';
        }

        // Section 0: Aging Curve
        if (ai === 0) {
          hideAll();
          if (window.AgingCurveViz && window.AgingCurveViz.draw)
            window.AgingCurveViz.draw(p, manager, ai, progress);
          return;
        }

        // Section 1: Career Length Distribution
        if (ai === 1) {
          hideAll();
          if (window.CareerLengthViz && window.CareerLengthViz.draw)
            window.CareerLengthViz.draw(p, manager, ai, progress);
          return;
        }

        // Section 2: Peak-age chart
        if (ai === 2) {
          hideAll();
          if (peakWrap) peakWrap.classList.remove('hidden');
          p.background(249, 246, 241);
          return;
        }

        // Section 3: Year-over-year
        if (ai === 3) {
          hideAll();
          if (yoyWrap) yoyWrap.classList.remove('hidden');
          p.background(249, 246, 241);
          return;
        }

        // Sections 4, 5, 6: narrative only
        if (ai === 4 || ai === 5 || ai === 6) {
          hideAll();
          p.background(249, 246, 241);
          return;
        }

        // Section 7: NFL Outliers
        if (ai === 7) {
          hideAll();
          if (visEl) visEl.style.display = 'none'; // hide p5 canvas, show outlier container
          if (outlierEl) outlierEl.style.display = '';
          if (this.vizNFLOutliers) this.vizNFLOutliers.setScrollProgress(progress);
          return;
        }

        // Section 8: Performance Curve
        if (ai === 8) {
          hideAll();
          if (visEl) visEl.style.display = 'none'; // hide p5 canvas, show perf container
          if (perfEl) perfEl.style.display = '';
          if (this.vizPerformanceCurve) this.vizPerformanceCurve.setScrollProgress(progress);
          return;
        }

        // Section 9: Bar
        if (ai === 9) {
          hideAll();
          if (window.VizBar && window.VizBar.draw)
            window.VizBar.draw(p, manager, ai, progress);
          return;
        }

        // Fallback
        hideAll();
        p.background(249, 246, 241);
      }
    };
  })();