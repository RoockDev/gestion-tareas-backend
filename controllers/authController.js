import {response, request} from 'express';
import AuthService from '../services/AuthService.js';
import UserService from '../services/UserService.js';
import { generateJWT } from '../helpers/generate_jwt.js';
import { ERROR_CODES } from '../helpers/errorCodes.js';

const authService = new AuthService();
const userService = new UserService();

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
        if (error.message === ERROR_CODES.INVALID_CREDENTIALS || error.message === ERROR_CODES.USER_INACTIVE) {
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

const register = async (req = request, res = response) => {
    
    //desestructuracion de seguridad , evitamos que el usuario mande otra cosa en el body
    const {name, email,password} = req.body;

    try {
        //aunque en el model tengamos puesto USER_ROLE por defecto , he pensado que anda si un usuario muy listo 
        //mediante tecnicas que le conducen al lado oscuro de la informática intenta introducir roles: 'ADMIN_ROLE'
        //por seguridad fuerzo que el rol sea 'USER_ROLE' y así es un candado de seguridad
        //es posible que este mal y no valga para nada(que es lo mas probale), pero en mi cabeza suena bien
        const cleanData = {
            name,
            email,
            password,
            roles: ['USER_ROLE']
        };

        const newUser = await userService.createUser(cleanData);

        //auto-login
        const token = await generateJWT(newUser.id,newUser.roles);

        return res.status(201).json({
            success: true,
            message: 'Registro completado con éxito',
            data : {
                newUser,
                token
            }
        })
    } catch (error) {
        console.log(error);
       if(error.message === ERROR_CODES.EMAIL_EXISTS){
        return res.status(400).json({
            success:false,
            message: 'El correo ya está registrado',
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

const googleSignIn = async (req,res) => {
    const {id_token} = req.body;

    try {
        const {user,token} = await authService.loginGoogle(id_token);

        return res.status(200).json({
            success:true,
            message: 'Google Sign-In exitoso',
            data: { user, token}
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            success:false,
            message: 'No se pudo verificar con google',
            data:null
        });
    }
}

export {
    login,
    register,
    googleSignIn
};