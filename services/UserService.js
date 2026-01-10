import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";
import bcryptjs from "bcryptjs";
import kleur from "kleur";

class UserService {
  constructor() {}

  async createUser(userData) {
    try {
      const { name, email, password, roles } = userData;

      const user = new User({
        id: uuidv4(),
        name,
        email,
        password,
        roles,
      });


      //esto es por darle un poco mas de seguridad, por si dos usuarios tienen la misma contraseña
      //que se encrypte de manera distinta, si no lo pones si dos usuarios tienen la misma contraseña
      //con hash solo , en bbdd tendrian la misma encriptacion
      const salt =  await bcryptjs.genSalt(); 
      user.password = await bcryptjs.hash(password, salt);

      await user.save();

      console.log(
        kleur.blue().bold("   usuario creado correctamente: ") + user.email
      );

      return user;
    } catch (error) {
      console.log(kleur.red().bold("Error al crear usuario: "));
      console.log(error);
      throw error;
    }
  }
}

export default UserService;
