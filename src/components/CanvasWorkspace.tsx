import { Upload, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Maximize2, Trash2, Layers, BookOpen, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import React, { useRef, useEffect, useState } from 'react';
import { Rectangle, SelectedRegion, TagSession } from '../types';
import { SAMPLE_PAGES } from '../data/sampleTextbook';
import { cropCanvasFromPercentage, extractPdfTextInRect } from '../utils/pdfHelpers';

interface CanvasWorkspaceProps {
  sessions: TagSession[];
  activeSession: TagSession;
  onUpdateActiveSession: (updater: (s: TagSession) => TagSession) => void;
  pdfjsReady: boolean;
  onSelectTagId: (id: string) => void;
  pdfFile: File | { name: string; base64: string } | null;
  onPdfFileChange: (file: File | { name: string; base64: string } | null) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export const CanvasWorkspace = ({
  sessions,
  activeSession,
  onUpdateActiveSession,
  pdfjsReady,
  onSelectTagId,
  pdfFile,
  onPdfFileChange,
  currentPage,
  setCurrentPage,
}: CanvasWorkspaceProps) => {
  // File, PDF & Page States
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(3); // Default sample textbook has 3 pages
  const [zoomScale, setZoomScale] = useState(1.2);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Drawing overlay states
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  // Bounding container and Canvas references
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize PDF file loading from props (manual or database restored)
  useEffect(() => {
    if (!pdfFile) {
      setPdfDoc(null);
      setTotalPages(3);
      return;
    }

    if (!pdfjsReady) return;

    const loadPdfDoc = async () => {
      setErrorMessage(null);
      setIsLoading(true);

      try {
        if ('base64' in pdfFile && pdfFile.base64) {
          // It's a restored PDF from SQLite database
          const binaryString = atob(pdfFile.base64);
          const len = binaryString.length;
          const typedArray = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            typedArray[i] = binaryString.charCodeAt(i);
          }

          const pdfjs = (window as any).pdfjsLib;
          const loadingTask = pdfjs.getDocument({ data: typedArray });
          const doc = await loadingTask.promise;
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          if (currentPage > doc.numPages) {
            setCurrentPage(doc.numPages);
          } else if (currentPage < 1) {
            setCurrentPage(1);
          }
          setIsLoading(false);
        } else if (pdfFile instanceof File) {
          // Standard browser File object from client-side dynamic upload
          const fileReader = new FileReader();
          fileReader.onload = async (e) => {
            try {
              const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
              const pdfjs = (window as any).pdfjsLib;
              const loadingTask = pdfjs.getDocument({ data: typedArray });
              const doc = await loadingTask.promise;
              setPdfDoc(doc);
              setTotalPages(doc.numPages);
              if (currentPage > doc.numPages) {
                setCurrentPage(doc.numPages);
              } else if (currentPage < 1) {
                setCurrentPage(1);
              }
              setIsLoading(false);
            } catch (err: any) {
              setErrorMessage(err.message || 'Error parsing uploaded PDF file.');
              setIsLoading(false);
            }
          };
          fileReader.readAsArrayBuffer(pdfFile);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error loading PDF document.');
        setIsLoading(false);
      }
    };

    loadPdfDoc();
  }, [pdfFile, pdfjsReady]);

  // Render the current view state (Real PDF or vector-rendered sample textbook page)
  const drawPage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (pdfDoc) {
      // 1. Render Real PDF page via PDF.js viewport
      try {
        setIsLoading(true);
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: zoomScale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };
        await page.render(renderContext).promise;
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error rendering PDF page: ', err);
        setErrorMessage('Failed to draw PDF page. Attempting redraw.');
        setIsLoading(false);
      }
    } else {
      // 2. Render Simulated textbook page beautifully with vectors (playground fallback)
      const samplePage = SAMPLE_PAGES.find((p) => p.pageNumber === currentPage);
      if (samplePage) {
        const baseWidth = 560;
        const baseHeight = 720;
        canvas.width = baseWidth * zoomScale;
        canvas.height = baseHeight * zoomScale;

        // Clear canvas with base background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Custom Vector biological or technical drawings
        samplePage.renderPageIllustration(ctx, canvas.width, canvas.height);

        // Display Header text layers
        ctx.fillStyle = '#18181b'; // zinc-900
        ctx.font = `bold ${Math.max(12, 13 * zoomScale)}px "Space Grotesk", sans-serif`;
        ctx.fillText(samplePage.title, 40 * zoomScale, 50 * zoomScale);

        ctx.fillStyle = '#71717a'; // zinc-500
        ctx.font = `italic ${Math.max(10, 10 * zoomScale)}px "Space Grotesk", sans-serif`;
        ctx.fillText(samplePage.subTitle, 40 * zoomScale, 70 * zoomScale);

        // Draw paragraph layers
        ctx.fillStyle = '#27272a'; // zinc-800
        ctx.font = `${Math.max(10, 10.5 * zoomScale)}px "Inter", sans-serif`;
        
        samplePage.textBlocks.forEach((block) => {
          const lX = (block.x / 100) * canvas.width;
          const lY = (block.y / 100) * canvas.height;
          const lW = (block.w / 100) * canvas.width;
          const lH = (block.h / 100) * canvas.height;

          // Wrap long strings beautifully on the mock textbook
          wrapCanvasText(ctx, block.str, lX, lY, lW, 14 * zoomScale);
        });
      }
    }
  };

  // Minimal Canvas multi-line word wrapper helper
  const wrapCanvasText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  };

  // Listen to visual parameters and triggers to redraw page layout
  useEffect(() => {
    drawPage();
  }, [pdfDoc, currentPage, zoomScale, pdfjsReady]);

  // Interactivity Drag coordinates
  const getContainerCoordsFromEvent = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    
    // Convert click position to percentage bounds inside the rendered canvas width and height
    const calcX = ((e.clientX - bounds.left) / bounds.width) * 100;
    const calcY = ((e.clientY - bounds.top) / bounds.height) * 100;
    
    return {
      x: Math.max(0, Math.min(100, calcX)),
      y: Math.max(0, Math.min(100, calcY)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const coords = getContainerCoordsFromEvent(e);
    if (!coords) return;
    setIsDrawing(true);
    setDrawStart(coords);
    setDrawCurrent(coords);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) return;
    const coords = getContainerCoordsFromEvent(e);
    if (!coords) return;
    setDrawCurrent(coords);
  };

  const handleMouseUp = async () => {
    if (!isDrawing || !drawStart || !drawCurrent) return;
    setIsDrawing(false);

    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const w = Math.abs(drawStart.x - drawCurrent.x);
    const h = Math.abs(drawStart.y - drawCurrent.y);

    // Ignore tiny clicks/snags under 1.5% square width
    if (w < 1.5 || h < 1.5) {
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }

    const newRect: Rectangle = { x, y, width: w, height: h };
    setDrawStart(null);
    setDrawCurrent(null);

    // Perform Area Extraction (crop canvas & extract text layers)
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    const croppedImage = cropCanvasFromPercentage(canvas, newRect);

    let extractedText = '';
    if (pdfDoc) {
      // For real PDF, extract real PDF characters using coordinate geometry intersection
      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: zoomScale });
        extractedText = await extractPdfTextInRect(page, viewport, newRect);
      } catch (err) {
        console.error('Core PDF text reading exception:', err);
      }
    } else {
      // For simulated classroom Textbook, filter intersecting block text
      const samplePage = SAMPLE_PAGES.find((p) => p.pageNumber === currentPage);
      if (samplePage) {
        const matchingTexts: string[] = [];
        samplePage.textBlocks.forEach((block) => {
          // Check if block intersects
          const r1 = newRect;
          const r2 = block;
          const isOverlapping = !(
            r2.x > r1.x + r1.width ||
            r2.x + r2.w < r1.x ||
            r2.y > r1.y + r1.height ||
            r2.y + r2.h < r1.y
          );
          if (isOverlapping) {
            matchingTexts.push(block.str);
          }
        });
        extractedText = matchingTexts.join(' \n');
      }
    }

    // Add new pinpoint selection region to current tag session regions
    const newRegion: SelectedRegion = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      pageNumber: currentPage,
      rect: newRect,
      text: extractedText,
      image: croppedImage,
      selectionMode: activeSession.selectionMode,
    };

    onUpdateActiveSession((oldSession) => ({
      ...oldSession,
      regions: [...oldSession.regions, newRegion],
    }));

    setIsLoading(false);
  };

  const handleResetCurrentPageSelection = () => {
    onUpdateActiveSession((oldSession) => ({
      ...oldSession,
      regions: [],
    }));
  };

  const handleDeleteRegion = (regionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateActiveSession((oldSession) => ({
      ...oldSession,
      regions: oldSession.regions.filter((r) => r.id !== regionId),
    }));
  };

  // Compute bounding coordinates for current raw drawing rectangle
  const getDrawingDivStyle = () => {
    if (!drawStart || !drawCurrent) return {};
    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const w = Math.abs(drawStart.x - drawCurrent.x);
    const h = Math.abs(drawStart.y - drawCurrent.y);
    return {
      left: `${x}%`,
      top: `${y}%`,
      width: `${w}%`,
      height: `${h}%`,
    };
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        onPdfFileChange(file);
        setCurrentPage(1);
      } else {
        setErrorMessage('File must be a valid PDF study material.');
      }
    }
  };

  return (
    <div id="central-canvas-viewer-layout" className="flex-1 flex flex-col justify-between bg-zinc-100 select-none overflow-hidden relative">
      {/* File management & Active Tag bar */}
      <div className="h-16 px-6 bg-white border-b border-zinc-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          {/* File input button selector */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 text-white hover:bg-zinc-800 text-xs font-semibold py-2 px-3.5 rounded cursor-pointer transition-colors shrink-0"
          >
            <Upload size={14} />
            <span>Upload Student PDF</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onPdfFileChange(e.target.files[0]);
                setCurrentPage(1);
                e.target.value = ''; // Clear selected filename so uploading the same file triggers load again
              }
            }}
            accept="application/pdf"
            className="hidden"
          />

          <div className="border-l border-zinc-200 h-6 shrink-0" />

          {/* Active study tag picker */}
          {/* <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">ACTIVE SESSION TAG:</span>
            <div className="flex items-center gap-1">
              {sessions.map((s) => {
                const isSelected = s.id === activeSession.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectTagId(s.id)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                      isSelected
                        ? `${s.color} scale-102 ring-1 ring-zinc-900/[0.05]`
                        : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div> */}
        </div>

        {/* Toggle Mode selectors */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 rounded p-0.5">
            <button
              onClick={() =>
                onUpdateActiveSession((old) => ({
                  ...old,
                  selectionMode: 'text',
                }))
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                activeSession.selectionMode === 'text'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
              title="Smart Text: Extracts selectable words and tags it to prompt context."
            >
              <FileText size={13} />
              <span>Smart Text</span>
            </button>
            <button
              onClick={() =>
                onUpdateActiveSession((old) => ({
                  ...old,
                  selectionMode: 'image',
                }))
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                activeSession.selectionMode === 'image'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
              title="Image Crop: Takes high-fidelity visuals of formulas/diagrams."
            >
              <Layers size={13} />
              <span>Image Crop</span>
            </button>
          </div>

          {activeSession.regions.length > 0 && (
            <button
              onClick={handleResetCurrentPageSelection}
              className="text-xs text-rose-600 hover:text-rose-800 font-sans font-semibold border border-rose-200 bg-rose-50 px-3 py-1.5 rounded cursor-pointer hover:bg-rose-100/50 transition-colors"
            >
              Clear selections
            </button>
          )}
        </div>
      </div>

      {/* Main viewport workspace layout */}
      <div
        className="flex-1 overflow-auto p-8 flex justify-center items-start min-h-0 select-none outline-hidden relative"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="relative group/workspace flex flex-col items-center">
          {/* Main rendered textbook container canvas with responsive absolute overlay div */}
          <div
            ref={containerRef}
            className="relative border border-zinc-200/80 rounded bg-white shadow-lg overflow-hidden select-none"
            style={{
              cursor: isDrawing ? 'crosshair' : 'default',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* The main canvas */}
            <canvas ref={canvasRef} className="block select-none pointer-events-none" />

            {/* Active drawing feedback box overlay */}
            {isDrawing && drawStart && drawCurrent && (
              <div
                className="absolute border-2 border-dashed flex flex-col justify-between p-1 z-10"
                style={{
                  ...getDrawingDivStyle(),
                  borderColor: activeSession.themeColor,
                  backgroundColor: `${activeSession.themeColor}0C`,
                }}
              >
                {/* Visual coordinate badge indicator */}
                <div
                  className="bg-zinc-950 font-mono text-[8px] text-zinc-100 px-1 py-0.5 rounded shadow-sm hover:scale-105 shrink-0 self-start select-none font-bold"
                  style={{ backgroundColor: activeSession.themeColor }}
                >
                  [{Math.round(drawStart.x)}% {Math.round(drawStart.y)}%]
                </div>
              </div>
            )}

            {/* Render fixed absolute region boxes drawn into CURRENT ACTIVE Tag Session */}
            {activeSession.regions
              .filter((r) => r.pageNumber === currentPage)
              .map((region, idx) => {
                const { x, y, width, height } = region.rect;
                return (
                  <div
                    key={region.id}
                    className="absolute border border-solid group/region transition-all flex flex-col justify-between p-1 z-20 group"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                      borderColor: activeSession.themeColor,
                      backgroundColor: `${activeSession.themeColor}12`,
                    }}
                  >
                    {/* Bounding box title and micro-deletions trigger */}
                    <div className="flex items-center justify-between w-full relative">
                      <div
                        className="font-mono text-[8px] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 select-none shadow-xs"
                        style={{ backgroundColor: activeSession.themeColor }}
                      >
                        {activeSession.name} #{idx + 1}
                      </div>

                      {/* Floating Trash Delete trigger bubble */}
                      <button
                        onClick={(e) => handleDeleteRegion(region.id, e)}
                        className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:scale-110 shadow-lg text-white flex items-center justify-center shrink-0 cursor-pointer transition-all absolute -right-3 -top-3 z-30"
                        title="Delete Selection snippet"
                      >
                        <Trash2 size={9} />
                      </button>
                    </div>

                    <div className="flex justify-between items-end w-full">
                      <span className="text-[8px] font-mono text-zinc-500 bg-white/70 px-1 rounded">
                        P.{region.pageNumber} • AREA_0{idx + 1}
                      </span>
                      <span
                        className={`text-[7px] font-mono font-bold px-1 py-0.5 rounded flex items-center gap-0.5 ${
                          region.selectionMode === 'image'
                            ? 'bg-amber-100 text-amber-700 border border-amber-300'
                            : 'bg-sky-100 text-sky-700 border border-sky-300'
                        }`}
                      >
                        {region.selectionMode === 'image' ? (
                          <><Layers size={6} /> IMG</>
                        ) : (
                          <><FileText size={6} /> TXT</>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Global Loading, Error, or empty indicators */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/65 flex items-center justify-center z-10 select-none">
            <div className="bg-white border border-zinc-200 rounded p-4 shadow-xl flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin" />
              <span className="text-xs font-mono font-bold text-zinc-700">Composing campus layouts...</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="absolute bottom-6 left-6 max-w-sm bg-rose-50 border border-rose-200 rounded p-3 shadow-lg flex items-start gap-2.5 z-20 animate-slide-up">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold text-rose-800">Workspace Diagnostic</h4>
              <p className="text-[10px] text-rose-600 mt-1 leading-normal font-sans">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-700 text-xs shrink-0 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {!pdfDoc && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none opacity-20 text-center select-none">
            <BookOpen size={160} className="mx-auto text-zinc-400" />
            <h3 className="font-sans font-extrabold text-sm uppercase tracking-widest text-zinc-500 mt-2">
              Furian Digital Study Desk
            </h3>
            <p className="text-xs font-sans text-zinc-400 mt-2">
              Drag study materials onto desk surface to bind
            </p>
          </div>
        )}
      </div>

      {/* Footer view Controls */}
      <div className="h-16 px-6 bg-white border-t border-zinc-200/80 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-400 uppercase">Study Material Source:</span>
          {pdfFile ? (
            <div className="bg-emerald-500/10 border border-emerald-300/60 rounded px-2 py-1 text-[10px] text-emerald-800 font-mono font-bold flex items-center gap-1">
              <CheckCircle2 size={10} className="text-emerald-600" />
              <span>REAL PDF: {pdfFile.name} (Pages: {totalPages})</span>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-300/60 rounded px-2 py-1 text-[10px] text-amber-800 font-mono font-bold flex items-center gap-1 leading-none">
              <BookOpen size={10} className="text-amber-600" />
              <span>SIMULATED CLASSROOM TEXTBOOK (Page 1-3 available)</span>
            </div>
          )}
        </div>

        {/* Dynamic Page traverse actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 border border-zinc-200 bg-zinc-50/50 rounded p-0.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="w-8 h-8 rounded hover:bg-white text-zinc-600 hover:text-zinc-900 border border-transparent disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono text-xs text-zinc-800 font-bold px-3">
              PAGE {currentPage} OF {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="w-8 h-8 rounded hover:bg-white text-zinc-600 hover:text-zinc-900 border border-transparent disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="border-l border-zinc-200 h-6 shrink-0" />

          {/* Zoom operations */}
          <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded p-0.5 text-xs text-zinc-600 shrink-0">
            <button
              onClick={() => setZoomScale((z) => Math.max(0.6, z - 0.15))}
              className="p-1 px-2 hover:bg-white rounded hover:text-zinc-900 cursor-pointer"
              title="Zoom out study board"
            >
              <ZoomOut size={13} />
            </button>
            <span className="font-mono text-[10px] font-bold tracking-tight px-1 text-zinc-800">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale((z) => Math.min(2.2, z + 0.15))}
              className="p-1 px-2 hover:bg-white rounded hover:text-zinc-900 cursor-pointer"
              title="Zoom in study board"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>

        <div className="text-[10px] font-mono text-zinc-400 uppercase hidden sm:block shrink-0">
          📍 TIP: Click & drag bounding box to capture
        </div>
      </div>
    </div>
  );
};
