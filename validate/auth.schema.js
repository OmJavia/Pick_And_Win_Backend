const Joi = require("joi");
const validateRequest=require("../Middleware/validate_req.js")

module.exports = {
    login,updateProductbyid
};

function login(req, res, next) {
    const schema = Joi.object()
        .keys({
            // search: Joi.string().allow(null, '').required()
            email: Joi.string().email().required(),
            password: Joi.string().required()
        });
        validateRequest(req, res, next,schema)
   
}
function updateProductbyid(req, res, next) {
    const schema = Joi.object()
        .keys({
            name: Joi.string().required(),
            price: Joi.number().required(),
            ticket_price: Joi.number().required(),
            ticket_quantity: Joi.number().required(),
            draw_date: Joi.date().iso().required()
        });
        validateRequest(req, res, next,schema)
   
}