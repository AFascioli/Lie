const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, "aca_va_el_secreto_que_es_una_string_larga");
    next();
  } catch (error) {
    return res.status(200).json({
      message: "Autenticación fallida",
      exito: false
    });
  }
};
