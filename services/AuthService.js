import bcryptjs from "bcryptjs";
import User from '../models/User.js';
import { generateJWT } from "../helpers/generate_jwt.js";
import { ERROR_CODES } from "../helpers/errorCodes.js";
import { googleVerify } from "../helpers/google-verify.js";
import { v4 as uuidv4} from 'uuid';
import crypto from 'crypto'; 

class AuthService {
    async login(email,password){
        try {
            const user = await User.findOne({email});
            if (!user) {
                throw new Error(ERROR_CODES.INVALID_CREDENTIALS);
            }

            if (user.google) {
                throw new Error('Esta cuenta debe iniciarse con el boton de google');
            }

            if (!user.state) {
                throw new Error();
                
            }

            const validPassword = await bcryptjs.compare(password, user.password);
            if (!user.state) {
                throw new Error('INVALID_CREDENTIALS');
            }

            const token = await generateJWT(user.id, user.roles);

            return {user, token};

        } catch (error) {
            throw error;
        }
    }

    async loginGoogle(id_token){
        try {
            const {nombre,correo,img} = await googleVerify(id_token);

            let user = await User.findOne({email:correo});

            if (!user) {
                const data = {
                    id: uuidv4(),
                    name:nombre,
                    email:correo,
                    password: crypto.randomBytes(16).toString('hex') + 'Aa1!',
                    img,
                    google:true,
                    roles: ['USER_ROLE'],
                    state: true
                };
                user = new User(data);
                await user.save();
            }

            if (!user.state) {
                throw new Error('Usuario inactivo')
            }

            const token = await generateJWT(user.id, user.roles);

            return {user, token};

        } catch (error) {
            console.log(error);
            throw new Error('Token de Google no válido');
        }
    }
}

export default AuthService;