import 'dotenv/config';
import {response, request } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const validateJWT = async (req = request, res = response, next) => {
    //leer el token del header, se usa el nombre 'x-token' en los headers
    const token = req.header('x-token');

    if (!token) {
        return res.status(401).json({
            success:false,
            message: 'No hay token en la petición',
            data:null
        });
    }

    try {
        const {uid} = jwt.verify(token, process.env.SECRET_KEY);

        const user = await User.findOne({id: uid});
        

        // si el usuario no existe en bbdd
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'token no valido usuario no existe en bbdd', //mensajes para desarrollo para capturar errores
                data: null
            });
        }

        // Si el usuario fue borrado (state: false)
        if (!user.state) {
            return res.status(401).json({
                success: false,
                message: 'token no valido usuario con estado false',
                data: null
            });
        }

        //se añade el usuario a la req y el controlador se puede hacer req.user y saber quien es
        req.user = user;

        next();

    } catch (error) {
        console.log(error);
        res.status(401).json({
            success: false,
            message: 'Token no válido',
            data: null
        });
    }
}

//version GraphQl
const validarJWT_GQL = async (context) => {
    const token = context.req.headers['x-token'];

    if (!token) {
        console.log("❌ Error: No ha llegado ningún token");
        throw new Error("No hay token en la solicitud.");
    }

    try {
        
        const { uid } = jwt.verify(token, process.env.SECRET_KEY);
        console.log("3. Token verificado. UID:", uid);
        const user = await User.findOne({id:uid});

        if (!user) throw new Error("Usuario no existe.");
        console.log("❌ Error: Usuario no encontrado en DB");
        if (!user.state) throw new Error("Usuario inhabilitado.");
        console.log("❌ Error: Usuario inactivo");

        console.log("✅ ÉXITO: Usuario encontrado:", user.name);
        context.user = user; 
        
    } catch (error) {
        console.log("❌ Error al verificar token:", error.message);
        throw new Error("Token no válido.");
    }

    return context; 
};
export {
    validateJWT,
    validarJWT_GQL
}