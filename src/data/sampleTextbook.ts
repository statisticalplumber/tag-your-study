export interface TextBlock {
  str: string;
  x: number; // percentage from left (0 to 100)
  y: number; // percentage from top (0 to 100)
  w: number; // percentage width
  h: number; // percentage height
}

export interface SamplePage {
  pageNumber: number;
  title: string;
  subTitle: string;
  textBlocks: TextBlock[];
  renderPageIllustration: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

export const SAMPLE_PAGES: SamplePage[] = [
  {
    pageNumber: 1,
    title: "🧬 MODULE 1: EUKARYOTIC CELL ANATOMY",
    subTitle: "Cellular Structure, Organelles, and Energy Processing",
    textBlocks: [
      {
        str: "The eukaryotic cell stands as the structural cornerstone of multicellular organisms. Distinguished primarily by the presence of a double-membrane-bound nucleus, it isolates genomic DNA from cytoplasmic biochemistry.",
        x: 8, y: 15, w: 84, h: 8
      },
      {
        str: "Key architectural components include the endoplasmic reticulum (ER), which serves as a synthesis hub for lipids and proteins. Below, we visualize a eukaryotic model focused on ribosome density and transcription compartmentalization.",
        x: 8, y: 25, w: 84, h: 8
      },
      {
        str: "[CRITICAL FORMULA] Intracellular Diffusion Rate Equation:",
        x: 8, y: 80, w: 84, h: 3
      },
      {
        str: "J = -D * (dC / dx)",
        x: 8, y: 84, w: 84, h: 4
      },
      {
        str: "Where J is the flux rate, D represents the diffusion coefficient, dC is concentration gradient, and dx is the barrier width. Cellular efficiency is fundamentally limited by this ratio, bounding maximum spherical diameter under 100 micrometers.",
        x: 8, y: 89, w: 84, h: 6
      }
    ],
    renderPageIllustration: (ctx, w, h) => {
      // Draw simulated chalkboard or laboratory wireframe grid
      ctx.strokeStyle = '#f3f4f6';
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }
      for (let i = 0; i < h; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }

      const centerX = w / 2;
      const centerY = h * 0.53;
      const r = Math.min(w, h) * 0.18;

      ctx.save();
      // Outer cellular membrane
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ecfeff'; // cyan pale
      ctx.fill();
      ctx.strokeStyle = '#06b6d4'; // cyan
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner nuclear envelope
      ctx.beginPath();
      ctx.arc(centerX - 15, centerY - 10, r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#fef3c7'; // amber pale
      ctx.fill();
      ctx.strokeStyle = '#f59e0b'; // amber
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Nucleolus
      ctx.beginPath();
      ctx.arc(centerX - 20, centerY - 12, r * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();

      // DNA Chromatin squiggles
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX - 35, centerY);
      ctx.bezierCurveTo(centerX - 30, centerY - 5, centerX - 25, centerY + 5, centerX - 18, centerY - 2);
      ctx.stroke();

      // Mitochondria visual power generators
      const mitoX = centerX + r * 0.5;
      const mitoY = centerY + r * 0.3;
      ctx.beginPath();
      ctx.ellipse(mitoX, mitoY, 20, 10, Math.PI / 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fee2e2'; // red pale
      ctx.fill();
      ctx.strokeStyle = '#ef4444'; // red
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner cristae lines
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(mitoX - 10, mitoY - 2);
      ctx.lineTo(mitoX - 2, mitoY + 4);
      ctx.lineTo(mitoX + 6, mitoY - 3);
      ctx.stroke();

      // Ribosomes (tiny dots)
      ctx.fillStyle = '#10b981';
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * r * 0.8;
        const rx = centerX + Math.cos(angle) * dist;
        const ry = centerY + Math.sin(angle) * dist;
        ctx.beginPath();
        ctx.arc(rx, ry, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Technical labels with leader pointers
      ctx.fillStyle = '#18181b';
      ctx.font = '10px monospace';
      
      // Label 1
      ctx.beginPath();
      ctx.moveTo(centerX - r - 10, centerY - 20);
      ctx.lineTo(centerX - r * 0.8, centerY - 10);
      ctx.strokeStyle = '#a1a1aa';
      ctx.stroke();
      ctx.fillText("Plasma Membrane [0.9nm]", centerX - r - 120, centerY - 23);

      // Label 2
      ctx.beginPath();
      ctx.moveTo(centerX + r + 15, centerY + 20);
      ctx.lineTo(mitoX, mitoY);
      ctx.stroke();
      ctx.fillText("Mitochondrial Cristae (ATP Hub)", centerX + r + 20, centerY + 23);

      ctx.restore();
    }
  },
  {
    pageNumber: 2,
    title: "📐 MODULE 2: CALCULUS, DERIVATIVES & SECANT LIMITS",
    subTitle: "Rate of Change and Mathematical Definition of Slopes",
    textBlocks: [
      {
        str: "The derivative measures the instantaneous rate of change of a dynamic function relative to its continuous variable. Geometrically, it represents the limiting value of secant slopes intersecting a continuous curve as delta x compresses towards zero.",
        x: 8, y: 15, w: 84, h: 8
      },
      {
        str: "Consider the rigorous definition of a derivative in formal notation:",
        x: 8, y: 25, w: 84, h: 4
      },
      {
        str: "f'(x) = lim (h -> 0) [ f(x + h) - f(x) ] / h",
        x: 8, y: 31, w: 84, h: 5
      },
      {
        str: "This elegant ratio forms the bedrock of classical physics, determining kinematic velocity, optimization, and mechanical stresses. Review the tangent illustration below.",
        x: 8, y: 38, w: 84, h: 6
      },
      {
        str: "[EXAM SPOTLIGHT]: A critical point occurs where the derivative f'(x) equals exactly zero. However, whether it indicates a local minimum, maximum, or horizontal saddle node is determined solely by the signs of the second-order derivative f''(x).",
        x: 8, y: 82, w: 84, h: 8
      }
    ],
    renderPageIllustration: (ctx, w, h) => {
      // Chalkboard visual Grid lines
      ctx.strokeStyle = '#f4f4f5';
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 45) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }
      for (let i = 0; i < h; i += 45) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }

      ctx.save();
      const originX = w * 0.2;
      const originY = h * 0.72;
      const axisWidth = w * 0.65;
      const axisHeight = h * 0.28;

      // Draw coordinates axes
      ctx.strokeStyle = '#27272a'; // zinc-800
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Y-axis
      ctx.moveTo(originX, originY - axisHeight);
      ctx.lineTo(originX, originY + 20);
      // X-axis
      ctx.moveTo(originX - 20, originY);
      ctx.lineTo(originX + axisWidth, originY);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#27272a';
      ctx.font = '11px sans-serif';
      ctx.fillText("y = f(x)", originX - 45, originY - axisHeight + 10);
      ctx.fillText("x (Independent variable)", originX + axisWidth - 110, originY + 16);

      // Plot curve: y = ax^2 + bx + c starting low, rising and curving off
      ctx.strokeStyle = '#3b82f6'; // blue-500
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(originX + 10, originY - 15);
      
      const points: {x: number, y: number}[] = [];
      for (let px = 0; px <= 260; px += 5) {
        const rx = px / 260; // normalized
        // Polynomial wave curve
        const ry = (rx * rx * -110) + (rx * 170) - 20; 
        const cx = originX + px + 10;
        const cy = originY - ry;
        
        points.push({x: cx, y: cy});
        if (px === 0) {
          ctx.moveTo(cx, cy);
        } else {
          ctx.lineTo(cx, cy);
        }
      }
      ctx.stroke();

      // Select two points for Secant visual demonstration
      const p1 = points[20]; // matching x = x
      const p2 = points[42]; // matching x = x + h

      // Draw dashed project lines to X-axis
      ctx.strokeStyle = '#a1a1aa';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      
      // P1 projections
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p1.x, originY);
      ctx.stroke();

      // P2 projections
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p2.x, originY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Secant line intersecting P1 and P2
      ctx.strokeStyle = '#ef4444'; // red-500 (secant)
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Extrapolate a bit
      const mSym = (p2.y - p1.y) / (p2.x - p1.x);
      ctx.moveTo(p1.x - 30, p1.y - mSym * -30);
      ctx.lineTo(p2.x + 40, p2.y + mSym * 40);
      ctx.stroke();

      // Draw Tangent line at P1 for comparison
      const mTgt = -0.55; // tangent derivative slope
      ctx.strokeStyle = '#10b981'; // emerald-500 (tangent limit)
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p1.x - 40, p1.y - mTgt * -40);
      ctx.lineTo(p1.x + 100, p1.y + mTgt * 100);
      ctx.stroke();

      // Draw nodes on P1 and P2
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(p2.x, p2.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Grid labels
      ctx.fillStyle = '#18181b';
      ctx.font = '9px monospace';
      ctx.fillText("x", p1.x - 3, originY + 12);
      ctx.fillText("x + h", p2.x - 12, originY + 12);

      ctx.fillStyle = '#ef4444';
      ctx.fillText("Secant line [slope = Δy / Δx]", p2.x + 35, p2.y + 10);
      ctx.fillStyle = '#10b981';
      ctx.fillText("Tangent line [slope = dy/dx]", p1.x - 130, p1.y - 15);

      ctx.restore();
    }
  },
  {
    pageNumber: 3,
    title: "🔬 MODULE 3: ELECTROMAGNETIC FIELD FLUX",
    subTitle: "Faraday's Law of Induction and Lenz's Reaction Principles",
    textBlocks: [
      {
        str: "Electromagnetic induction forms the foundation of modern electric power machinery. Faraday's discovery states that any change in the magnetic environment of a coil of wire will induce a electromotive force (EMF).",
        x: 8, y: 15, w: 84, h: 8
      },
      {
        str: "Lenz's Law contributes the vector direction of this induced current, asserting that it will invariably generate a secondary magnetic barrier opposing the original flux delta.",
        x: 8, y: 25, w: 84, h: 6
      },
      {
        str: "The crucial system induction equation is structured as follows:",
        x: 8, y: 34, w: 84, h: 4
      },
      {
        str: "EMF = -N * ( dΦ_B / dt )",
        x: 8, y: 40, w: 84, h: 5
      },
      {
        str: "Where EMF is the electromotive voltage, N represents electrical coil turns, and Φ_B represents magnetic flux. Refer to the field interactions plotted in our diagrammatic simulator.",
        x: 8, y: 47, w: 84, h: 6
      },
      {
        str: "[PRACTICAL APPLICATION] Electrical dynamos, industrial power transformers, induction stovetops, and contactless transport cards utilize this fundamental flux variance model to transfer power wirelessly with minimal kinetic friction loss.",
        x: 8, y: 82, w: 84, h: 9
      }
    ],
    renderPageIllustration: (ctx, w, h) => {
      // Grid lines
      ctx.strokeStyle = '#f4f4f5';
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }
      for (let i = 0; i < h; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }

      ctx.save();
      const cx = w / 2;
      const cy = h * 0.65;

      // Draw induction coil loops
      ctx.strokeStyle = '#d97706'; // copper-ish amber
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      
      // We will draw a helical spring coil vertically
      for (let loop = 0; loop < 5; loop++) {
        const py = cy - 40 + loop * 15;
        
        ctx.beginPath();
        // Back of loop (translucent or thinner to look 3D)
        ctx.bezierCurveTo(cx - 50, py, cx - 20, py - 8, cx + 55, py);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        // Front of loop
        ctx.bezierCurveTo(cx + 55, py, cx + 20, py + 12, cx - 50, py + 4);
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 5;
        ctx.stroke();
      }

      // Draw high flux field lines passing through the coil
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.4)'; // indigo-600
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);

      for (let i = -3; i <= 3; i++) {
        const offset = i * 22;
        ctx.beginPath();
        ctx.moveTo(cx + offset, cy - 80);
        ctx.bezierCurveTo(cx + offset * 2, cy - 40, cx + offset * 2, cy + 40, cx + offset, cy + 80);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw arrows on field lines
      ctx.fillStyle = '#4f46e5';
      for (let i = -2; i <= 2; i++) {
        const offset = i * 22;
        ctx.beginPath();
        ctx.moveTo(cx + offset * 1.5, cy + 10);
        ctx.lineTo(cx + offset * 1.5 - 4, cy + 15);
        ctx.lineTo(cx + offset * 1.5 + 4, cy + 15);
        ctx.fill();
      }

      // Magnetic Core Bar
      ctx.fillStyle = '#e4e4e7';
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(cx - 15, cy - 90, 30, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#27272a';
      ctx.font = 'bold 11px monospace';
      ctx.fillText("N", cx - 4, cy - 74);

      ctx.fillStyle = '#fee2e2';
      ctx.beginPath();
      ctx.rect(cx - 15, cy + 66, 30, 24);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.fillText("S", cx - 4, cy + 82);

      // Metres display
      ctx.fillStyle = '#18181b';
      ctx.font = '9px monospace';
      ctx.fillText("Induction Coil Assembly (N=500)", cx - 80, cy - 48);
      ctx.fillText("Φ_B Flux lines (magnetic field vector)", cx + 60, cy - 48);

      ctx.restore();
    }
  }
];
