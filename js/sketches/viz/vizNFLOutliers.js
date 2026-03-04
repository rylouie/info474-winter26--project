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
  
      const sketch = function(p) {
        const chartWidth = 250;
        const chartHeight = 250;
        const margin = 60;
        const positions = ["Running Back", "Wide Receiver", "Quarterback"];
        const data = [
          {category: "Average_Running_Back", position: "Running Back", age: 27, player: "Average"},
          {category: "Average_Wide_Receiver", position: "Wide Receiver", age: 29, player: "Average"},
          {category: "Average_Quarterback", position: "Quarterback", age: 35, player: "Average"},
          {category: "Tom_Brady", position: "Quarterback", age: 45, player: "Tom Brady"},
          {category: "Jerry_Rice", position: "Wide Receiver", age: 42, player: "Jerry Rice"},
          {category: "Frank_Gore", position: "Running Back", age: 39, player: "Frank Gore"}
        ];
  
        p.setup = function() {
          p.createCanvas(positions.length * chartWidth + 80, chartHeight + 100)
           .parent(renderer.canvasContainer);
          p.textFont("Helvetica");
          p.noLoop();
        };
  
        p.draw = function() {
          p.background(255);
          p.textAlign(p.CENTER, p.CENTER);
          p.fill(0);
          p.textSize(18);
          p.text("Outliers and the Distortion of Expectation", p.width / 2, 30);
          p.textSize(12);
          p.text("Average vs Outlier Retirement Ages by Position", p.width / 2, 55);
  
          positions.forEach((position, i) => {
            drawChart(
              p,
              data.filter(d => d.position === position),
              position,
              i * chartWidth + 60,
              100,
              chartWidth,
              chartHeight,
              margin,
              renderer.scrollProgress
            );
          });
        };
  
        function drawChart(p, posData, position, offsetX, offsetY, chartWidth, chartHeight, margin, scrollProgress) {
          p.push();
          p.translate(offsetX, offsetY);
  
          p.stroke(220);
          p.noFill();
          p.rect(0, 0, chartWidth - margin, chartHeight - margin);
  
          p.noStroke();
          p.fill(0);
          p.textSize(12);
          p.text(position, (chartWidth - margin) / 2, -15);
  
          const avg = posData.find(d => d.player === "Average");
          const outliers = posData.filter(d => d.player !== "Average");
          const minAge = Math.min(...posData.map(d => d.age)) - 2;
          const maxAge = Math.max(...posData.map(d => d.age)) + 2;
          const yScale = age => p.map(age, minAge, maxAge, chartHeight - margin, 0);
  
          p.stroke(70, 130, 180);
          p.strokeWeight(2);
          p.drawingContext.setLineDash([6, 6]);
          p.line(0, yScale(avg.age), chartWidth - margin, yScale(avg.age));
          p.drawingContext.setLineDash([]);
          p.noStroke();
          p.fill(70, 130, 180);
          p.textSize(10);
          p.text("Average", (chartWidth - margin) / 2, yScale(avg.age) - 12);
  
          outliers.forEach((d, idx) => {
            const total = outliers.length;
            const start = idx / total;
            const end = (idx + 1) / total;
  
            if (scrollProgress >= start) {
              const localProgress = p.constrain((scrollProgress - start) / (end - start), 0, 1);
              const yEnd = yScale(d.age);
              const yCurrent = p.lerp(yScale(avg.age), yEnd, localProgress);
  
              p.stroke(200, 40, 40);
              p.strokeWeight(2);
              p.line((chartWidth - margin) / 2, yScale(avg.age), (chartWidth - margin) / 2, yCurrent);
  
              if (localProgress === 1) {
                p.noStroke();
                p.fill(200, 40, 40);
                p.textSize(10);
                p.text(d.player, (chartWidth - margin) / 2 + 40, yEnd);
              }
            }
          });
  
          p.stroke(0);
          p.line(0, 0, 0, chartHeight - margin);
          for (let a = Math.ceil(minAge); a <= Math.floor(maxAge); a += 2) {
            const y = yScale(a);
            p.line(-5, y, 0, y);
            p.noStroke();
            p.fill(0);
            p.textSize(10);
            p.text(a, -18, y);
            p.stroke(0);
          }
  
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
  
  window.VizNFLOutliers = VizNFLOutliers;