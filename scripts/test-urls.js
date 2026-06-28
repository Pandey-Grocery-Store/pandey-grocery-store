const urls = [
    'https://images.unsplash.com/photo-1515543904379-3d7570072921?w=400',
    'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=400',
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
    'https://images.unsplash.com/photo-1604152011153-f72b6bbfcb2c?w=400'
];

async function check() {
    for (const u of urls) {
        const r = await fetch(u, {method: 'HEAD'});
        console.log(`${u} -> ${r.ok}`);
    }
}
check();
