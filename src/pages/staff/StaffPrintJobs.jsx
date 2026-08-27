import { useState, useEffect, useCallback } from 'react';
import { printJobsApi, uploadApi } from '../../lib/api';
import {
    Printer,
    FileText,
    CreditCard,
    Camera,
    Search,
    RefreshCw,
    CheckCircle2,
    Clock,
    XCircle,
    Eye,
    Download,
    Phone,
    MessageSquare,
    Mail,
    Plus,
    X,
    Filter,
    Calendar,
    IndianRupee,
    Trash2,
    Layers,
    User,
    Check,
    Loader,
    ChevronDown,
    ChevronUp,
    ExternalLink
} from 'lucide-react';
import './StaffPrintJobs.css';

const statusConfig = {
    pending: { label: 'Pending Review', color: '#eab308', bg: '#fef9c3', icon: Clock },
    paid: { label: 'Payment Confirmed', color: '#0284c7', bg: '#e0f2fe', icon: CreditCard },
    printing: { label: 'Printing in Progress', color: '#8b5cf6', bg: '#f3e8ff', icon: Printer },
    done: { label: 'Completed & Ready', color: '#16a34a', bg: '#dcfce7', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#fee2e2', icon: XCircle },
};

const serviceTypes = {
    document: { label: 'A4 Document / Xerox', icon: FileText, color: '#0284c7', bg: '#e0f2fe' },
    'id-card': { label: 'Smart PVC ID Card', icon: CreditCard, color: '#8b5cf6', bg: '#f3e8ff' },
    'passport-photo': { label: 'Passport Photo Sheet', icon: Camera, color: '#d97706', bg: '#fef3c7' },
};

export default function StaffPrintJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    
    // Quick Preview Modal
    const [previewItem, setPreviewItem] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    
    // Quick Edit Price
    const [editingPriceId, setEditingPriceId] = useState(null);
    const [tempPrice, setTempPrice] = useState('');

    // Walk-in Counter Print Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createType, setCreateType] = useState('document');
    const [createCopies, setCreateCopies] = useState(1);
    const [createPrice, setCreatePrice] = useState(10);
    const [createNotes, setCreateNotes] = useState('');
    const [createCustName, setCreateCustName] = useState('');
    const [createCustPhone, setCreateCustPhone] = useState('');
    const [createCustEmail, setCreateCustEmail] = useState('');
    const [createFiles, setCreateFiles] = useState([]);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await printJobsApi.getAll();
            if (res?.jobs) {
                setJobs(res.jobs);
            }
        } catch (err) {
            console.error('Failed to load print jobs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Update Status
    const handleStatusChange = async (jobId, newStatus) => {
        setUpdatingId(jobId);
        try {
            const res = await printJobsApi.updateStatus(jobId, newStatus);
            if (res?.job) {
                setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, ...res.job } : j)));
            }
        } catch (err) {
            alert(err.message || 'Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    // Update Price
    const handleSavePrice = async (jobId) => {
        const val = parseFloat(tempPrice);
        if (isNaN(val) || val < 0) return;
        setUpdatingId(jobId);
        try {
            const currentJob = jobs.find(j => j.id === jobId);
            const res = await printJobsApi.updateStatus(jobId, currentJob.status, val);
            if (res?.job) {
                setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, price: val } : j)));
            }
            setEditingPriceId(null);
        } catch (err) {
            alert(err.message || 'Failed to update price');
        } finally {
            setUpdatingId(null);
        }
    };

    // Delete Job
    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Are you sure you want to delete this print job?')) return;
        try {
            await printJobsApi.delete(jobId);
            setJobs(prev => prev.filter(j => j.id !== jobId));
        } catch (err) {
            alert(err.message || 'Failed to delete job');
        }
    };

    // Trigger Native Browser Print Dialog for Direct Output
    const handlePrintDirect = (url, title = 'Print Document') => {
        if (!url) return;
        const win = window.open('', '_blank');
        if (!win) {
            window.open(url, '_blank');
            return;
        }
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title} - Pandey Print Hub</title>
                <style>
                    @page { size: auto; margin: 0mm; }
                    body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #fff; }
                    img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
                    iframe { width: 100vw; height: 100vh; border: none; }
                </style>
            </head>
            <body>
                ${url.toLowerCase().endsWith('.pdf') 
                    ? `<iframe src="${url}" onload="window.print()"></iframe>`
                    : `<img src="${url}" onload="window.print();" />`
                }
            </body>
            </html>
        `);
        win.document.close();
    };

    // Force Native File Download for Cross-Origin / Blob / Data URLs
    const handleDownloadFile = async (url, filename = 'print-document') => {
        if (!url) return;
        try {
            if (url.startsWith('data:') || url.startsWith('blob:')) {
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                return;
            }

            // Fetch cross-origin URL as Blob to bypass browser download attribute restrictions
            const response = await fetch(url, { mode: 'cors' });
            if (!response.ok) throw new Error('Network response failed');
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;

            let ext = '.jpg';
            if (url.toLowerCase().includes('.pdf') || blob.type === 'application/pdf') ext = '.pdf';
            else if (url.toLowerCase().includes('.png') || blob.type === 'image/png') ext = '.png';
            else if (url.toLowerCase().includes('.jpeg') || url.toLowerCase().includes('.jpg')) ext = '.jpg';

            const cleanName = filename.endsWith(ext) ? filename : `${filename}${ext}`;
            a.download = cleanName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.warn('Direct blob download fallback:', err);
            // Fallback: Open URL directly or trigger download anchor
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noreferrer';
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    // Handle Walk-in Counter Print Job Submit
    const handleCreateCounterJob = async (e) => {
        e.preventDefault();
        setCreateError('');
        if (!createFiles.length) {
            setCreateError('Please select at least one file or photo.');
            return;
        }

        setCreating(true);
        try {
            const uploadedUrls = [];
            for (const file of createFiles) {
                const res = await uploadApi.uploadPrintFile(file);
                uploadedUrls.push(res.url);
            }

            const payload = {
                type: createType,
                fileUrls: uploadedUrls,
                outputUrl: uploadedUrls[0] || null,
                quantity: parseInt(createCopies) || 1,
                price: parseFloat(createPrice) || 0,
                notes: `[Walk-in Counter] ${createCustName ? `Customer: ${createCustName}` : ''} ${createCustPhone ? `Phone: ${createCustPhone}` : ''} ${createNotes ? `| Note: ${createNotes}` : ''}`.trim(),
            };

            await printJobsApi.create(payload);
            setShowCreateModal(false);
            setCreateFiles([]);
            setCreateCustName('');
            setCreateCustPhone('');
            setCreateCustEmail('');
            setCreateNotes('');
            fetchJobs();
        } catch (err) {
            setCreateError(err.message || 'Failed to create counter print job.');
        } finally {
            setCreating(false);
        }
    };

    // Filtered Jobs
    const filteredJobs = jobs.filter(job => {
        const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
        const matchesType = typeFilter === 'all' || job.type === typeFilter;
        
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
            job.jobNumber?.toLowerCase().includes(q) ||
            job.user?.name?.toLowerCase().includes(q) ||
            job.user?.phone?.toLowerCase().includes(q) ||
            job.user?.email?.toLowerCase().includes(q) ||
            job.notes?.toLowerCase().includes(q);

        return matchesStatus && matchesType && matchesSearch;
    });

    // KPI Metrics
    const totalJobsCount = jobs.length;
    const pendingJobsCount = jobs.filter(j => j.status === 'pending').length;
    const printingJobsCount = jobs.filter(j => j.status === 'printing').length;
    const completedJobsCount = jobs.filter(j => j.status === 'done').length;
    const totalRevenue = jobs
        .filter(j => j.status === 'done' || j.status === 'paid')
        .reduce((sum, j) => sum + (j.price || 0), 0);

    return (
        <div className="staff-print-page animate-fade-in">
            {/* Header */}
            <div className="print-header-card">
                <div className="print-header-left">
                    <div className="print-header-icon-box">
                        <Printer size={28} />
                    </div>
                    <div>
                        <h1 className="print-header-title">Store Print Hub &amp; Document Queue</h1>
                        <p className="print-header-sub">
                            Manage online xerox, PDF printouts, Smart PVC ID cards, and Passport photo requests
                        </p>
                    </div>
                </div>

                <div className="print-header-actions">
                    <button className="btn btn-secondary btn-sm" onClick={fetchJobs} title="Refresh print queue">
                        <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
                        <Plus size={16} /> + New Counter Print Job
                    </button>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="print-kpi-grid">
                <div className="print-kpi-card">
                    <div className="kpi-icon-wrap all">
                        <Layers size={20} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Total Print Orders</span>
                        <h3 className="kpi-value">{totalJobsCount}</h3>
                    </div>
                </div>

                <div className="print-kpi-card">
                    <div className="kpi-icon-wrap pending">
                        <Clock size={20} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Pending Review</span>
                        <h3 className="kpi-value" style={{ color: '#eab308' }}>{pendingJobsCount}</h3>
                    </div>
                </div>

                <div className="print-kpi-card">
                    <div className="kpi-icon-wrap printing">
                        <Printer size={20} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">In Printing Queue</span>
                        <h3 className="kpi-value" style={{ color: '#8b5cf6' }}>{printingJobsCount}</h3>
                    </div>
                </div>

                <div className="print-kpi-card">
                    <div className="kpi-icon-wrap done">
                        <CheckCircle2 size={20} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Ready / Completed</span>
                        <h3 className="kpi-value" style={{ color: '#16a34a' }}>{completedJobsCount}</h3>
                    </div>
                </div>

                <div className="print-kpi-card revenue">
                    <div className="kpi-icon-wrap revenue">
                        <IndianRupee size={20} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Print Revenue</span>
                        <h3 className="kpi-value" style={{ color: '#059669' }}>₹{totalRevenue.toFixed(2)}</h3>
                    </div>
                </div>
            </div>

            {/* Controls & Filter Bar */}
            <div className="print-controls-card">
                {/* Search Bar */}
                <div className="print-search-box">
                    <Search size={16} className="print-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by customer name, phone, job #PRT..., or notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Service Type Filter Tabs */}
                <div className="service-filter-row">
                    <button
                        className={`filter-chip ${typeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setTypeFilter('all')}
                    >
                        <Layers size={13} /> All Types ({jobs.length})
                    </button>
                    <button
                        className={`filter-chip ${typeFilter === 'document' ? 'active' : ''}`}
                        onClick={() => setTypeFilter('document')}
                    >
                        <FileText size={13} /> A4 Documents
                    </button>
                    <button
                        className={`filter-chip ${typeFilter === 'id-card' ? 'active' : ''}`}
                        onClick={() => setTypeFilter('id-card')}
                    >
                        <CreditCard size={13} /> PVC Smart ID
                    </button>
                    <button
                        className={`filter-chip ${typeFilter === 'passport-photo' ? 'active' : ''}`}
                        onClick={() => setTypeFilter('passport-photo')}
                    >
                        <Camera size={13} /> Passport Photos
                    </button>
                </div>

                {/* Status Filter Tabs */}
                <div className="status-filter-row">
                    {['all', 'pending', 'paid', 'printing', 'done', 'cancelled'].map(st => {
                        const count = st === 'all' ? jobs.length : jobs.filter(j => j.status === st).length;
                        return (
                            <button
                                key={st}
                                className={`status-chip ${st} ${statusFilter === st ? 'active' : ''}`}
                                onClick={() => setStatusFilter(st)}
                            >
                                {st.toUpperCase()} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Print Jobs Feed */}
            {loading ? (
                <div className="print-loading-state">
                    <Loader size={32} className="spin" />
                    <p>Loading Print Hub Orders...</p>
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="print-empty-state">
                    <Printer size={48} className="empty-icon" />
                    <h3>No print orders found</h3>
                    <p>There are no print jobs matching the selected filters.</p>
                </div>
            ) : (
                <div className="print-jobs-grid">
                    {filteredJobs.map((job) => {
                        const st = statusConfig[job.status] || statusConfig.pending;
                        const sType = serviceTypes[job.type] || serviceTypes.document;
                        const STypeIcon = sType.icon;
                        const StatusIcon = st.icon;
                        const isUpdating = updatingId === job.id;
                        const isEditingPrice = editingPriceId === job.id;
                        
                        const customerName = job.user?.name || 'Walk-in Customer';
                        const customerPhone = job.user?.phone || '';
                        const customerEmail = job.user?.email || '';
                        const cleanPhone = customerPhone.replace(/[^0-9]/g, '');

                        const fileList = Array.isArray(job.fileUrls) ? job.fileUrls : [];
                        const primaryFile = job.outputUrl || fileList[0];

                        return (
                            <div key={job.id} className={`print-job-card ${job.status}`}>
                                {/* Card Top Row */}
                                <div className="pjc-top-row">
                                    <div className="pjc-job-num-wrap">
                                        <span className="pjc-job-num">#{job.jobNumber || job.id.slice(-6)}</span>
                                        <span className="pjc-time">
                                            <Calendar size={11} /> {new Date(job.createdAt).toLocaleString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    {/* Service Badge */}
                                    <div className="pjc-service-badge" style={{ color: sType.color, background: sType.bg }}>
                                        <STypeIcon size={13} />
                                        <span>{sType.label}</span>
                                    </div>
                                </div>

                                {/* Customer Info Row */}
                                <div className="pjc-customer-row">
                                    <div className="pjc-cust-info">
                                        <div className="pjc-avatar">
                                            <User size={15} />
                                        </div>
                                        <div>
                                            <strong className="pjc-cust-name">{customerName}</strong>
                                            {customerPhone && <span className="pjc-cust-phone">{customerPhone}</span>}
                                            {customerEmail && !customerEmail.includes('@pandeygrocery.local') && (
                                                <span className="pjc-cust-email">{customerEmail}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Customer Action Buttons */}
                                    <div className="pjc-cust-actions">
                                        {cleanPhone && (
                                            <>
                                                <a
                                                    href={`https://wa.me/91${cleanPhone}?text=Namaste%20${encodeURIComponent(customerName)},%20regarding%20your%20Print%20Order%20%23${job.jobNumber}%20at%20Pandey%20Grocery%20Store...`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn-icon-link whatsapp"
                                                    title="Chat with Customer on WhatsApp"
                                                >
                                                    <MessageSquare size={14} />
                                                </a>
                                                <a
                                                    href={`tel:${cleanPhone}`}
                                                    className="btn-icon-link call"
                                                    title="Call Customer"
                                                >
                                                    <Phone size={14} />
                                                </a>
                                            </>
                                        )}
                                        <button
                                            className="btn-icon-link delete"
                                            onClick={() => handleDeleteJob(job.id)}
                                            title="Delete / Dismiss Job"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Notes / Print Instructions */}
                                {job.notes && (
                                    <div className="pjc-notes-box">
                                        <strong>Specs / Notes:</strong> {job.notes}
                                    </div>
                                )}

                                {/* Attached Files & A4 Outputs Preview Carousel */}
                                <div className="pjc-files-section">
                                    <div className="pjc-files-header">
                                        <span>Attached Documents ({fileList.length + (job.outputUrl ? 1 : 0)} files):</span>
                                        <span className="copies-tag">Copies: {job.quantity || 1}</span>
                                    </div>

                                    <div className="pjc-files-grid">
                                        {job.outputUrl && (
                                            <div className="file-preview-card output" onClick={() => setPreviewItem({ url: job.outputUrl, name: `${job.jobNumber}-A4-Sheet.jpg`, job })}>
                                                <div className="preview-tag">A4 Sheet Layout</div>
                                                <img src={job.outputUrl} alt="A4 Layout" className="thumb-img" />
                                                <div className="file-overlay">
                                                    <Eye size={16} />
                                                </div>
                                            </div>
                                        )}

                                        {fileList.map((fileUrl, idx) => {
                                            const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
                                            return (
                                                <div
                                                    key={idx}
                                                    className="file-preview-card"
                                                    onClick={() => setPreviewItem({ url: fileUrl, name: `Source File ${idx + 1}`, job })}
                                                >
                                                    {isPdf ? (
                                                        <div className="pdf-thumb-box">
                                                            <FileText size={24} color="#dc2626" />
                                                            <span>PDF Document</span>
                                                        </div>
                                                    ) : (
                                                        <img src={fileUrl} alt={`Upload ${idx}`} className="thumb-img" />
                                                    )}
                                                    <div className="file-overlay">
                                                        <Eye size={16} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Direct Print & Action Toolstrip */}
                                <div className="pjc-print-toolstrip">
                                    {primaryFile && (
                                        <>
                                            <button
                                                className="btn btn-primary btn-sm direct-print-btn"
                                                onClick={() => handlePrintDirect(primaryFile, `Order #${job.jobNumber}`)}
                                            >
                                                <Printer size={15} /> Print Now
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleDownloadFile(primaryFile, `Order-${job.jobNumber}-Document`)}
                                                title="Download file to computer / phone"
                                            >
                                                <Download size={14} /> Download File
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Bottom Row: Price + Status Transitions */}
                                <div className="pjc-bottom-row">
                                    {/* Price & Billing */}
                                    <div className="pjc-price-block">
                                        <span className="price-label">Job Amount:</span>
                                        {isEditingPrice ? (
                                            <div className="inline-price-edit">
                                                <span>₹</span>
                                                <input
                                                    type="number"
                                                    value={tempPrice}
                                                    onChange={e => setTempPrice(e.target.value)}
                                                    autoFocus
                                                    className="price-input"
                                                />
                                                <button className="btn-icon-check" onClick={() => handleSavePrice(job.id)}>
                                                    <Check size={14} />
                                                </button>
                                                <button className="btn-icon-cancel" onClick={() => setEditingPriceId(null)}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="price-display-wrap" onClick={() => { setEditingPriceId(job.id); setTempPrice(job.price || 0); }}>
                                                <strong className="pjc-price-val">₹{(job.price || 0).toFixed(2)}</strong>
                                                <span className="edit-hint">✏️ Edit</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Status Selector */}
                                    <div className="pjc-status-action-wrap">
                                        <span className="status-label">Status:</span>
                                        <select
                                            className="pjc-status-select"
                                            value={job.status}
                                            disabled={isUpdating}
                                            onChange={(e) => handleStatusChange(job.id, e.target.value)}
                                            style={{ color: st.color, backgroundColor: st.bg }}
                                        >
                                            <option value="pending">⏳ Pending Review</option>
                                            <option value="paid">💳 Payment Done</option>
                                            <option value="printing">🖨️ Printing</option>
                                            <option value="done">✅ Ready / Done</option>
                                            <option value="cancelled">❌ Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Quick Preview & Fullscreen Print Modal */}
            {previewItem && (
                <div className="modal-overlay animate-fade-in" onClick={() => setPreviewItem(null)}>
                    <div className="print-preview-modal animate-scale-up" onClick={e => e.stopPropagation()}>
                        <div className="preview-modal-header">
                            <div className="preview-modal-title">
                                <FileText size={18} />
                                <h3>{previewItem.name} — Order #{previewItem.job?.jobNumber}</h3>
                            </div>
                            <div className="preview-modal-actions">
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handlePrintDirect(previewItem.url, previewItem.name)}
                                >
                                    <Printer size={15} /> Print Document
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleDownloadFile(previewItem.url, previewItem.name)}
                                    title="Download file to computer / phone"
                                >
                                    <Download size={14} /> Download
                                </button>
                                <button className="btn-close" onClick={() => setPreviewItem(null)}>
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="preview-modal-body">
                            {previewItem.url.toLowerCase().endsWith('.pdf') ? (
                                <iframe src={previewItem.url} title="Document Preview" className="pdf-frame" />
                            ) : (
                                <img src={previewItem.url} alt="Full Preview" className="full-preview-img" />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* + Create Walk-in Counter Print Job Modal */}
            {showCreateModal && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowCreateModal(false)}>
                    <div className="create-print-modal animate-scale-up" onClick={e => e.stopPropagation()}>
                        <div className="create-modal-header">
                            <div className="cm-title-wrap">
                                <Printer size={20} />
                                <h3>+ Create Walk-in Counter Print Job</h3>
                            </div>
                            <button className="btn-close" onClick={() => setShowCreateModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCounterJob} className="create-modal-form">
                            {createError && (
                                <div className="create-error-banner">
                                    <XCircle size={15} /> {createError}
                                </div>
                            )}

                            {/* Service Type Selector */}
                            <div className="form-group">
                                <label className="form-label">Service Type</label>
                                <div className="service-type-grid">
                                    <button
                                        type="button"
                                        className={`st-choice-btn ${createType === 'document' ? 'active' : ''}`}
                                        onClick={() => setCreateType('document')}
                                    >
                                        <FileText size={18} />
                                        <span>A4 Document / Xerox</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`st-choice-btn ${createType === 'id-card' ? 'active' : ''}`}
                                        onClick={() => setCreateType('id-card')}
                                    >
                                        <CreditCard size={18} />
                                        <span>PVC Smart ID</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`st-choice-btn ${createType === 'passport-photo' ? 'active' : ''}`}
                                        onClick={() => setCreateType('passport-photo')}
                                    >
                                        <Camera size={18} />
                                        <span>Passport Photos</span>
                                    </button>
                                </div>
                            </div>

                            {/* Customer Details */}
                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Customer Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g. Ramesh Kumar"
                                        value={createCustName}
                                        onChange={e => setCreateCustName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone (WhatsApp)</label>
                                    <input
                                        type="tel"
                                        className="input"
                                        placeholder="e.g. 7906966085"
                                        value={createCustPhone}
                                        onChange={e => setCreateCustPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Copies & Price */}
                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Quantity / Copies</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="input"
                                        value={createCopies}
                                        onChange={e => setCreateCopies(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Bill Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        className="input"
                                        value={createPrice}
                                        onChange={e => setCreatePrice(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* File Upload Box */}
                            <div className="form-group">
                                <label className="form-label">Select Document / Photos (PDF, JPG, PNG)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf,image/*"
                                    className="input file-input"
                                    onChange={e => setCreateFiles(Array.from(e.target.files || []))}
                                    required
                                />
                                {createFiles.length > 0 && (
                                    <span className="file-count-tag">
                                        ✓ {createFiles.length} file(s) selected ({createFiles.map(f => f.name).join(', ')})
                                    </span>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="form-group">
                                <label className="form-label">Print Instructions / Notes</label>
                                <textarea
                                    className="input textarea"
                                    rows="2"
                                    placeholder="e.g. B/W 2-sided print, Glossy paper, Lamination required..."
                                    value={createNotes}
                                    onChange={e => setCreateNotes(e.target.value)}
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="create-modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? <Loader size={16} className="spin" /> : <Printer size={16} />}
                                    {creating ? 'Uploading & Creating...' : 'Queue Print Order'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
