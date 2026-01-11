import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";
import bcryptjs from "bcryptjs";
import kleur from "kleur";

class UserService {
  constructor() {}

  async createUser(userData) {
    try {
      const { name, email, password, roles } = userData;

      console.log("Roles recibidos de servie", roles);

      const user = {
        id: uuidv4(),
        name,
        email,
        password,
      };

      /**Esta solucion de debajo hay que ponerla porque aunque se haya puesto por defecto de rol user
       * si no se le pasa rol por el body siempre devuelve undefined y no se guarda en la base de datos
       * por eso hay que hacer este codigo de aqui debajo para conseguir que se guarde
       */

      if (roles) {
        user.roles = roles;
      }

      const newUser = new User(user);

      console.log("2. Usuario Mongoose antes de save:", user);


      //esto es por darle un poco mas de seguridad, por si dos usuarios tienen la misma contraseña
      //que se encrypte de manera distinta, si no lo pones si dos usuarios tienen la misma contraseña
      //con hash solo , en bbdd tendrian la misma encriptacion
      const salt =  await bcryptjs.genSalt(); 
      user.password = await bcryptjs.hash(password, salt);

      await newUser.save();

      console.log(
        kleur.blue().bold("   usuario creado correctamente: ") + user.email
      );

      return newUser;
    } catch (error) {
      console.log(kleur.red().bold("Error al crear usuario: "));
      console.log(error);
      throw error;
    }
  }
}

export default UserService;
