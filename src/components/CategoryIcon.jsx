import { ShoppingBasket, BookOpen, Sparkles, Printer, Layers } from 'lucide-react';

export default function CategoryIcon({ slug, id, icon, size = 18, className = '', color }) {
    const key = (slug || id || icon || '').toLowerCase();

    if (key.includes('grocer') || key.includes('food') || key.includes('staple')) {
        return <ShoppingBasket size={size} className={className} color={color || 'var(--primary)'} />;
    }
    if (key.includes('station') || key.includes('office') || key.includes('book') || key.includes('school')) {
        return <BookOpen size={size} className={className} color={color || '#8b5cf6'} />;
    }
    if (key.includes('house') || key.includes('care') || key.includes('clean') || key.includes('personal')) {
        return <Sparkles size={size} className={className} color={color || '#0284c7'} />;
    }
    if (key.includes('print') || key.includes('bind') || key.includes('doc') || key.includes('photo')) {
        return <Printer size={size} className={className} color={color || '#7c3aed'} />;
    }

    return <Layers size={size} className={className} color={color || 'currentColor'} />;
}
