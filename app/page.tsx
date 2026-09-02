"use client";

import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from "react";

type Adjustments = { brightness: number; contrast: number; saturation: number; blur: number; rotation: number; flipX: boolean; flipY: boolean };
const initialAdjustments: Adjustments = { brightness: 100, contrast: 100, saturation: 100, blur: 0, rotation: 0, flipX: false, flipY: false };
const presets: Record<string, Partial<Adjustments>> = {
  Original: {},
  Noir: { saturation: 0, contrast: 125 },
  Warm: { brightness: 105, saturation: 118, contrast: 104 },
  Crisp: { contrast: 124, saturation: 112 },
};

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("untitled");
  const [adjustments, setAdjustments] = useState<Adjustments>(initialAdjustments);
  const [activeTab, setActiveTab] = useState<"adjust" | "transform">("adjust");
  const [activePreset, setActivePreset] = useState("Original");
  const [isDragging, setIsDragging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback((file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const source = String(reader.result);
      const img = new Image();
      img.onload = () => { imageRef.current = img; setImage(source); setFileName(file.name.replace(/\.[^/.]+$/, "")); };
      img.src = source;
    };
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const radians = (adjustments.rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    const width = img.naturalWidth * cos + img.naturalHeight * sin;
    const height = img.naturalWidth * sin + img.naturalHeight * cos;
    const scale = Math.min(1, 1200 / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(radians);
    context.scale(adjustments.flipX ? -scale : scale, adjustments.flipY ? -scale : scale);
    context.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) blur(${adjustments.blur}px)`;
    context.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    context.restore();
  }, [image, adjustments]);

  const update = (key: keyof Adjustments, value: number | boolean) => {
    setAdjustments((current) => ({ ...current, [key]: value }));
    setActivePreset("Custom");
  };
  const applyPreset = (name: string) => {
    setActivePreset(name);
    setAdjustments({ ...initialAdjustments, ...presets[name] });
  };
  const reset = () => { setAdjustments(initialAdjustments); setActivePreset("Original"); };
  const onInput = (event: ChangeEvent<HTMLInputElement>) => loadFile(event.target.files?.[0]);
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); loadFile(event.dataTransfer.files?.[0]); };
  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    setIsExporting(true);
    canvas.toBlob((blob) => {
      if (!blob) { setIsExporting(false); return; }
      const link = document.createElement("a");
      link.download = `${fileName || "imggeditzz-export"}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      setIsExporting(false);
    }, "image/png");
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">✳</span><span>imggeditzz</span><span className="beta">BETA</span></div>
        <div className="top-actions"><button className="text-button" onClick={reset} disabled={!image}>Reset edits</button><button className="export-button" onClick={exportImage} disabled={!image || isExporting}>{isExporting ? "Exporting…" : "Export image"}<span>↗</span></button></div>
      </header>
      <section className="workspace">
        <div className="canvas-column">
          <div className="canvas-toolbar"><div><span className="eyebrow">WORKSPACE</span><h1>{image ? fileName : "Your creative canvas"}</h1></div>{image && <span className="format-pill">PNG · {canvasRef.current?.width || "—"} × {canvasRef.current?.height || "—"}</span>}</div>
          <div className={`canvas-stage ${isDragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={onDrop}>
            {image ? <canvas ref={canvasRef} aria-label="Edited image preview" /> : <div className="empty-state"><div className="upload-icon">＋</div><h2>Drop an image to begin</h2><p>Bring in a JPG, PNG, or WebP and make it yours.</p><button className="primary-button" onClick={() => inputRef.current?.click()}>Choose image <span>↗</span></button><span className="drop-note">or drag and drop anywhere on the canvas</span></div>}
          </div>
          <div className="canvas-footer"><span>{image ? "Changes are applied live" : "Private by design · images never leave your browser"}</span><span className="shortcut">TIP <b>⌘ S</b> to export</span></div>
        </div>
        <aside className="sidebar">
          <div className="side-heading"><div><span className="eyebrow">EDIT</span><h2>Make it yours</h2></div><span className="sparkle">✦</span></div>
          <div className="tabs"><button className={activeTab === "adjust" ? "active" : ""} onClick={() => setActiveTab("adjust")}>Adjust</button><button className={activeTab === "transform" ? "active" : ""} onClick={() => setActiveTab("transform")}>Transform</button></div>
          {activeTab === "adjust" ? <div className="controls">
            <Control label="Brightness" value={adjustments.brightness} min={0} max={200} suffix="%" onChange={(value) => update("brightness", value)} />
            <Control label="Contrast" value={adjustments.contrast} min={0} max={200} suffix="%" onChange={(value) => update("contrast", value)} />
            <Control label="Saturation" value={adjustments.saturation} min={0} max={200} suffix="%" onChange={(value) => update("saturation", value)} />
            <Control label="Blur" value={adjustments.blur} min={0} max={12} suffix="px" onChange={(value) => update("blur", value)} />
            <div className="divider" /><div className="section-label">PRESETS</div><div className="preset-grid">{Object.keys(presets).map((name) => <button key={name} className={activePreset === name ? "preset selected" : "preset"} onClick={() => applyPreset(name)}><span className={`preset-swatch ${name.toLowerCase()}`} />{name}</button>)}</div>
          </div> : <div className="controls"><div className="section-label">ROTATE</div><div className="transform-row"><button onClick={() => update("rotation", adjustments.rotation - 90)}>↶ <span>Left</span></button><button onClick={() => update("rotation", adjustments.rotation + 90)}>↷ <span>Right</span></button></div><div className="section-label">FLIP</div><div className="transform-row"><button className={adjustments.flipX ? "selected-control" : ""} onClick={() => update("flipX", !adjustments.flipX)}>↔ <span>Horizontal</span></button><button className={adjustments.flipY ? "selected-control" : ""} onClick={() => update("flipY", !adjustments.flipY)}>↕ <span>Vertical</span></button></div><button className="reset-link" onClick={reset}>Reset all transformations</button></div>}
          <div className="sidebar-bottom"><button className="secondary-button" onClick={() => inputRef.current?.click()}>＋ Replace image</button><p>Supports JPG, PNG, WebP · up to 20MB</p></div>
        </aside>
      </section>
      <input ref={inputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={onInput} />
    </main>
  );
}

function Control({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (value: number) => void }) {
  return <label className="control"><span className="control-label">{label}</span><span className="value-box">{value}{suffix}</span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}
