import { response, request } from 'express';
import UserService from '../services/UserService.js';

const userController = {
    /**
     * POST /api/users
     */

    createUser: async (req = request,res=response) => {
        try{
            const body = req.body;

            const userService = new UserService();

            const newUser = await userService.createUser(body);

            return res.status(201).json({
                success: true,
                message: 'Usuario creado correctamente',
                data: newUser
            });
        }catch(error){
            console.log(error);
            return res.status(500).json({
                success:false,
                message: 'Error al crear usuario',
                data:null
            });
        }
    }
};

export default userController;