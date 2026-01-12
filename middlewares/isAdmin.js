import {response, request} from 'express';

const isAdmin = (req = request, res = response, next) => {
    /**
     * validacion de seguridad
     * este middleware siempre tiene ejecutarse despues de validateJWT
     * esto evita que el servidor pete si nos equivocamos con el orden de las rutas
     */
    if (!req.user) {
        return res.status(500).json({
            success:false,
            message:'se esta intentando verificar el role sin validar el token primero',
            data:null
        });
    }

   
    const {roles,name} = req.user;

     /**
     * Ponemos el .includes porque en el modelo el usuer tiene una array de roles
     */

     if (!roles.includes('ADMIN_ROLE')) {
        return res.status(403).json({
            success:false,
            message: `${name} no es administrados - no tiene permisos`, //mensaje para desarrollo debug  por si hay fallas
            data:null
        });
     }

     next();

}

export {
    isAdmin
}