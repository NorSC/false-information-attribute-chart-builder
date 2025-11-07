import React, { useState } from 'react';

const PentagonChart = () => {
  const [chartData, setChartData] = useState({
    centerLabel: 'Inaccurate',
    conditions: [
      { name: 'Misinformation', mean: 4.14 },
      { name: 'Disinformation', mean: 4.16 },
      { name: 'Propaganda', mean: 3.70 },
      { name: 'Conspiracy Theories', mean: 3.86 },
      { name: 'Fake News', mean: 4.37 }
    ],
    comparisons: [
      { from: 0, to: 1, zScore: -3.344, significant: true },
      { from: 0, to: 2, zScore: 4.176, significant: true },
      { from: 0, to: 3, zScore: -7.626, significant: true },
      { from: 0, to: 4, zScore: -4.176, significant: true },
      { from: 1, to: 2, zScore: 6.665, significant: true },
      { from: 1, to: 3, zScore: -6.824, significant: true },
      { from: 1, to: 4, zScore: -2.709, significant: true },
      { from: 2, to: 3, zScore: -8.830, significant: true },
      { from: 2, to: 4, zScore: -7.305, significant: true },
      { from: 3, to: 4, zScore: 0, significant: false }
    ]
  });

  const [editMode, setEditMode] = useState(false);

  // Calculate pentagon vertices
  const centerX = 300;
  const centerY = 250;
  const radius = 150;

  const getVertexPosition = (index) => {
    const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2 + Math.PI; // Start from top, flipped 180 degrees
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  // Scale circle radius based on mean (normalize to reasonable size)
  const getCircleRadius = (mean) => {
    const minMean = Math.min(...chartData.conditions.map(c => c.mean));
    const maxMean = Math.max(...chartData.conditions.map(c => c.mean));
    const normalized = (mean - minMean) / (maxMean - minMean);
    return 12 + normalized * 15; // Between 12 and 27 pixels (smaller max size)
  };

  const updateCondition = (index, field, value) => {
    const newConditions = [...chartData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: field === 'mean' ? parseFloat(value) || 0 : value };
    setChartData({ ...chartData, conditions: newConditions });
  };

  const updateComparison = (index, field, value) => {
    const newComparisons = [...chartData.comparisons];
    if (field === 'zScore') {
      newComparisons[index] = { ...newComparisons[index], [field]: parseFloat(value) || 0 };
    } else {
      newComparisons[index] = { ...newComparisons[index], [field]: value };
    }
    setChartData({ ...chartData, comparisons: newComparisons });
  };

  const exportAsSVG = () => {
    const svgElement = document.getElementById('pentagon-chart');
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chartData.centerLabel.toLowerCase().replace(/\s+/g, '-')}-chart.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsPNG = async () => {
    try {
      const svgElement = document.getElementById('pentagon-chart');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set higher resolution for better quality
      const scale = 2;
      canvas.width = 600 * scale;
      canvas.height = 500 * scale;
      ctx.scale(scale, scale);
      
      // Get SVG data and add necessary styling
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgWithStyles = `
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="500">
          <style>
            .text-xs { font-size: 12px; font-family: system-ui, -apple-system, sans-serif; }
            .text-sm { font-size: 14px; font-family: system-ui, -apple-system, sans-serif; }
            .text-lg { font-size: 18px; font-family: system-ui, -apple-system, sans-serif; }
            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            .fill-gray-800 { fill: #1f2937; }
            .fill-gray-600 { fill: #4b5563; }
            .fill-green-600 { fill: #059669; }
          </style>
          ${svgData.substring(svgData.indexOf('>') + 1)}
        </svg>
      `;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const loadImage = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgWithStyles)));
      });
      
      await loadImage;
      
      // Fill white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 600, 500);
      
      // Draw the SVG image
      ctx.drawImage(img, 0, 0, 600, 500);
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${chartData.centerLabel.toLowerCase().replace(/\s+/g, '-')}-chart.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          alert('PNG export failed. Please try SVG export instead.');
        }
      }, 'image/png', 0.95);
      
    } catch (error) {
      console.error('PNG export failed:', error);
      alert('PNG export failed. Please try SVG export instead, or use your browser\'s right-click > Save Image option on the chart.');
    }
  };

  const generateFigureCaption = () => {
    const significantCount = chartData.comparisons.filter(comp => comp.significant).length;
    const totalComparisons = chartData.comparisons.length;
    
    return `Significant pairwise comparisons for ${chartData.centerLabel.toLowerCase()}: ${chartData.centerLabel.toLowerCase()}. Pentagon chart showing mean values for ${chartData.conditions.map(c => c.name).join(', ')}. Solid lines indicate significant pairwise differences (${significantCount}/${totalComparisons} comparisons), while dotted lines represent non-significant differences. Circle sizes are proportional to mean values. Z-scores are displayed for significant comparisons.`;
  };

  const generateAltText = () => {
    const conditionsList = chartData.conditions.map((c, i) => `${c.name} (mean = ${c.mean.toFixed(2)})`).join(', ');
    
    const significantComps = chartData.comparisons
      .filter(comp => comp.significant)
      .map(comp => `${chartData.conditions[comp.from].name} vs ${chartData.conditions[comp.to].name} (z = ${comp.zScore.toFixed(3)})`)
      .join('; ');
    
    const nonSignificantComps = chartData.comparisons
      .filter(comp => !comp.significant)
      .map(comp => `${chartData.conditions[comp.from].name} vs ${chartData.conditions[comp.to].name}`)
      .join('; ');

    return `Pentagon-shaped statistical comparison chart for ${chartData.centerLabel.toLowerCase()}. The chart displays five conditions positioned at pentagon vertices: ${conditionsList}. Each condition is represented by a white circle with size proportional to its mean value. The center of the pentagon is labeled "${chartData.centerLabel}". Solid black lines connect conditions with statistically significant differences, labeled with z-scores: ${significantComps || 'none'}. Dotted gray lines connect conditions with non-significant differences: ${nonSignificantComps || 'none'}. This visualization allows for quick identification of which condition pairs differ significantly in ${chartData.centerLabel.toLowerCase()} ratings.`;
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show temporary success message
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.style.backgroundColor = '#059669';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => button.textContent = originalText, 2000);
      } catch (fallbackErr) {
        alert('Could not copy to clipboard. Please select and copy the text manually.');
      }
      document.body.removeChild(textArea);
    }
  };

  const generateChart = () => {
    return (
      <svg id="pentagon-chart" width="600" height="500" className="border border-gray-300 bg-white">
        {/* Background pentagon lines (faint) */}
        <polygon
          points={chartData.conditions.map((_, i) => {
            const pos = getVertexPosition(i);
            return `${pos.x},${pos.y}`;
          }).join(' ')}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="2,2"
        />

        {/* Comparison lines */}
        {chartData.comparisons.map((comp, index) => {
          const fromPos = getVertexPosition(comp.from);
          const toPos = getVertexPosition(comp.to);
          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2;
          let lineAngle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x) * 180 / Math.PI;
          
          // Flip text if it would be upside down (between 90° and 270°)
          if (lineAngle > 90 || lineAngle < -90) {
            lineAngle += 180;
          }
          
          return (
            <g key={index}>
              <line
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke={comp.significant ? "#374151" : "#9ca3af"}
                strokeWidth={comp.significant ? "2" : "1"}
                strokeDasharray={comp.significant ? "none" : "4,4"}
                opacity={comp.significant ? 1 : 0.6}
              />
              {comp.significant && comp.zScore !== 0 && (
                <g>
                  {/* Background rectangle for better readability - increased padding */}
                  <rect
                    x={midX - 26}
                    y={midY - 10}
                    width="52"
                    height="20"
                    fill="white"
                    fillOpacity="0.95"
                    rx="3"
                    transform={`rotate(${lineAngle} ${midX} ${midY})`}
                  />
                  <text
                    x={midX}
                    y={midY + 3}
                    textAnchor="middle"
                    className="text-xs fill-green-600 font-medium"
                    style={{ fontSize: '10px' }}
                    transform={`rotate(${lineAngle} ${midX} ${midY})`}
                  >
                    z={comp.zScore > 0 ? comp.zScore.toFixed(3) : comp.zScore.toFixed(3)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Center label */}
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          className="text-lg font-semibold fill-gray-800"
        >
          {chartData.centerLabel}
        </text>

        {/* Condition nodes */}
        {chartData.conditions.map((condition, index) => {
          const pos = getVertexPosition(index);
          const circleRadius = getCircleRadius(condition.mean);
          
          // After 180 flip: indices 0, 1, 4 are at bottom, so text goes below
          const isBottomVertex = index === 0 || index === 1 || index === 4;
          const textYOffset = isBottomVertex ? circleRadius + 18 : -(circleRadius + 30);
          const meanYOffset = isBottomVertex ? circleRadius + 32 : -(circleRadius + 18);
          const rectY = isBottomVertex ? pos.y + circleRadius + 6 : pos.y - circleRadius - 42;
          
          return (
            <g key={index}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={circleRadius}
                fill="white"
                stroke="#374151"
                strokeWidth="2"
              />
              
              {/* Background for condition name */}
              <rect
                x={pos.x - 45}
                y={rectY}
                width="90"
                height="30"
                fill="white"
                fillOpacity="0.9"
                rx="3"
              />
              
              {/* Condition name */}
              <text
                x={pos.x}
                y={pos.y + textYOffset}
                textAnchor="middle"
                className="text-sm font-medium fill-gray-800"
              >
                {condition.name}
              </text>
              
              {/* Mean value */}
              <text
                x={pos.x}
                y={pos.y + meanYOffset}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                x̄={condition.mean.toFixed(2)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Pentagon Comparison Chart Generator</h1>
        <p className="text-gray-600">Create pentagon-shaped charts for comparing 5 conditions with pairwise significance testing.</p>
      </div>

      <div className="flex gap-6">
        {/* Chart Display */}
        <div className="flex-1">
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editMode ? 'View Chart' : 'Edit Data'}
            </button>
            
            {!editMode && (
              <>
                <button
                  onClick={exportAsSVG}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Export SVG
                </button>
                <button
                  onClick={exportAsPNG}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Export PNG
                </button>
              </>
            )}
          </div>
          
          {!editMode && generateChart()}
          
          {/* Figure Caption and Alt Text */}
          {!editMode && (
            <div className="mt-8 space-y-6">
              {/* Figure Caption */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Figure Caption</h3>
                  <button
                    onClick={(e) => copyToClipboard(generateFigureCaption(), 'caption')}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Copy Caption
                  </button>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {generateFigureCaption()}
                </p>
              </div>

              {/* Alternative Text */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Alternative Text (Accessibility)</h3>
                  <button
                    onClick={(e) => copyToClipboard(generateAltText(), 'alt')}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Copy Alt Text
                  </button>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {generateAltText()}
                </p>
                <div className="mt-3 text-xs text-gray-600">
                  <strong>Usage:</strong> Use this detailed description as alt text for screen readers and accessibility compliance.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Input Panel */}
        {editMode && (
          <div className="w-96 bg-gray-50 p-4 rounded-lg max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Chart Data</h3>
            
            {/* Center Label */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Center Label
              </label>
              <input
                type="text"
                value={chartData.centerLabel}
                onChange={(e) => setChartData({ ...chartData, centerLabel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Conditions */}
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3">Conditions</h4>
              {chartData.conditions.map((condition, index) => (
                <div key={index} className="mb-3 p-3 border border-gray-200 rounded">
                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Condition {index + 1} Name
                    </label>
                    <input
                      type="text"
                      value={condition.name}
                      onChange={(e) => updateCondition(index, 'name', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Mean Value
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={condition.mean}
                      onChange={(e) => updateCondition(index, 'mean', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Comparisons */}
            <div>
              <h4 className="text-md font-medium mb-3">Pairwise Comparisons</h4>
              <div className="text-xs text-gray-600 mb-3">
                Configure the statistical comparisons between conditions
              </div>
              {chartData.comparisons.map((comp, index) => (
                <div key={index} className="mb-3 p-3 border border-gray-200 rounded">
                  <div className="mb-2 text-sm font-medium text-gray-700">
                    {chartData.conditions[comp.from]?.name} ↔ {chartData.conditions[comp.to]?.name}
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Z-Score
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={comp.zScore}
                      onChange={(e) => updateComparison(index, 'zScore', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-xs font-medium text-gray-600">
                      <input
                        type="checkbox"
                        checked={comp.significant}
                        onChange={(e) => updateComparison(index, 'significant', e.target.checked)}
                        className="mr-2"
                      />
                      Significant difference
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">How to Use</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Click "Edit Data" to modify the chart parameters</li>
          <li>• Enter your 5 conditions and their mean values</li>
          <li>• Configure pairwise comparisons with z-scores and significance</li>
          <li>• Significant differences appear as solid lines with z-score labels</li>
          <li>• Non-significant differences appear as dotted lines</li>
          <li>• Circle sizes are scaled based on mean values</li>
          <li>• Use "Export SVG" for vector graphics or "Export PNG" for raster images</li>
          <li>• Copy the auto-generated figure caption for your academic paper</li>
          <li>• Copy the detailed alt text for accessibility compliance</li>
        </ul>
      </div>
    </div>
  );
};

export default PentagonChart;