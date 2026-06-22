/**
 * Zero-dependency SVG Chart Renderer
 * Generates beautiful, responsive line and bar charts using native SVGs.
 */

export function renderLineChart(containerId, data, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = options.width || container.clientWidth || 500;
  const height = options.height || 220;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  if (data.length === 0) {
    container.innerHTML = `<div class="chart-empty">No data available</div>`;
    return;
  }

  // Find Min / Max values
  const yValues = data.map(d => d.value);
  const maxY = Math.max(...yValues, 100) * 1.1; // Add 10% buffer
  const minY = 0;

  // X Scaling
  const stepX = chartWidth / (data.length - 1);

  // Path coordinates
  const points = data.map((d, index) => {
    const x = paddingLeft + index * stepX;
    // Map Y value where maxY is at the top (paddingTop) and minY is at the bottom (height - paddingBottom)
    const y = height - paddingBottom - ((d.value - minY) / (maxY - minY)) * chartHeight;
    return { x, y, label: d.label, val: d.value };
  });

  // Create SVG path string
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    // We can use cubic bezier curves for smooth layout
    const cpX1 = points[i - 1].x + stepX / 2;
    const cpY1 = points[i - 1].y;
    const cpX2 = points[i].x - stepX / 2;
    const cpY2 = points[i].y;
    pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
  }

  // Create gradient path string (closes the shape at the bottom)
  let areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  // Draw grid lines
  let gridLines = '';
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const val = minY + (i * (maxY - minY)) / yTicks;
    const y = height - paddingBottom - (i / yTicks) * chartHeight;
    gridLines += `
      <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="var(--border-color, #E2E8F0)" stroke-dasharray="3 3" />
      <text x="${paddingLeft - 10}" y="${y + 4}" fill="var(--text-muted, #64748B)" font-size="10" font-family="sans-serif" text-anchor="end">${formatNumber(val)}</text>
    `;
  }

  // Draw X labels
  let xLabels = '';
  points.forEach(p => {
    xLabels += `
      <text x="${p.x}" y="${height - 20}" fill="var(--text-muted, #64748B)" font-size="10" font-family="sans-serif" text-anchor="middle">${p.label}</text>
      <circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--primary-color, #1D4ED8)" stroke="#FFFFFF" stroke-width="1.5" />
    `;
  });

  // Construct SVG markup
  const svgHtml = `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMinYMin meet" class="chart-svg">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--primary-color, #1D4ED8)" stop-opacity="0.25" />
          <stop offset="100%" stop-color="var(--primary-color, #1D4ED8)" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      
      <!-- Grid -->
      ${gridLines}
      
      <!-- Fill Area -->
      <path d="${areaD}" fill="url(#chartGradient)" />
      
      <!-- Chart Line -->
      <path d="${pathD}" fill="none" stroke="var(--primary-color, #1D4ED8)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      
      <!-- Labels and dots -->
      ${xLabels}
    </svg>
  `;

  container.innerHTML = svgHtml;
}

export function renderBarChart(containerId, data, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = options.width || container.clientWidth || 500;
  const height = options.height || 220;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  if (data.length === 0) {
    container.innerHTML = `<div class="chart-empty">No data available</div>`;
    return;
  }

  // Find Max value
  const yValues = data.map(d => d.value);
  const maxY = Math.max(...yValues, 1000) * 1.1;
  const minY = 0;

  const barCount = data.length;
  const spaceRatio = 0.4; // space ratio between bars
  const totalBarSpace = chartWidth / barCount;
  const barWidth = totalBarSpace * (1 - spaceRatio);
  const barSpacing = totalBarSpace * spaceRatio;

  // Draw grid lines
  let gridLines = '';
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const val = minY + (i * (maxY - minY)) / yTicks;
    const y = height - paddingBottom - (i / yTicks) * chartHeight;
    gridLines += `
      <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="var(--border-color, #E2E8F0)" stroke-dasharray="3 3" />
      <text x="${paddingLeft - 10}" y="${y + 4}" fill="var(--text-muted, #64748B)" font-size="10" font-family="sans-serif" text-anchor="end">${formatCurrency(val)}</text>
    `;
  }

  // Draw Bars & Labels
  let bars = '';
  let labels = '';
  data.forEach((d, index) => {
    const x = paddingLeft + index * totalBarSpace + barSpacing / 2;
    const barHeight = ((d.value - minY) / (maxY - minY)) * chartHeight;
    const y = height - paddingBottom - barHeight;

    bars += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="var(--secondary-color, #10B981)" class="chart-bar-rect">
        <title>${d.label}: ${formatCurrency(d.value)}</title>
      </rect>
    `;

    labels += `
      <text x="${x + barWidth / 2}" y="${height - 20}" fill="var(--text-muted, #64748B)" font-size="10" font-family="sans-serif" text-anchor="middle">${d.label}</text>
    `;
  });

  const svgHtml = `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMinYMin meet" class="chart-svg">
      <!-- Grid -->
      ${gridLines}
      
      <!-- Bars -->
      ${bars}
      
      <!-- Labels -->
      ${labels}
    </svg>
  `;

  container.innerHTML = svgHtml;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return Math.round(num).toString();
}

function formatCurrency(num) {
  if (num >= 1000) return '£' + (num / 1000).toFixed(1) + 'k';
  return '£' + Math.round(num).toString();
}
