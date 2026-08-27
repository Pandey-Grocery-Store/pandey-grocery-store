import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CreditCard, Camera, Upload, X, Crop, Download, Printer, Loader, CheckCircle2, ZoomIn, ZoomOut, Move, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadApi, printJobsApi } from '../../lib/api';
import './PrintServicesPage.css';

// A4 dimensions at 300 DPI
const A4_W = 2480;
const A4_H = 3508;
// Passport photo: 35mm × 45mm at 300 DPI
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
    const [scale, setScale] = useState(1);
    const containerRef = useRef(null);

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            imgRef.current = img;
            // Initial crop centered
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
        if (!imgLoaded || !imgRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = imgRef.current;
        const dispW = 500;
        const dispH = (img.height / img.width) * dispW;
        canvas.width = dispW;
        canvas.height = dispH;
        const sx = dispW / img.width;
        ctx.clearRect(0, 0, dispW, dispH);
        ctx.drawImage(img, 0, 0, dispW, dispH);
        // Darken outside crop
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, dispW, crop.y * sx);
        ctx.fillRect(0, crop.y * sx, crop.x * sx, crop.h * sx);
        ctx.fillRect((crop.x + crop.w) * sx, crop.y * sx, dispW - (crop.x + crop.w) * sx, crop.h * sx);
        ctx.fillRect(0, (crop.y + crop.h) * sx, dispW, dispH - (crop.y + crop.h) * sx);
        // Crop border
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 2;
        ctx.strokeRect(crop.x * sx, crop.y * sx, crop.w * sx, crop.h * sx);
        // Corner handles
        const hs = 8;
        ctx.fillStyle = '#16a34a';
        [[crop.x, crop.y], [crop.x + crop.w, crop.y], [crop.x, crop.y + crop.h], [crop.x + crop.w, crop.y + crop.h]].forEach(([cx, cy]) => {
            ctx.fillRect(cx * sx - hs / 2, cy * sx - hs / 2, hs, hs);
        });
    }, [imgLoaded, crop]);

    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        setDragging(true);
        setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseMove = (e) => {
        if (!dragging || !imgRef.current) return;
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

    const handleZoom = (dir) => {
        setCrop(prev => {
            const factor = dir > 0 ? 0.9 : 1.1;
            const nw = Math.min(imgRef.current.width, Math.max(50, prev.w * factor));
            const nh = nw / (aspectRatio || 1);
            if (nh > imgRef.current.height) return prev;
            return {
                w: nw, h: nh,
                x: Math.max(0, Math.min(imgRef.current.width - nw, prev.x + (prev.w - nw) / 2)),
                y: Math.max(0, Math.min(imgRef.current.height - nh, prev.y + (prev.h - nh) / 2)),
            };
        });
    };

    const handleCropDone = () => {
        const out = document.createElement('canvas');
        out.width = crop.w;
        out.height = crop.h;
        out.getContext('2d').drawImage(imgRef.current, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
        out.toBlob(blob => onCrop(blob, out.toDataURL('image/jpeg', 0.95)), 'image/jpeg', 0.95);
    };

    return (
        <div className="cropper-overlay">
            <div className="cropper-modal">
                <div className="cropper-header">
                    <h3><Crop size={20} /> {title || 'Crop Image'}</h3>
                    <button className="btn btn-ghost btn-icon" onClick={onCancel}><X size={20} /></button>
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
                            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
                        />
                    )}
                </div>
                <div className="cropper-controls">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleZoom(-1)}><ZoomOut size={16} /> Zoom Out</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleZoom(1)}><ZoomIn size={16} /> Zoom In</button>
                    <span className="cropper-hint"><Move size={14} /> Drag to reposition</span>
                </div>
                <div className="cropper-actions">
                    <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleCropDone}><Crop size={16} /> Crop & Use</button>
                </div>
            </div>
        </div>
    );
}

// ─── A4 Preview Component ───
function A4Preview({ canvasRef, title, onDownload, onPrint }) {
    return (
        <div className="a4-preview-section">
            <h3>{title}</h3>
            <div className="a4-preview-wrap">
                <canvas ref={canvasRef} className="a4-preview-canvas" />
            </div>
            <div className="a4-preview-actions">
                <button className="btn btn-secondary" onClick={onDownload}><Download size={16} /> Download A4</button>
                <button className="btn btn-primary" onClick={onPrint}><Printer size={16} /> Print</button>
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
    const idA4Ref = useRef(null);
    const [idA4Ready, setIdA4Ready] = useState(false);

    // Passport photo state
    const [passportPhoto, setPassportPhoto] = useState(null);
    const [passportPreview, setPassportPreview] = useState(null);
    const [showPassportCropper, setShowPassportCropper] = useState(false);
    const [passportCropSrc, setPassportCropSrc] = useState(null);
    const [passportQty, setPassportQty] = useState(8);
    const passportA4Ref = useRef(null);
    const [passportA4Ready, setPassportA4Ready] = useState(false);

    // Submission state
    const [uploading, setUploading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const services = [
        { id: 'document', icon: FileText, title: 'Document Print', desc: 'Upload documents for printing — PDF, images, text files', color: '#3b82f6' },
        { id: 'id-card', icon: CreditCard, title: 'ID Card Print', desc: 'Upload front & back of your ID card — arranged on A4 paper', color: '#8b5cf6' },
        { id: 'passport-photo', icon: Camera, title: 'Passport Photo', desc: 'Upload portrait photo — multiple copies arranged on A4 paper', color: '#e8590c' },
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
        const url = URL.createObjectURL(file);
        setIdCropSrc(url);
        setShowIdCropper(side);
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
        setIdA4Ready(false);
    };

    // Generate A4 layout for ID card
    const generateIdA4 = useCallback(() => {
        if (!idFrontPreview) return;
        const canvas = idA4Ref.current;
        if (!canvas) return;
        canvas.width = A4_W;
        canvas.height = A4_H;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, A4_W, A4_H);

        const drawCard = (src, y) => new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                // Scale card to fit nicely (about 80% of A4 width)
                const maxW = A4_W * 0.8;
                const maxH = A4_H * 0.35;
                let dw = img.width, dh = img.height;
                if (dw > maxW) { dh = dh * (maxW / dw); dw = maxW; }
                if (dh > maxH) { dw = dw * (maxH / dh); dh = maxH; }
                const x = (A4_W - dw) / 2;
                // Draw card border
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 3;
                ctx.strokeRect(x - 4, y - 4, dw + 8, dh + 8);
                ctx.drawImage(img, x, y, dw, dh);
                // Label
                ctx.fillStyle = '#6b7280';
                ctx.font = 'bold 48px Arial';
                ctx.textAlign = 'center';
                resolve();
            };
            img.src = src;
        });

        const render = async () => {
            // Title
            ctx.fillStyle = '#111827';
            ctx.font = 'bold 64px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ID Card Print', A4_W / 2, 150);

            // Front label
            ctx.fillStyle = '#6b7280';
            ctx.font = '48px Arial';
            ctx.fillText('— Front Side —', A4_W / 2, 300);
            await drawCard(idFrontPreview, 380);

            if (idBackPreview) {
                ctx.fillStyle = '#6b7280';
                ctx.font = '48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('— Back Side —', A4_W / 2, A4_H / 2 + 200);
                await drawCard(idBackPreview, A4_H / 2 + 280);
            }

            setIdA4Ready(true);
        };
        render();
    }, [idFrontPreview, idBackPreview]);

    useEffect(() => {
        if (idFrontPreview && activeService === 'id-card') {
            setTimeout(generateIdA4, 100);
        }
    }, [idFrontPreview, idBackPreview, activeService, generateIdA4]);

    // ─── Passport Photo handlers ───
    const handlePassportUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPassportCropSrc(url);
        setShowPassportCropper(true);
    };

    const handlePassportCropDone = (blob, dataUrl) => {
        setPassportPhoto(blob);
        setPassportPreview(dataUrl);
        setShowPassportCropper(false);
        setPassportCropSrc(null);
        setPassportA4Ready(false);
    };

    // Generate A4 layout for passport photos
    const generatePassportA4 = useCallback(() => {
        if (!passportPreview) return;
        const canvas = passportA4Ref.current;
        if (!canvas) return;
        canvas.width = A4_W;
        canvas.height = A4_H;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, A4_W, A4_H);

        const img = new Image();
        img.onload = () => {
            // Passport photo size on A4 at 300 DPI: 35mm × 45mm
            const pw = PASSPORT_W;
            const ph = PASSPORT_H;
            const gap = 40;
            const marginX = (A4_W - (4 * pw + 3 * gap)) / 2;
            const marginY = 120;
            let count = 0;
            for (let row = 0; row < 6 && count < passportQty; row++) {
                for (let col = 0; col < 4 && count < passportQty; col++) {
                    const x = marginX + col * (pw + gap);
                    const y = marginY + row * (ph + gap);
                    // Cut guide
                    ctx.strokeStyle = '#d1d5db';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([8, 4]);
                    ctx.strokeRect(x, y, pw, ph);
                    ctx.setLineDash([]);
                    ctx.drawImage(img, x, y, pw, ph);
                    count++;
                }
            }
            setPassportA4Ready(true);
        };
        img.src = passportPreview;
    }, [passportPreview, passportQty]);

    useEffect(() => {
        if (passportPreview && activeService === 'passport-photo') {
            setTimeout(generatePassportA4, 100);
        }
    }, [passportPreview, passportQty, activeService, generatePassportA4]);

    // ─── Download A4 ───
    const downloadA4 = (canvasRef, filename) => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
        link.click();
    };

    // ─── Print A4 ───
    const printA4 = (canvasRef) => {
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Print</title><style>@page{size:A4;margin:0}body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh}img{width:100%;height:auto;max-height:100vh;object-fit:contain}</style></head><body><img src="${dataUrl}" onload="window.print();window.close()" /></body></html>`);
        win.document.close();
    };

    // ─── Submit print job ───
    const submitJob = async (type, files, outputCanvas) => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        setUploading(true);
        setError(null);
        try {
            // Upload files to Vercel Blob
            const uploadedUrls = [];
            for (const file of files) {
                const fileObj = file instanceof Blob ? new File([file], `${type}-${Date.now()}.jpg`, { type: 'image/jpeg' }) : file;
                const res = await uploadApi.uploadPrintFile(fileObj);
                uploadedUrls.push(res.url);
            }

            // Upload A4 output if available
            let outputUrl = null;
            if (outputCanvas?.current) {
                const blob = await new Promise(r => outputCanvas.current.toBlob(r, 'image/jpeg', 0.95));
                const outFile = new File([blob], `${type}-a4-${Date.now()}.jpg`, { type: 'image/jpeg' });
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

    // ─── Success view ───
    if (submitted) {
        return (
            <div className="print-services-page">
                <div className="container">
                    <div className="print-success animate-fade-in">
                        <div className="print-success-icon"><CheckCircle2 size={56} /></div>
                        <h2>Print Job Submitted! 🎉</h2>
                        <p>Your print job has been sent to the store. Visit us to collect and pay.</p>
                        <p className="print-success-hint">You can track your print orders in your <strong>Account</strong> page.</p>
                        <div className="print-success-actions">
                            <button className="btn btn-primary" onClick={() => { setSubmitted(false); setActiveService(null); resetAll(); }}>Submit Another</button>
                            <button className="btn btn-secondary" onClick={() => navigate('/account')}>View My Orders</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const resetAll = () => {
        setDocFiles([]); setDocCopies(1); setDocNotes('');
        setIdFront(null); setIdBack(null); setIdFrontPreview(null); setIdBackPreview(null); setIdA4Ready(false);
        setPassportPhoto(null); setPassportPreview(null); setPassportA4Ready(false);
        setError(null);
    };

    // ─── Service Selection ───
    if (!activeService) {
        return (
            <div className="print-services-page">
                <div className="container">
                    <div className="print-hero animate-fade-in">
                        <span className="print-hero-badge">🖨️ In-Store Service</span>
                        <h1>Printing <span className="highlight">Services</span></h1>
                        <p>Upload your files, we'll prepare them for printing. Pay when you collect from the store.</p>
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
                                        <Icon size={32} color="white" />
                                    </div>
                                    <h3>{svc.title}</h3>
                                    <p>{svc.desc}</p>
                                    <span className="print-service-arrow">→</span>
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
                    <button className="btn btn-ghost print-back" onClick={() => setActiveService(null)}>← Back to Services</button>
                    <div className="print-workspace animate-fade-in">
                        <div className="print-workspace-header">
                            <FileText size={28} color="#3b82f6" />
                            <h2>Document Print</h2>
                        </div>
                        <div className="upload-zone" onClick={() => document.getElementById('doc-input').click()}>
                            <Upload size={40} />
                            <p><strong>Click to upload</strong> or drag and drop</p>
                            <span>PDF, Images, Documents (max 10MB each)</span>
                            <input id="doc-input" type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleDocFileChange} hidden />
                        </div>
                        {docFiles.length > 0 && (
                            <div className="doc-file-list">
                                {docFiles.map((f, i) => (
                                    <div key={i} className="doc-file-item">
                                        <FileText size={18} />
                                        <span className="doc-file-name">{f.name}</span>
                                        <span className="doc-file-size">{(f.size / 1024).toFixed(1)} KB</span>
                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeDocFile(i)}><X size={16} /></button>
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
                                <label>Notes (optional)</label>
                                <textarea className="input" rows={2} placeholder="e.g. Color print, double-sided, specific pages..." value={docNotes} onChange={e => setDocNotes(e.target.value)} />
                            </div>
                        </div>
                        {error && <p className="print-error">{error}</p>}
                        <button
                            className="btn btn-primary btn-lg print-submit-btn"
                            disabled={docFiles.length === 0 || uploading}
                            onClick={() => submitJob('document', docFiles, null)}
                        >
                            {uploading ? <><Loader className="spin" size={18} /> Uploading...</> : <><Upload size={18} /> Submit for Printing</>}
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
                    <button className="btn btn-ghost print-back" onClick={() => setActiveService(null)}>← Back to Services</button>
                    <div className="print-workspace animate-fade-in">
                        <div className="print-workspace-header">
                            <CreditCard size={28} color="#8b5cf6" />
                            <h2>ID Card Print</h2>
                        </div>
                        <p className="print-workspace-desc">Upload front & back of your ID card. We'll arrange them on A4 paper ready to print.</p>

                        <div className="id-upload-grid">
                            <div className="id-upload-box">
                                <h4>Front Side *</h4>
                                {idFrontPreview ? (
                                    <div className="id-preview">
                                        <img src={idFrontPreview} alt="ID Front" />
                                        <button className="btn btn-ghost btn-sm id-remove" onClick={() => { setIdFront(null); setIdFrontPreview(null); setIdA4Ready(false); }}><RotateCcw size={14} /> Change</button>
                                    </div>
                                ) : (
                                    <div className="upload-zone upload-zone-sm" onClick={() => document.getElementById('id-front-input').click()}>
                                        <Upload size={28} />
                                        <p>Upload Front</p>
                                        <input id="id-front-input" type="file" accept="image/*" onChange={handleIdUpload('front')} hidden />
                                    </div>
                                )}
                            </div>
                            <div className="id-upload-box">
                                <h4>Back Side <span className="optional-tag">Optional</span></h4>
                                {idBackPreview ? (
                                    <div className="id-preview">
                                        <img src={idBackPreview} alt="ID Back" />
                                        <button className="btn btn-ghost btn-sm id-remove" onClick={() => { setIdBack(null); setIdBackPreview(null); setIdA4Ready(false); }}><RotateCcw size={14} /> Change</button>
                                    </div>
                                ) : (
                                    <div className="upload-zone upload-zone-sm" onClick={() => document.getElementById('id-back-input').click()}>
                                        <Upload size={28} />
                                        <p>Upload Back</p>
                                        <input id="id-back-input" type="file" accept="image/*" onChange={handleIdUpload('back')} hidden />
                                    </div>
                                )}
                            </div>
                        </div>

                        {idA4Ready && (
                            <A4Preview
                                canvasRef={idA4Ref}
                                title="A4 Print Preview"
                                onDownload={() => downloadA4(idA4Ref, 'id-card-a4.jpg')}
                                onPrint={() => printA4(idA4Ref)}
                            />
                        )}

                        {/* Hidden canvas for A4 generation */}
                        <canvas ref={idA4Ref} style={{ display: idA4Ready ? undefined : 'none' }} />

                        {error && <p className="print-error">{error}</p>}
                        <button
                            className="btn btn-primary btn-lg print-submit-btn"
                            disabled={!idFront || uploading}
                            onClick={() => {
                                const files = [idFront];
                                if (idBack) files.push(idBack);
                                submitJob('id-card', files, idA4Ref);
                            }}
                        >
                            {uploading ? <><Loader className="spin" size={18} /> Uploading...</> : <><Upload size={18} /> Submit for Printing</>}
                        </button>
                    </div>

                    {showIdCropper && idCropSrc && (
                        <ImageCropper
                            src={idCropSrc}
                            aspectRatio={ID_W / ID_H}
                            title={showIdCropper === 'front' ? 'Crop Front Side' : 'Crop Back Side'}
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
                    <button className="btn btn-ghost print-back" onClick={() => setActiveService(null)}>← Back to Services</button>
                    <div className="print-workspace animate-fade-in">
                        <div className="print-workspace-header">
                            <Camera size={28} color="#e8590c" />
                            <h2>Passport Photo</h2>
                        </div>
                        <p className="print-workspace-desc">Upload your portrait photo. We'll arrange multiple copies on A4 paper (35mm × 45mm standard size).</p>

                        {passportPreview ? (
                            <div className="passport-uploaded">
                                <div className="passport-preview-thumb">
                                    <img src={passportPreview} alt="Passport" />
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setPassportPhoto(null); setPassportPreview(null); setPassportA4Ready(false); }}><RotateCcw size={14} /> Change Photo</button>
                                </div>
                                <div className="print-option">
                                    <label>How many photos on A4?</label>
                                    <div className="qty-selector">
                                        {[2, 4, 6, 8, 12, 16, 24].map(n => (
                                            <button
                                                key={n}
                                                className={`qty-btn ${passportQty === n ? 'active' : ''}`}
                                                onClick={() => setPassportQty(n)}
                                            >{n}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="upload-zone" onClick={() => document.getElementById('passport-input').click()}>
                                <Camera size={40} />
                                <p><strong>Upload Portrait Photo</strong></p>
                                <span>A clear, front-facing photo works best</span>
                                <input id="passport-input" type="file" accept="image/*" onChange={handlePassportUpload} hidden />
                            </div>
                        )}

                        {passportA4Ready && (
                            <A4Preview
                                canvasRef={passportA4Ref}
                                title={`A4 Preview — ${passportQty} Photos`}
                                onDownload={() => downloadA4(passportA4Ref, 'passport-photos-a4.jpg')}
                                onPrint={() => printA4(passportA4Ref)}
                            />
                        )}

                        <canvas ref={passportA4Ref} style={{ display: passportA4Ready ? undefined : 'none' }} />

                        {error && <p className="print-error">{error}</p>}
                        <button
                            className="btn btn-primary btn-lg print-submit-btn"
                            disabled={!passportPhoto || uploading}
                            onClick={() => submitJob('passport-photo', [passportPhoto], passportA4Ref)}
                        >
                            {uploading ? <><Loader className="spin" size={18} /> Uploading...</> : <><Upload size={18} /> Submit for Printing</>}
                        </button>
                    </div>

                    {showPassportCropper && passportCropSrc && (
                        <ImageCropper
                            src={passportCropSrc}
                            aspectRatio={PASSPORT_W / PASSPORT_H}
                            title="Crop to Passport Size"
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
