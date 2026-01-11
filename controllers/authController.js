import {response,request} from 'express';
import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import { generateJWT } from '../helpers/generate_jwt.js';

const login = async (req = request, res = response) => {

    const {email,password} = req.body;

    try {
        //se verifica que el email exista
        const user = await User.findOne({email});
        if (!user) {
            return res.status(400).json({
                success:false,
                message: 'Usuario o Contraseña no es correcto-email',
                data: null
            });
        }

        //se verifica si el usuario está activo (state: true)
        if (!user.state) {
            return res.status(400).json({
                success : false,
                message: 'Usuario o Contraseña no es correcto-activo',
                data: null
            });
        }

        //ahora se verifica la contraseña
        const validPassword =  await bcryptjs.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                success:false,
                message: 'Usuario o Contraseña no es correcto-contraseña',
                prueba: password,
                prueba2: user.password,
                data:null
            });
        }

        //si todo va bien se genera el token
        const token = await generateJWT(user.id,user.roles);

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                user,
                token
            }
        });



    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Error inesperado',
            data:null
        });
    }

}

export {
    login
}