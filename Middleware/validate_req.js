
module.exports=(req, res,next,schema)=>{
const options = {
    abortEarly: false, // To includes all errors
    allowUnkown: false, // ignore unkown props
    stripeUnkown: false, // remove unknown props
};
const { error, value } = schema.validate(req.body, options);
if (error) {
    const { details } = error;
    // return response
    res.status(406);
    res.json({
        status: false,
        message: details.map(x => ({
            label: 'error',
            message: x.message
        }))
    });
} else {
    req.body = value;
    next();
}
}