function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLinearBg(ctx, W, H, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([pos, color]) => g.addColorStop(pos, color));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawRadialBg(ctx, W, H, cx, cy, r, stops) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  stops.forEach(([pos, color]) => g.addColorStop(pos, color));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawPetalFlower(ctx, cx, cy, r, petalColor, centerColor, petals = 6, rotation = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  for (let i = 0; i < petals; i++) {
    ctx.save();
    ctx.rotate((Math.PI * 2 * i) / petals);
    ctx.fillStyle = petalColor;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.62, r * 0.42, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = centerColor;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLeaf(ctx, cx, cy, size, color, angle = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.4, size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSparkle(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(size * 0.18, -size * 0.18, size, 0);
  ctx.quadraticCurveTo(size * 0.18, size * 0.18, 0, size);
  ctx.quadraticCurveTo(-size * 0.18, size * 0.18, -size, 0);
  ctx.quadraticCurveTo(-size * 0.18, -size * 0.18, 0, -size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSunburst(ctx, cx, cy, r, color, rays = 20) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < rays; i++) {
    ctx.save();
    ctx.rotate((Math.PI * 2 * i) / rays);
    ctx.beginPath();
    ctx.moveTo(-r * 0.05, 0);
    ctx.lineTo(r * 0.05, 0);
    ctx.lineTo(0, -r * 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMountains(ctx, W, H, baseY, color, jag = 6) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, baseY);
  const step = W / jag;
  for (let i = 0; i <= jag; i++) {
    const x = i * step;
    const y = baseY - Math.sin(i * 1.7) * H * 0.05 - (i % 2 === 0 ? H * 0.04 : 0);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
}

function drawCloud(ctx, cx, cy, scale, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  [[-40, 0, 34], [0, -16, 42], [42, 0, 32], [80, 4, 26], [-6, 14, 30]].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawLotus(ctx, cx, cy, r, color, centerColor) {
  drawPetalFlower(ctx, cx, cy, r, color, centerColor, 8, Math.PI / 8);
  ctx.save();
  ctx.globalAlpha = 0.85;
  drawPetalFlower(ctx, cx, cy, r * 0.72, '#fff', centerColor, 6, 0);
  ctx.restore();
}

function seededScatter(count, seed, fn) {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < count; i++) fn(rand, i);
}

const TEMPLATES = [
  {
    id: 'rose',
    name: '玫瑰花園',
    draw(ctx, W, H) {
      drawLinearBg(ctx, W, H, 0, 0, W, H, [
        [0, '#ffd9e6'], [0.5, '#ff9ab0'], [1, '#ff6f91'],
      ]);
      drawRadialBg(ctx, W, H, W * 0.5, H * 0.25, W * 0.6, [
        [0, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)'],
      ]);
      seededScatter(10, 3, (rand, i) => {
        drawSparkle(ctx, rand() * W, rand() * H * 0.6, 6 + rand() * 8, 'rgba(255,255,255,0.85)');
      });
      const roses = [
        [W * 0.12, H * 0.88, 90], [W * 0.32, H * 0.95, 60],
        [W * 0.88, H * 0.86, 100], [W * 0.68, H * 0.97, 55],
        [W * 0.06, H * 0.62, 45],
      ];
      roses.forEach(([x, y, r]) => {
        drawLeaf(ctx, x - r * 0.7, y + r * 0.3, r * 0.9, '#3f8f5c', -0.6);
        drawLeaf(ctx, x + r * 0.7, y + r * 0.2, r * 0.9, '#4aa568', 0.6);
        drawPetalFlower(ctx, x, y, r, '#e8436b', '#ffd166', 7);
      });
    },
  },
  {
    id: 'lotus',
    name: '荷花池',
    draw(ctx, W, H) {
      drawLinearBg(ctx, W, H, 0, 0, 0, H, [
        [0, '#bfeee0'], [0.5, '#7fd0c8'], [1, '#3f9e9c'],
      ]);
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#eafff8';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(W * 0.5, H * (0.72 + i * 0.05), W * (0.55 - i * 0.05), 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      [[W * 0.18, H * 0.8, 60], [W * 0.82, H * 0.7, 50], [W * 0.5, H * 0.9, 75]].forEach(([x, y, r]) => {
        ctx.fillStyle = '#2f8f6f';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.15, r * 1.15, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      drawLotus(ctx, W * 0.22, H * 0.68, 70, '#ffb7d5', '#ffe27a');
      drawLotus(ctx, W * 0.78, H * 0.58, 55, '#ffd3e6', '#ffe27a');
      drawLotus(ctx, W * 0.5, H * 0.8, 90, '#ff9cc4', '#ffe27a');
    },
  },
  {
    id: 'sunrise',
    name: '日出朝陽',
    draw(ctx, W, H) {
      drawLinearBg(ctx, W, H, 0, 0, 0, H, [
        [0, '#ffe8b0'], [0.45, '#ffb572'], [1, '#ff7c5c'],
      ]);
      drawSunburst(ctx, W * 0.5, H * 0.42, W * 0.16, '#fff3c4');
      ctx.fillStyle = '#ffdd7a';
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.42, W * 0.14, 0, Math.PI * 2);
      ctx.fill();
      seededScatter(4, 7, (rand) => {
        const x = rand() * W;
        const y = H * 0.18 + rand() * H * 0.12;
        ctx.strokeStyle = 'rgba(90,60,50,0.5)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 14, y - 12, x + 28, y);
        ctx.moveTo(x + 22, y);
        ctx.quadraticCurveTo(x + 36, y - 12, x + 50, y);
        ctx.stroke();
      });
      drawMountains(ctx, W, H, H * 0.72, '#7a5a6e', 5);
      drawMountains(ctx, W, H, H * 0.82, '#4c3a52', 6);
    },
  },
  {
    id: 'waterfall',
    name: '瀑布山林',
    draw(ctx, W, H) {
      drawLinearBg(ctx, W, H, 0, 0, 0, H, [
        [0, '#d9f2ff'], [0.4, '#a9ddc9'], [1, '#3f7f5c'],
      ]);
      drawMountains(ctx, W, H, H * 0.3, 'rgba(60,110,90,0.55)', 5);
      ctx.save();
      const g = ctx.createLinearGradient(0, H * 0.15, 0, H);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(1, 'rgba(255,255,255,0.6)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(W * 0.42, H * 0.15);
      ctx.lineTo(W * 0.58, H * 0.15);
      ctx.lineTo(W * 0.66, H * 0.95);
      ctx.lineTo(W * 0.34, H * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.95, W * 0.28, H * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      [[W * 0.12, H * 0.85], [W * 0.85, H * 0.9]].forEach(([x, y]) => {
        ctx.fillStyle = '#2f5c3f';
        ctx.beginPath();
        ctx.ellipse(x, y, 60, 26, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    },
  },
  {
    id: 'sparkle',
    name: '閃亮金邊',
    draw(ctx, W, H) {
      drawLinearBg(ctx, W, H, 0, 0, W, H, [
        [0, '#3a1f6b'], [0.5, '#7a3ba0'], [1, '#c95bb0'],
      ]);
      drawRadialBg(ctx, W, H, W * 0.5, H * 0.4, W * 0.7, [
        [0, 'rgba(255,220,150,0.35)'], [1, 'rgba(255,220,150,0)'],
      ]);
      seededScatter(38, 11, (rand, i) => {
        const x = rand() * W;
        const y = rand() * H;
        const size = 5 + rand() * 16;
        const color = i % 3 === 0 ? '#ffe27a' : i % 3 === 1 ? '#ffffff' : '#ff9ad6';
        drawSparkle(ctx, x, y, size, color);
      });
      ctx.strokeStyle = '#ffe27a';
      ctx.lineWidth = 14;
      roundRect(ctx, 24, 24, W - 48, H - 48, 24);
      ctx.stroke();
    },
  },
  {
    id: 'rainbow',
    name: '彩虹光暈',
    draw(ctx, W, H) {
      drawLinearBg(ctx, W, H, 0, 0, W, H, [
        [0, '#fff6d8'], [0.2, '#ffe0e8'], [0.45, '#d9e8ff'], [0.7, '#d6ffe6'], [1, '#fff0c9'],
      ]);
      drawSunburst(ctx, W * 0.5, H * 0.08, W * 0.1, 'rgba(255,255,255,0.6)', 24);
      drawCloud(ctx, W * 0.2, H * 0.25, 1.3, 'rgba(255,255,255,0.9)');
      drawCloud(ctx, W * 0.78, H * 0.35, 1.1, 'rgba(255,255,255,0.85)');
      drawCloud(ctx, W * 0.5, H * 0.85, 1.5, 'rgba(255,255,255,0.9)');
      drawCloud(ctx, W * 0.1, H * 0.78, 1.0, 'rgba(255,255,255,0.85)');
      drawCloud(ctx, W * 0.9, H * 0.82, 1.0, 'rgba(255,255,255,0.85)');
    },
  },
  {
    id: 'festival',
    name: '節慶祝福',
    draw(ctx, W, H) {
      drawRadialBg(ctx, W, H, W * 0.5, H * 0.4, W * 0.75, [
        [0, '#ff5f4a'], [1, '#b3182a'],
      ]);
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 16;
      roundRect(ctx, 28, 28, W - 56, H - 56, 20);
      ctx.stroke();
      const corner = (x, y, flip) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(flip[0], flip[1]);
        drawPetalFlower(ctx, 0, 0, 46, '#ffd166', '#ff9a3c', 6);
        drawLeaf(ctx, 50, 30, 34, '#ffd166', 0.6);
        ctx.restore();
      };
      corner(70, 70, [1, 1]);
      corner(W - 70, 70, [-1, 1]);
      corner(70, H - 70, [1, -1]);
      corner(W - 70, H - 70, [-1, -1]);
      seededScatter(14, 21, (rand) => {
        drawSparkle(ctx, rand() * W, rand() * H * 0.5, 5 + rand() * 8, 'rgba(255,209,102,0.8)');
      });
    },
  },
  {
    id: 'garden',
    name: '田園小徑',
    draw(ctx, W, H) {
      drawLinearBg(ctx, W, H, 0, 0, 0, H, [
        [0, '#eaffd8'], [0.55, '#d3f5c4'], [1, '#9fdb8c'],
      ]);
      drawRadialBg(ctx, W, H, W * 0.85, H * 0.12, W * 0.35, [
        [0, 'rgba(255,255,230,0.8)'], [1, 'rgba(255,255,230,0)'],
      ]);
      const flowerColors = ['#ff9ec4', '#ffd166', '#ffffff', '#ff8b6b'];
      seededScatter(10, 5, (rand, i) => {
        const x = (W / 10) * i + rand() * 40;
        const y = H * (0.86 + rand() * 0.08);
        drawLeaf(ctx, x, y + 20, 26, '#3f8f4f', rand() * 1.2 - 0.6);
        drawPetalFlower(ctx, x, y, 26 + rand() * 10, flowerColors[i % flowerColors.length], '#fff3b0', 5);
      });
      seededScatter(3, 9, (rand, i) => {
        const x = rand() * W;
        const y = H * 0.3 + rand() * H * 0.3;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rand() * 0.6 - 0.3);
        ctx.fillStyle = i % 2 ? '#ff9a3c' : '#5c8bff';
        [[-10, 0], [10, 0]].forEach(([dx]) => {
          ctx.beginPath();
          ctx.ellipse(dx, 0, 12, 8, dx < 0 ? 0.4 : -0.4, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      });
    },
  },
];
