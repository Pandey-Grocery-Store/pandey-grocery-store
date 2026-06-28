const urls = [
    'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200',
    'https://images.unsplash.com/photo-1531346878377-a541e4a115fc?w=400',
    'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400',
    'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
    'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400',
    'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400',
    'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400',
    'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=400',
    'https://images.unsplash.com/photo-1615397323145-6bece9099cbf?w=400'
];

async function check() {
    for (const u of urls) {
        const r = await fetch(u, {method: 'HEAD'});
        console.log(`${u} -> ${r.ok}`);
    }
}
check();
