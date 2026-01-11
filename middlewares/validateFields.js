import {response, request} from 'express';
import {validationResult} from 'express-validator';

const validateFields = (req,res,next) => {
    //validationResult extrae los errores acumulados por los check de la ruta
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({
            success: false,
            message: 'Error en la validacion de campos',
            data: errors.mapped() //devuelve un objeto con los errores por campo
        });
    }

    //si no hay errores pasamos al siguiente level
    next();
}

export {
    validateFields
};