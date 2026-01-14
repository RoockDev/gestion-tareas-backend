import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";
import bcryptjs from "bcryptjs";
import kleur from "kleur";

class UserService {
  constructor() {}

  async createUser(userData) {
    try {
      const { name, email, password, roles } = userData;

      

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

      


      //esto es por darle un poco mas de seguridad, por si dos usuarios tienen la misma contraseña
      //que se encrypte de manera distinta, si no lo pones si dos usuarios tienen la misma contraseña
      //con hash solo , en bbdd tendrian la misma encriptacion
      const salt =  await bcryptjs.genSalt(); 
      newUser.password = await bcryptjs.hash(password, salt);

      try {
          await newUser.save();
      } catch (error) {
          //en el modelo , en mongo esta email unique pero si mongo explota por eso, se lanza error 11000 y asi controlamos y vale para enviarlo a los dos controladores que usan este servicio
          if (error.code === 11000) {
              throw new Error('EMAIL_EXISTS');
          }
          throw error; 
      }

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

  //Listar todos - solo activos- solo admin 
  async getUsers(){
    try {
      //solo se devuelven los que tienen estado true activos
      const users = await User.find({state:true});
      return users;
    } catch (error) {
      throw error;
    }
  }

  //Buscar por Id - solo admin
  async getUserById(id){
    try {
      const user = await User.findById(id);
      if (!user || !user.state) {
        throw new Error('USER_NOT_FOUND');
      }
      return user;
    } catch (error) {
      throw error;      
    }
  }

  //Actualizar - solo admin
  async updateUser(id,data){
    try {
        // no si habrá que añadir mas adelante en el ejercicio, la ruta de cambiar la contraseña
        //como este ejercicio es para cacharrear node y tal pues pongo que el administrador pueda cambiar la contraseña
        //si luego tengo que quitarlo pues lo quito
        //pero si se hace pues encripto la contraseña de nuevo
        if (data.password) {
          const salt = await bcryptjs.genSalt();
          data.password = await bcryptjs.hash(data.password,salt);
        }

        const user = await User.findByIdAndUpdate(id,data, {new:true});
        if(!user) {
          throw new Error('USER_NOT_FOUND');
        }

        return user;
    } catch (error) {
      throw error;
    }
  }

  //Borrar Soft Delete - solo admin
  async deleteUser(id){
    try {
      // no borramos el registro solo ponemos el state en false
      const user = await User.findByIdAndUpdate(id,{state:false}, {new:true});
      if(!user){
        throw new Error('USER_NOT_FOUND');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }
}

export default UserService;
