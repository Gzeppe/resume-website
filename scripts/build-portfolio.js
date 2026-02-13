const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PORTFOLIO_DIR = path.join(__dirname, '..', 'Portfolio', 'websites');
const OUTPUT_JSON = path.join(__dirname, '..', 'projects.json');
const THUMB_WIDTH = 800;
const THUMB_QUALITY = 80;
const DISPLAY_WIDTH = 1400;
const DISPLAY_QUALITY = 85;
const CENTER_CROP_RATIO = 0.72; // Keep center 72% of width
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const SKIP_FOLDERS = ['resume'];

// Map folder names to their live URLs
const LIVE_URLS = {
    'innovativemsg': 'https://innovativemsg.com/',
    'precise building and remodeling': 'http://www.precisebuildingremodeling.com/',
    'some like it hot power yoga': 'https://somelikeithotpoweryoga.com/'
};

function prettifyName(folderName) {
    return folderName
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// Crop the center portion of an image width-wise
function centerCropExtract(width, height) {
    const cropWidth = Math.round(width * CENTER_CROP_RATIO);
    const left = Math.round((width - cropWidth) / 2);
    return { left, top: 0, width: cropWidth, height };
}

async function processProject(folderName) {
    const folderPath = path.join(PORTFOLIO_DIR, folderName);
    const thumbsDir = path.join(folderPath, 'thumbs');
    const displayDir = path.join(folderPath, 'display');

    if (!fs.existsSync(thumbsDir)) {
        fs.mkdirSync(thumbsDir, { recursive: true });
    }
    if (!fs.existsSync(displayDir)) {
        fs.mkdirSync(displayDir, { recursive: true });
    }

    const allFiles = fs.readdirSync(folderPath);
    const images = allFiles.filter(f => {
        const ext = path.extname(f).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext) && !f.startsWith('.');
    });

    // Sort homepage images first
    images.sort((a, b) => {
        const aHome = a.toLowerCase().includes('homepage') ? -1 : 0;
        const bHome = b.toLowerCase().includes('homepage') ? -1 : 0;
        return aHome - bHome;
    });

    const encodedFolder = encodeURIComponent(folderName);
    const thumbPaths = [];
    const displayPaths = [];

    for (const img of images) {
        const srcPath = path.join(folderPath, img);
        const baseName = path.parse(img).name;
        const thumbName = baseName + '.jpg';
        const displayName = baseName + '.jpg';
        const thumbPath = path.join(thumbsDir, thumbName);
        const displayPath = path.join(displayDir, displayName);

        const srcStat = fs.statSync(srcPath);
        const meta = await sharp(srcPath).metadata();
        const crop = centerCropExtract(meta.width, meta.height);

        // Regenerate thumbnail if source is newer
        const thumbExists = fs.existsSync(thumbPath);
        if (!thumbExists || srcStat.mtimeMs > fs.statSync(thumbPath).mtimeMs) {
            await sharp(srcPath)
                .extract(crop)
                .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
                .jpeg({ quality: THUMB_QUALITY })
                .toFile(thumbPath);
            console.log(`  Thumbnail: ${thumbName}`);
        }

        // Regenerate display image if source is newer
        const displayExists = fs.existsSync(displayPath);
        if (!displayExists || srcStat.mtimeMs > fs.statSync(displayPath).mtimeMs) {
            await sharp(srcPath)
                .extract(crop)
                .resize({ width: DISPLAY_WIDTH, withoutEnlargement: true })
                .jpeg({ quality: DISPLAY_QUALITY })
                .toFile(displayPath);
            console.log(`  Display:   ${displayName}`);
        }

        const encodedThumb = encodeURIComponent(thumbName);
        const encodedDisplay = encodeURIComponent(displayName);
        thumbPaths.push(`Portfolio/websites/${encodedFolder}/thumbs/${encodedThumb}`);
        displayPaths.push(`Portfolio/websites/${encodedFolder}/display/${encodedDisplay}`);
    }

    return {
        id: folderName.toLowerCase().replace(/\s+/g, '-'),
        name: prettifyName(folderName),
        folder: folderName,
        description: '',
        techStack: [],
        liveUrl: LIVE_URLS[folderName] || '',
        githubUrl: '',
        thumbnails: thumbPaths,
        images: displayPaths,
        imageCount: images.length
    };
}

async function main() {
    console.log('Building portfolio manifest...');

    if (!fs.existsSync(PORTFOLIO_DIR)) {
        console.error(`Portfolio directory not found: ${PORTFOLIO_DIR}`);
        process.exit(1);
    }

    const folders = fs.readdirSync(PORTFOLIO_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name !== 'thumbs' && d.name !== 'display' && !SKIP_FOLDERS.includes(d.name))
        .map(d => d.name);

    const projects = [];
    for (const folder of folders) {
        console.log(`Processing: ${folder}`);
        projects.push(await processProject(folder));
    }

    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(projects, null, 2));
    console.log(`\nWrote ${OUTPUT_JSON} with ${projects.length} projects.`);
}

main().catch(err => { console.error(err); process.exit(1); });
