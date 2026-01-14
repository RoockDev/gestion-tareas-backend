import { response, request } from 'express';
import UserService from '../services/UserService.js';

const userService = new UserService();

//obtener usuarios
const getUsers = async (req = request, res = response) => {
    try {
        const users = await userService.getUsers();
        return res.status(200).json({
            success: true,
            message: '',
            data: users
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:'Error al obtener usuarios',
            data:null
        });
    }
}

/**
 * obtener usuario por id - solo admin
 * 
 */
const getUserById = async (req = request, res = response) => {
    const { id } = req.params;
    try {
        const user = await userService.getUserById(id);
        return res.status(200).json({
            success: true,
            message: '',
            data: user
        });
    } catch (error) {
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({ 
                success:false,
                message: 'Usuario no encontrado',
                data:null
             });
        }
        return res.status(500).json({ 
            success:false,
            message: 'Error al obtener el usuario',
            data:null
        });
    }
}

/**
 * 
 * updatear usuario - solo admin
 */
const updateUser = async (req = request, res = response) => {
    const { id } = req.params;
    const { _id, ...data } = req.body;

    try {
        const updatedUser = await userService.updateUser(id, data);
        return res.status(200).json({
            success: true,
            message: 'Usuario actualizado correctamente',
            data: updatedUser
        });
    } catch (error) {
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                success:false,
                message: 'Usuario no encontrado',
                data:null
            });
        }
        return res.status(500).json({
            success:false,
            message: 'Error al actualizar usuario',
            data:null
        });
    }
}

/**
 * crear usuario - solo  admin
 */
const createUser = async (req = request, res = response) => {
    try {
        
        const newUser = await userService.createUser(req.body);

        return res.status(201).json({
            success: true,
            message: 'Usuario creado por Admin',
            data: newUser
        });

    } catch (error) {
        
        if (error.message === 'EMAIL_EXISTS') {
             return res.status(400).json({ 
                success:false,
                message: 'El correo ya está registrado',
                data:null
             });
        }
        return res.status(500).json({
            success:false,
             message: 'Error al crear usuario' ,
             data:null
            });
    }
}

/**
 * deletear usuario soft delete
 */
const deleteUser = async (req = request, res = response) => {
    const { id } = req.params;
    try {
        await userService.deleteUser(id);
        return res.status(200).json({
             success: true,
              message: 'Usuario deshabilitado',
            data:null
         });
    } catch (error) {
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                success:false,
                 message: 'Usuario no encontrado' ,
                 data:null
                });
        }
        return res.status(500).json({ 
            success:false,
            message: 'Error al eliminar',
            data:null
         });
    }
}


export {
    getUsers,
    createUser,
    deleteUser,
    getUserById,
    updateUser
}