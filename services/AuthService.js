import bcryptjs from "bcryptjs";
import User from '../models/User.js';
import { generateJWT } from "../helpers/generate_jwt.js";

class AuthService {
    async login(email,password){
        try {
            const user = await User.findOne({email});
            if (!user) {
                throw new Error('INVALID_CREDENTIALS');
            }

            if (!user.state) {
                throw new Error("USER_INACTIVE");
                
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
}

export default AuthService;