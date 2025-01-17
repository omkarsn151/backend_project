// import multer from 'multer';
// import path from 'path';

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './public/temp');
//     },
//     filename: function (req, file, cb) {
//         // cb(null, Date.now() + '-' + file.originalname);
//         cb(null, file.originalname);
//     }
// });

// export const upload = multer({ storage })





import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Define the temporary storage path
const tempDir = path.join('./', 'public/', 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir);  // Save to the temp directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);  // Using the original file name
    }
});

// Multer upload setup
export const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        // const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);  // Accept the file
    }
});
