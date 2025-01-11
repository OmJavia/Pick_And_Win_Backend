const multer = require('multer');
const path = require('path')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
       
        cb(null, path.resolve(__dirname , ".." , "public", "images"))
    },
    filename: function (req, file, cb) {
        let fileName = Date.now() + file.originalname
        req.body[file.fieldname] = fileName
        cb(null, fileName)
    }
})

//mutler File Fileter
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

let upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
})

module.exports = (name) => {
    return (req, res, next) => {

        let single = upload.single(name)
        single(req, res, (err) => {
            if (err) {
                console.log(err)
                res.json({
                    err
                })
            } else {
                next()
            }
        })

    }
}