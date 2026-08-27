import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CreditCard, Camera, Upload, X, Crop, Download, Printer, Loader, CheckCircle2, ZoomIn, ZoomOut, Move, RotateCcw, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadApi, printJobsApi } from '../../lib/api';
import CategoryIcon from '../../components/CategoryIcon';
import './PrintServicesPage.css';

// A4 dimensions at 300 DPI for Epson L3250
const A4_W = 2480;
const A4_H = 3508;
// Passport photo standard: 35mm × 45mm at 300 DPI
const PASSPORT_W = 413;
const PASSPORT_H = 531;
// ID card standard: 85.6mm × 53.98mm at 300 DPI
const ID_W = 1012;
const ID_H = 638;

// ─── Image Cropper Component ───
function ImageCropper({ src, aspectRatio, onCrop, onCancel, title }) {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            imgRef.current = img;
            const ratio = aspectRatio || 1;
            let cw, ch;
            if (img.width / img.height > ratio) {
                ch = img.height;
                cw = ch * ratio;
            } else {
                cw = img.width;
                ch = cw / ratio;
            }
            setCrop({ x: (img.width - cw) / 2, y: (img.height - ch) / 2, w: cw, h: ch });
            setImgLoaded(true);
        };
        img.src = src;
    }, [src, aspectRatio]);

    useEffect(() => {
        if (!imgLoaded || !imgRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = imgRef.current;
        const dispW = Math.min(480, window.innerWidth - 64);
        const dispH = (img.height / img.width) * dispW;
        canvas.width = dispW;
        canvas.height = dispH;
        const sx = dispW / img.width;

        ctx.clearRect(0, 0, dispW, dispH);
        ctx.drawImage(img, 0, 0, dispW, dispH);

        // Dark overlay outside crop area
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.fillRect(0, 0, dispW, crop.y * sx);
        ctx.fillRect(0, crop.y * sx, crop.x * sx, crop.h * sx);
        ctx.fillRect((crop.x + crop.w) * sx, crop.y * sx, dispW - (crop.x + crop.w) * sx, crop.h * sx);
        ctx.fillRect(0, (crop.y + crop.h) * sx, dispW, dispH - (crop.y + crop.h) * sx);

        // Crop frame
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(crop.x * sx, crop.y * sx, crop.w * sx, crop.h * sx);

        // Grid lines inside crop
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        const cx = crop.x * sx;
        const cy = crop.y * sx;
        const cw = crop.w * sx;
        const ch = crop.h * sx;
        ctx.strokeRect(cx + cw / 3, cy, cw / 3, ch);
        ctx.strokeRect(cx, cy + ch / 3, cw, ch / 3);

        // Corner handles
        const hs = 10;
        ctx.fillStyle = '#16a34a';
        [[cx, cy], [cx + cw, cy], [cx, cy + ch], [cx + cw, cy + ch]].forEach(([hx, hy]) => {
            ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
        });
    }, [imgLoaded, crop]);

    const handleMouseDown = (e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        setDragging(true);
        setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseMove = (e) => {
        if (!dragging || !imgRef.current || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const sx = imgRef.current.width / canvasRef.current.width;
        const dx = (mx - dragStart.x) * sx;
        const dy = (my - dragStart.y) * sx;

        setCrop(prev => ({
            ...prev,
            x: Math.max(0, Math.min(imgRef.current.width - prev.w, prev.x + dx)),
            y: Math.max(0, Math.min(imgRef.current.height - prev.h, prev.y + dy)),
        }));
        setDragStart({ x: mx, y: my });
    };

    const handleMouseUp = () => setDragging(false);

    // Touch support for mobile
    const handleTouchStart = (e) => {
        if (!canvasRef.current || !e.touches[0]) return;
        const rect = canvasRef.current.getBoundingClientRect();
        setDragging(true);
        setDragStart({ x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top });
    };

    const handleTouchMove = (e) => {
        if (!dragging || !imgRef.current || !canvasRef.current || !e.touches[0]) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.touches[0].clientX - rect.left;
        const my = e.touches[0].clientY - rect.top;
        const sx = imgRef.current.width / canvasRef.current.width;
        const dx = (mx - dragStart.x) * sx;
        const dy = (my - dragStart.y) * sx;

        setCrop(prev => ({
            ...prev,
            x: Math.max(0, Math.min(imgRef.current.width - prev.w, prev.x + dx)),
            y: Math.max(0, Math.min(imgRef.current.height - prev.h, prev.y + dy)),
        }));
        setDragStart({ x: mx, y: my });
    };

    const handleZoom = (dir) => {
        if (!imgRef.current) return;
        setCrop(prev => {
            const factor = dir > 0 ? 0.85 : 1.15;
            const nw = Math.min(imgRef.current.width, Math.max(80, prev.w * factor));
            const nh = nw / (aspectRatio || 1);
            if (nh > imgRef.current.height) return prev;
            return {
                w: nw,
                h: nh,
                x: Math.max(0, Math.min(imgRef.current.width - nw, prev.x + (prev.w - nw) / 2)),
                y: Math.max(0, Math.min(imgRef.current.height - nh, prev.y + (prev.h - nh) / 2)),
            };
        });
    };

    const handleCropDone = () => {
        if (!imgRef.current) return;
        const out = document.createElement('canvas');
        out.width = crop.w;
        out.height = crop.h;
        const ctx = out.getContext('2d');
        ctx.drawImage(imgRef.current, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
        
        const dataUrl = out.toDataURL('image/jpeg', 0.95);
        out.toBlob((blob) => {
            onCrop(blob, dataUrl);
        }, 'image/jpeg', 0.95);
    };

    return (
        <div className="cropper-overlay">
            <div className="cropper-modal">
                <div className="cropper-header">
                    <h3><Crop size={18} /> {title || 'Crop & Align Photo'}</h3>
                    <button className="btn-icon btn-ghost" onClick={onCancel} aria-label="Cancel"><X size={20} /></button>
                </div>
                <div className="cropper-body" ref={containerRef}>
                    {!imgLoaded ? (
                        <div className="cropper-loading"><Loader className="spin" size={32} /></div>
                    ) : (
                        <canvas
                            ref={canvasRef}
                            className="cropper-canvas"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleMouseUp}
                            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
                        />
                    )}
                </div>
                <div className="cropper-controls">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleZoom(-1)}><ZoomOut size={15} /> Zoom Out</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleZoom(1)}><ZoomIn size={15} /> Zoom In</button>
                    <span className="cropper-hint"><Move size={13} /> Drag to adjust area</span>
                </div>
                <div className="cropper-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleCropDone}><Crop size={16} /> Crop &amp; Preview A4</button>
                </div>
            </div>
        </div>
    );
}

// ─── A4 Preview Component ───
function A4Preview({ dataUrl, title, onDownload, onPrint, loading }) {
    if (loading) {
        return (
            <div className="a4-preview-section">
                <h3>{title}</h3>
                <div className="a4-preview-wrap loading-a4">
                    <Loader size={32} className="spin" color="var(--primary)" />
                    <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>Generating 300 DPI A4 Layout for Epson L3250...</p>
                </div>
            </div>
        );
    }

    if (!dataUrl) return null;

    return (
        <div className="a4-preview-section animate-fade-in">
            <div className="a4-preview-header">
                <h3>{title}</h3>
                <span className="a4-ready-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={13} /> Ready to Print (300 DPI A4)
                </span>
            </div>
            <div className="a4-preview-wrap">
                <img src={dataUrl} alt={title} className="a4-preview-img" />
            </div>
            <div className="a4-preview-actions">
                <button className="btn btn-secondary" onClick={onDownload}><Download size={16} /> Download A4 JPEG</button>
                <button className="btn btn-primary" onClick={onPrint}><Printer size={16} /> Print Direct / WiFi</button>
            </div>
        </div>
    );
}

// ─── Main Print Services Page ───
export default function PrintServicesPage() {
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const [activeService, setActiveService] = useState(null);

    // Document upload state
    const [docFiles, setDocFiles] = useState([]);
    const [docCopies, setDocCopies] = useState(1);
    const [docNotes, setDocNotes] = useState('');

    // ID card state
    const [idFront, setIdFront] = useState(null);
    const [idBack, setIdBack] = useState(null);
    const [idFrontPreview, setIdFrontPreview] = useState(null);
    const [idBackPreview, setIdBackPreview] = useState(null);
    const [showIdCropper, setShowIdCropper] = useState(null); // 'front' | 'back'
    const [idCropSrc, setIdCropSrc] = useState(null);
    const [idA4DataUrl, setIdA4DataUrl] = useState(null);
    const [idA4Blob, setIdA4Blob] = useState(null);
    const [idGenerating, setIdGenerating] = useState(false);

    // Passport photo state
    const [passportPhoto, setPassportPhoto] = useState(null);
    const [passportPreview, setPassportPreview] = useState(null);
    const [showPassportCropper, setShowPassportCropper] = useState(false);
    const [passportCropSrc, setPassportCropSrc] = useState(null);
    const [passportQty, setPassportQty] = useState(8);
    const [passportA4DataUrl, setPassportA4DataUrl] = useState(null);
    const [passportA4Blob, setPassportA4Blob] = useState(null);
    const [passportGenerating, setPassportGenerating] = useState(false);

    // Submission state
    const [uploading, setUploading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const services = [
        { id: 'document', icon: FileText, title: 'Document Print', desc: 'Upload PDF, Word, resumes or text documents for sharp black & white or color prints.', color: '#0284c7' },
        { id: 'id-card', icon: CreditCard, title: 'ID Card Print', desc: 'Upload front & back of Aadhaar, PAN, Voter or Student ID. Auto-arranges on A4 sheet ready for printing.', color: '#7c3aed' },
        { id: 'passport-photo', icon: Camera, title: 'Passport Photo', desc: 'Upload your portrait photo. Select 2, 4, 8, 12, 16 or 24 copies on A4 paper with cut guides.', color: '#f97316' },
    ];

    // ─── Document handlers ───
    const handleDocFileChange = (e) => {
        const files = Array.from(e.target.files);
        setDocFiles(prev => [...prev, ...files]);
    };
    const removeDocFile = (idx) => setDocFiles(prev => prev.filter((_, i) => i !== idx));

    // ─── ID Card handlers ───
    const handleIdUpload = (side) => (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setIdCropSrc(event.target.result);
            setShowIdCropper(side);
        };
        reader.readAsDataURL(file);
    };

    const handleIdCropDone = (blob, dataUrl) => {
        if (showIdCropper === 'front') {
            setIdFront(blob);
            setIdFrontPreview(dataUrl);
        } else {
            setIdBack(blob);
            setIdBackPreview(dataUrl);
        }
        setShowIdCropper(null);
        setIdCropSrc(null);
    };

    // Generate A4 layout for ID card
    const generateIdA4 = useCallback(async () => {
        if (!idFrontPreview) {
            setIdA4DataUrl(null);
            setIdA4Blob(null);
            return;
        }

        setIdGenerating(true);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = A4_W;
            canvas.height = A4_H;
            const ctx = canvas.getContext('2d');

            // White A4 Sheet background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, A4_W, A4_H);

            const loadImage = (src) => new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });

            // Store Title on A4 Sheet
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 56px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Pandey Grocery Store — ID Card Print', A4_W / 2, 160);

            // Card Standard Dimensions (85.6mm x 53.98mm at 300 DPI) -> 1012px x 638px
            const cardW = ID_W;
            const cardH = ID_H;
            const centerX = (A4_W - cardW) / 2;

            // 1. Draw Front Side
            const frontImg = await loadImage(idFrontPreview);
            const frontY = 320;
            
            ctx.fillStyle = '#64748b';
            ctx.font = '600 36px Arial, sans-serif';
            ctx.fillText('— Front Side —', A4_W / 2, frontY - 20);

            // Card shadow & border
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 3;
            ctx.strokeRect(centerX, frontY, cardW, cardH);
            ctx.drawImage(frontImg, centerX, frontY, cardW, cardH);

            // 2. Draw Back Side if provided
            if (idBackPreview) {
                const backImg = await loadImage(idBackPreview);
                const backY = frontY + cardH + 180;

                ctx.fillStyle = '#64748b';
                ctx.font = '600 36px Arial, sans-serif';
                ctx.fillText('— Back Side —', A4_W / 2, backY - 20);

                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 3;
                ctx.strokeRect(centerX, backY, cardW, cardH);
                ctx.drawImage(backImg, centerX, backY, cardW, cardH);
            }

            // Cut Guidelines Footer
            ctx.fillStyle = '#94a3b8';
            ctx.font = '400 32px Arial, sans-serif';
            ctx.fillText('Printed via Pandey Store WiFi Print Station (Epson L3250)', A4_W / 2, A4_H - 100);

            const outDataUrl = canvas.toDataURL('image/jpeg', 0.95);
            setIdA4DataUrl(outDataUrl);

            canvas.toBlob((blob) => {
                setIdA4Blob(blob);
            }, 'image/jpeg', 0.95);
        } catch (err) {
            console.error('Failed to generate ID card A4:', err);
        } finally {
            setIdGenerating(false);
        }
    }, [idFrontPreview, idBackPreview]);

    useEffect(() => {
        if (idFrontPreview && activeService === 'id-card') {
            generateIdA4();
        }
    }, [idFrontPreview, idBackPreview, activeService, generateIdA4]);

    // ─── Passport Photo handlers ───
    const handlePassportUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setPassportCropSrc(event.target.result);
            setShowPassportCropper(true);
        };
        reader.readAsDataURL(file);
    };

    const handlePassportCropDone = (blob, dataUrl) => {
        setPassportPhoto(blob);
        setPassportPreview(dataUrl);
        setShowPassportCropper(false);
        setPassportCropSrc(null);
    };

    // Generate A4 layout for passport photos
    const generatePassportA4 = useCallback(async () => {
        if (!passportPreview) {
            setPassportA4DataUrl(null);
            setPassportA4Blob(null);
            return;
        }

        setPassportGenerating(true);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = A4_W;
            canvas.height = A4_H;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, A4_W, A4_H);

            const loadImage = (src) => new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });

            const img = await loadImage(passportPreview);

            // Passport photo size on A4 at 300 DPI: 35mm × 45mm (413px x 531px)
            const pw = PASSPORT_W;
            const ph = PASSPORT_H;
            const gap = 48;
            const cols = 4;
            const totalGridW = cols * pw + (cols - 1) * gap;
            const startX = (A4_W - totalGridW) / 2;
            const startY = 160;

            let count = 0;
            for (let row = 0; row < 6 && count < passportQty; row++) {
                for (let col = 0; col < cols && count < passportQty; col++) {
                    const x = startX + col * (pw + gap);
                    const y = startY + row * (ph + gap);

                    // Dashed cut guide around passport photo
                    ctx.strokeStyle = '#cbd5e1';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([8, 6]);
                    ctx.strokeRect(x - 2, y - 2, pw + 4, ph + 4);
                    ctx.setLineDash([]);

                    // Draw image
                    ctx.drawImage(img, x, y, pw, ph);
                    count++;
                }
            }

            // Header note
            ctx.fillStyle = '#94a3b8';
            ctx.font = '30px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Pandey Grocery Store • ${passportQty} Passport Photos (35mm × 45mm Standard)`, A4_W / 2, 90);

            const outDataUrl = canvas.toDataURL('image/jpeg', 0.95);
            setPassportA4DataUrl(outDataUrl);

            canvas.toBlob((blob) => {
                setPassportA4Blob(blob);
            }, 'image/jpeg', 0.95);
        } catch (err) {
            console.error('Failed to generate passport A4:', err);
        } finally {
            setPassportGenerating(false);
        }
    }, [passportPreview, passportQty]);

    useEffect(() => {
        if (passportPreview && activeService === 'passport-photo') {
            generatePassportA4();
        }
    }, [passportPreview, passportQty, activeService, generatePassportA4]);

    // ─── Download A4 ───
    const downloadA4FromDataUrl = (dataUrl, filename) => {
        if (!dataUrl) return;
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
    };

    // ─── Print A4 ───
    const printA4FromDataUrl = (dataUrl) => {
        if (!dataUrl) return;
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
                <head>
                    <title>Print Document - Pandey Store</title>
                    <style>
                        @page { size: A4 portrait; margin: 0; }
                        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
                        img { width: 100%; height: auto; max-height: 100vh; object-fit: contain; }
                    </style>
                </head>
                <body>
                    <img src="${dataUrl}" onload="window.print();" />
                </body>
            </html>
        `);
        win.document.close();
    };

    // ─── Submit print job ───
    const submitJob = async (type, files, outputBlob) => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        setUploading(true);
        setError(null);
        try {
            // Upload source files to Vercel Blob
            const uploadedUrls = [];
            for (const file of files) {
                const fileObj = file instanceof Blob ? new File([file], `${type}-${Date.now()}.jpg`, { type: 'image/jpeg' }) : file;
                const res = await uploadApi.uploadPrintFile(fileObj);
                uploadedUrls.push(res.url);
            }

            // Upload A4 output if available
            let outputUrl = null;
            if (outputBlob) {
                const outFile = new File([outputBlob], `${type}-a4-${Date.now()}.jpg`, { type: 'image/jpeg' });
                const outRes = await uploadApi.uploadPrintFile(outFile);
                outputUrl = outRes.url;
            }

            await printJobsApi.create({
                type,
                fileUrls: uploadedUrls,
                outputUrl,
                quantity: type === 'document' ? docCopies : type === 'passport-photo' ? passportQty : 1,
                notes: type === 'document' ? docNotes : null,
            });

            setSubmitted(true);
        } catch (err) {
            setError(err.message || 'Failed to submit print job');
        } finally {
            setUploading(false);
        }
    };

    const resetAll = () => {
        setDocFiles([]); setDocCopies(1); setDocNotes('');
        setIdFront(null); setIdBack(null); setIdFrontPreview(null); setIdBackPreview(null);
        setIdA4DataUrl(null); setIdA4Blob(null);
        setPassportPhoto(null); setPassportPreview(null);
        setPassportA4DataUrl(null); setPassportA4Blob(null);
        setError(null);
    };

    // ─── Success view ───
    if (submitted) {
        return (
            <div className="print-services-page">
                <div className="container">
                    <div className="print-success animate-fade-in">
                        <div className="print-success-icon"><CheckCircle2 size={56} /></div>
                        <h2>Print Job Received!</h2>
                        <p>Your files have been formatted and sent to our in-store printing station.</p>
                        <p className="print-success-hint">Visit <strong>Pandey Grocery Store</strong> in Haldwani to collect your prints and pay at the counter.</p>
                        <div className="print-success-actions">
                            <button className="btn btn-primary btn-lg" onClick={() => { setSubmitted(false); setActiveService(null); resetAll(); }}>
                                Print Another Document
                            </button>
                            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/account')}>
                                View My Orders
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Service Selection ───
    if (!activeService) {
        return (
            <div className="print-services-page">
                <div className="container">
                    <div className="print-hero animate-fade-in">
                        <span className="print-hero-badge">
                            <Sparkles size={14} /> In-Store WiFi Print Station (Epson L3250)
                        </span>
                        <h1>Document &amp; Photo <span className="highlight">Printing Hub</span></h1>
                        <p>Upload files from your mobile or PC, preview instant A4 layouts, and collect high-quality prints directly at our Haldwani shop.</p>
                    </div>

                    <div className="print-services-grid">
                        {services.map((svc, i) => {
                            const Icon = svc.icon;
                            return (
                                <button
                                    key={svc.id}
                                    className="print-service-card animate-fade-in"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                    onClick={() => {
                                        if (!isLoggedIn) { navigate('/login'); return; }
                                        setActiveService(svc.id);
                                        resetAll();
                                    }}
                                >
                                    <div className="print-service-icon" style={{ background: svc.color }}>
                                        <Icon size={30} color="white" />
                                    </div>
                                    <h3>{svc.title}</h3>
                                    <p>{svc.desc}</p>
                                    <span className="print-service-action-pill">Select Service →</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // ─── Document Print View ───
    if (activeService === 'document') {
        return (
            <div className="print-services-page">
                <div className="container">
                    <button className="btn btn-ghost print-back" onClick={() => setActiveService(null)}>
                        ← Back to Print Services
                    </button>
                    <div className="print-workspace animate-fade-in">
                        <div className="print-workspace-header">
                            <FileText size={28} color="#0284c7" />
                            <div>
                                <h2>Document Print</h2>
                                <p className="print-workspace-desc">Upload PDF, Word, or images for in-store printing.</p>
                            </div>
                        </div>

                        <div className="upload-zone" onClick={() => document.getElementById('doc-input').click()}>
                            <Upload size={36} />
                            <p><strong>Click to choose documents</strong> or drag &amp; drop</p>
                            <span>PDF, DOCX, JPG, PNG (up to 10MB per file)</span>
                            <input id="doc-input" type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleDocFileChange} hidden />
                        </div>

                        {docFiles.length > 0 && (
                            <div className="doc-file-list">
                                {docFiles.map((f, i) => (
                                    <div key={i} className="doc-file-item">
                                        <FileText size={18} />
                                        <span className="doc-file-name">{f.name}</span>
                                        <span className="doc-file-size">{(f.size / 1024).toFixed(1)} KB</span>
                                        <button className="btn-icon btn-ghost btn-sm" onClick={() => removeDocFile(i)} aria-label="Remove"><X size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="print-options">
                            <div className="print-option">
                                <label>Number of Copies</label>
                                <input type="number" min="1" max="100" value={docCopies} onChange={e => setDocCopies(Math.max(1, parseInt(e.target.value) || 1))} className="input" />
                            </div>
                            <div className="print-option">
                                <label>Special Instructions / Notes</label>
                                <textarea className="input" rows={2} placeholder="e.g., Black & White only, Color cover, double-sided..." value={docNotes} onChange={e => setDocNotes(e.target.value)} />
                            </div>
                        </div>

                        {error && <p className="print-error">{error}</p>}
                        <button
                            className="btn btn-primary btn-lg print-submit-btn"
                            disabled={docFiles.length === 0 || uploading}
                            onClick={() => submitJob('document', docFiles, null)}
                        >
                            {uploading ? <><Loader className="spin" size={18} /> Submitting...</> : <><Upload size={18} /> Submit for In-Store Printing</>}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── ID Card Print View ───
    if (activeService === 'id-card') {
        return (
            <div className="print-services-page">
                <div className="container">
                    <button className="btn btn-ghost print-back" onClick={() => setActiveService(null)}>
                        ← Back to Print Services
                    </button>
                    <div className="print-workspace animate-fade-in">
                        <div className="print-workspace-header">
                            <CreditCard size={28} color="#7c3aed" />
                            <div>
                                <h2>ID Card Print (A4 Auto-Arranged)</h2>
                                <p className="print-workspace-desc">Upload front &amp; back of your ID card. Auto-cropped &amp; centered on 300 DPI A4 sheet.</p>
                            </div>
                        </div>

                        <div className="id-upload-grid">
                            <div className="id-upload-box">
                                <h4>Front Side <span className="required-tag">* Required</span></h4>
                                {idFrontPreview ? (
                                    <div className="id-preview">
                                        <img src={idFrontPreview} alt="ID Front" />
                                        <button className="btn btn-secondary btn-sm id-change-btn" onClick={() => { setIdFront(null); setIdFrontPreview(null); setIdA4DataUrl(null); }}>
                                            <RotateCcw size={14} /> Change Front
                                        </button>
                                    </div>
                                ) : (
                                    <div className="upload-zone upload-zone-sm" onClick={() => document.getElementById('id-front-input').click()}>
                                        <Upload size={28} />
                                        <p><strong>Upload Front Side</strong></p>
                                        <span>Click to browse photo</span>
                                        <input id="id-front-input" type="file" accept="image/*" onChange={handleIdUpload('front')} hidden />
                                    </div>
                                )}
                            </div>

                            <div className="id-upload-box">
                                <h4>Back Side <span className="optional-tag">Optional</span></h4>
                                {idBackPreview ? (
                                    <div className="id-preview">
                                        <img src={idBackPreview} alt="ID Back" />
                                        <button className="btn btn-secondary btn-sm id-change-btn" onClick={() => { setIdBack(null); setIdBackPreview(null); setIdA4DataUrl(null); }}>
                                            <RotateCcw size={14} /> Change Back
                                        </button>
                                    </div>
                                ) : (
                                    <div className="upload-zone upload-zone-sm" onClick={() => document.getElementById('id-back-input').click()}>
                                        <Upload size={28} />
                                        <p><strong>Upload Back Side</strong></p>
                                        <span>Click to browse photo</span>
                                        <input id="id-back-input" type="file" accept="image/*" onChange={handleIdUpload('back')} hidden />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Live A4 Preview */}
                        <A4Preview
                            dataUrl={idA4DataUrl}
                            loading={idGenerating}
                            title="A4 Print Sheet Preview"
                            onDownload={() => downloadA4FromDataUrl(idA4DataUrl, 'pandey-store-id-card-a4.jpg')}
                            onPrint={() => printA4FromDataUrl(idA4DataUrl)}
                        />

                        {error && <p className="print-error">{error}</p>}
                        <button
                            className="btn btn-primary btn-lg print-submit-btn"
                            disabled={!idFront || uploading}
                            onClick={() => {
                                const files = [idFront];
                                if (idBack) files.push(idBack);
                                submitJob('id-card', files, idA4Blob);
                            }}
                        >
                            {uploading ? <><Loader className="spin" size={18} /> Submitting...</> : <><Upload size={18} /> Submit ID Card for Printing</>}
                        </button>
                    </div>

                    {showIdCropper && idCropSrc && (
                        <ImageCropper
                            src={idCropSrc}
                            aspectRatio={ID_W / ID_H}
                            title={showIdCropper === 'front' ? 'Crop ID Front Side' : 'Crop ID Back Side'}
                            onCrop={handleIdCropDone}
                            onCancel={() => { setShowIdCropper(null); setIdCropSrc(null); }}
                        />
                    )}
                </div>
            </div>
        );
    }

    // ─── Passport Photo View ───
    if (activeService === 'passport-photo') {
        return (
            <div className="print-services-page">
                <div className="container">
                    <button className="btn btn-ghost print-back" onClick={() => setActiveService(null)}>
                        ← Back to Print Services
                    </button>
                    <div className="print-workspace animate-fade-in">
                        <div className="print-workspace-header">
                            <Camera size={28} color="#f97316" />
                            <div>
                                <h2>Passport Size Photo Print</h2>
                                <p className="print-workspace-desc">Upload portrait photo. Crop to standard 35mm × 45mm and arrange multiple photos on A4 sheet.</p>
                            </div>
                        </div>

                        {passportPreview ? (
                            <div className="passport-uploaded">
                                <div className="passport-preview-thumb">
                                    <img src={passportPreview} alt="Passport cropped" />
                                    <button className="btn btn-secondary btn-sm" onClick={() => { setPassportPhoto(null); setPassportPreview(null); setPassportA4DataUrl(null); }}>
                                        <RotateCcw size={14} /> Change Photo
                                    </button>
                                </div>
                                <div className="passport-options">
                                    <label>Choose number of photos on A4 sheet:</label>
                                    <div className="qty-selector">
                                        {[2, 4, 6, 8, 12, 16, 24].map(n => (
                                            <button
                                                key={n}
                                                className={`qty-btn ${passportQty === n ? 'active' : ''}`}
                                                onClick={() => setPassportQty(n)}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="upload-zone" onClick={() => document.getElementById('passport-input').click()}>
                                <Camera size={36} />
                                <p><strong>Click to upload portrait photo</strong></p>
                                <span>A clear, front-facing selfie or portrait works best</span>
                                <input id="passport-input" type="file" accept="image/*" onChange={handlePassportUpload} hidden />
                            </div>
                        )}

                        {/* Live Passport A4 Preview */}
                        <A4Preview
                            dataUrl={passportA4DataUrl}
                            loading={passportGenerating}
                            title={`A4 Sheet Preview (${passportQty} Photos with Cut Guides)`}
                            onDownload={() => downloadA4FromDataUrl(passportA4DataUrl, 'pandey-store-passport-photos-a4.jpg')}
                            onPrint={() => printA4FromDataUrl(passportA4DataUrl)}
                        />

                        {error && <p className="print-error">{error}</p>}
                        <button
                            className="btn btn-primary btn-lg print-submit-btn"
                            disabled={!passportPhoto || uploading}
                            onClick={() => submitJob('passport-photo', [passportPhoto], passportA4Blob)}
                        >
                            {uploading ? <><Loader className="spin" size={18} /> Submitting...</> : <><Upload size={18} /> Submit Passport Photos for Printing</>}
                        </button>
                    </div>

                    {showPassportCropper && passportCropSrc && (
                        <ImageCropper
                            src={passportCropSrc}
                            aspectRatio={PASSPORT_W / PASSPORT_H}
                            title="Crop to 35mm × 45mm Passport Size"
                            onCrop={handlePassportCropDone}
                            onCancel={() => { setShowPassportCropper(false); setPassportCropSrc(null); }}
                        />
                    )}
                </div>
            </div>
        );
    }

    return null;
}
