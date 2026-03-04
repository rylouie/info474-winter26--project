// sketch_renderer.js
(function () {
    window.Renderer = {
      setData: function (manager) {
        manager.offsetX = (manager.margin && manager.margin.left) || 20;
        manager.offsetY = (manager.margin && manager.margin.top) || 0;
        function computeLayout(data) {
          manager.data = data;
        }
        computeLayout([]);
        return Promise.resolve(manager.data);
      },
  
      draw: function (p, manager, ai, progress) {
        try { console.log('Renderer: delegating draw, ai=', ai); } catch (e) {}
  
        // --- Section 0: placeholder ---
        if (ai === 0) {
          return;
        }
  
        // --- Sections 1 & 2: Title text ---
        if (ai === 1 || ai === 2) {
          if (window.VizTitle && window.VizTitle.draw) {
            window.VizTitle.draw(p, manager, ai, progress);
          }
          return;
        }
  
        // --- Section 4: Scatter ---
        if (ai === 4) {
          if (window.VizScatter && window.VizScatter.draw) {
            window.VizScatter.draw(p, manager, ai, progress);
          }
          return;
        }
  
        // --- Section 5: NFL Outliers ---
        if (ai === 5) {
          if (!this.vizNFLOutliers) {
            this.vizNFLOutliers = new VizNFLOutliers();
            this.vizNFLOutliers.setup(document.getElementById('vis'));
          }
          this.vizNFLOutliers.setScrollProgress(progress);
          return;
        } else {
          if (this.vizNFLOutliers) {
            this.vizNFLOutliers.destroy();
            this.vizNFLOutliers = null;
          }
        }
  
        // --- Section 6: Performance Curve ---
        if (ai === 6) {
          if (!this.vizPerformanceCurve) {
            this.vizPerformanceCurve = new VizNFLPerformanceCurve();
            this.vizPerformanceCurve.setup(document.getElementById('vis'));
          }
          this.vizPerformanceCurve.setScrollProgress(progress);
          return;
        } else {
          if (this.vizPerformanceCurve) {
            this.vizPerformanceCurve.destroy();
            this.vizPerformanceCurve = null;
          }
        }
  
        // --- Section 7: Bar ---
        if (ai === 7) {
          if (window.VizBar && window.VizBar.draw) {
            window.VizBar.draw(p, manager, ai, progress);
          }
          return;
        }
      }
    };
  })();