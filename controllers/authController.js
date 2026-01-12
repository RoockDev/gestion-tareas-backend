import {response, request} from 'express';
import AuthService from '../services/authService.js';

const authService = new AuthService();

const login = async (req = request, res = response) => {

    const {email, password} = req.body;

    try {
        const {user, token} = await authService.login(email,password);

        return res.status(200).json({
            success:true,
            message: 'Login exitoso',
            data: {
                user,
                token
            }
        });
    } catch (error) {
        console.log(error);

        //manejo de errores del service
        if (error.message === 'INVALID_CREDENTIALS' || error.message === 'USER_INACTIVE') {
            return res.status(400).json({
                success:false,
                message: 'Usuario o Contraseña incorrectos',
                data:null
            });
        }

        return res.status(500).json({
            success:false,
            message: 'Error inesperado',
            data:null
        });
    }

}

export {
    login
};