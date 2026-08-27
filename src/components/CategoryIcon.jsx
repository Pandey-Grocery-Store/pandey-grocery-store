import { ShoppingBasket, BookOpen, Sparkles, Printer, Layers } from 'lucide-react';

export default function CategoryIcon({ slug, id, icon, size = 18, className = '', color }) {
    const key = (slug || id || icon || '').toLowerCase();

    if (key.includes('grocer') || key === '🛒') {
        return <ShoppingBasket size={size} className={className} color={color || 'var(--primary)'} />;
    }
    if (key.includes('station') || key === '📚') {
        return <BookOpen size={size} className={className} color={color || '#8b5cf6'} />;
    }
    if (key.includes('house') || key.includes('care') || key === '🧼') {
        return <Sparkles size={size} className={className} color={color || '#0284c7'} />;
    }
    if (key.includes('print') || key === '🖨️') {
        return <Printer size={size} className={className} color={color || '#7c3aed'} />;
    }

    return <Layers size={size} className={className} color={color || 'currentColor'} />;
}
