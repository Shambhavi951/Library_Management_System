export function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: error.details.map((d) => d.message).join(', ') }
      });
    }
    req[property] = value;
    next();
  };
}

