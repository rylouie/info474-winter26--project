// data_loader.js
// Simple data loading and TSV parsing module. Exposes DataLoader.loadTSV(url)
(function () {
    function parseTSV(text) {
      var lines = (text || '').trim().split(/\r?\n/);
      if (!lines || lines.length === 0) return [];
      var header = lines[0].split('\t');
      var rows = lines.slice(1);
      return rows.map(function (line) {
        var parts = line.split('\t');
        var word = (parts[0] || '').replace(/^"|"$/g, '');
        var time = parseFloat(parts[1]);
        var filler = parts[2] ? (parts[2].trim() === '1' || parts[2].trim() === 'true') : false;
        return { word: word, time: time, filler: filler, min: Math.floor(time / 60) };
      });
    }
  
    function loadTSV(url) {
      return fetch(url).then(function (r) { return r.text(); }).then(function (text) {
        return parseTSV(text);
      });
    }
  
    function parseCSV(text) {
      var lines = (text || '').trim().split(/\r?\n/);
      if (!lines || lines.length < 2) return [];
      var headers = parseCSVRow(lines[0]);
      return lines.slice(1).map(function (line) {
        var values = parseCSVRow(line);
        var row = {};
        headers.forEach(function (h, i) {
          row[h] = values[i] !== undefined ? values[i] : '';
        });
        return row;
      });
    }
  
    function parseCSVRow(line) {
      var out = [];
      var i = 0;
      while (i < line.length) {
        if (line[i] === '"') {
          var end = i + 1;
          while (end < line.length) {
            var next = line.indexOf('"', end);
            if (next === -1) { end = line.length; break; }
            if (line[next + 1] === '"') { end = next + 2; continue; }
            end = next;
            break;
          }
          out.push(line.slice(i + 1, end).replace(/""/g, '"').trim());
          i = end + 1;
          if (line[i] === ',') i++;
          continue;
        }
        var comma = line.indexOf(',', i);
        if (comma === -1) comma = line.length;
        out.push(line.slice(i, comma).trim());
        i = comma + 1;
      }
      return out;
    }
  
    function loadCSV(url) {
      return fetch(url).then(function (r) { return r.text(); }).then(function (text) {
        return parseCSV(text);
      });
    }
  
    window.DataLoader = {
      parseTSV: parseTSV,
      loadTSV: loadTSV,
      parseCSV: parseCSV,
      loadCSV: loadCSV
    };
  
    window.DataLoader.preprocess = function (data) {
      data = data || [];
      return data.map(function (d, i) {
        return {
          word: (d.word || '').replace(/^"|"$/g, ''),
          filler: !!d.filler,
          time: +d.time || 0,
          min: (typeof d.min === 'number') ? d.min : Math.floor((+d.time || 0) / 60),
          index: i
        };
      });
    };
  })();