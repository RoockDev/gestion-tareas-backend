import kleur from "kleur";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { ERROR_CODES } from "../helpers/errorCodes.js";

class TaskService {
    //obtener todas las tareas
    async getTasks(){
        try {
            const task = await Task.find().populate('assignedTo','name email');
            return task;
        } catch (error) {
            console.log(kleur.red('Error en taskService getTasks'));
            throw error;
        }
    }

    //crear una tarea
    async createTask(taskData){
        try {
            const newTask = new Task(taskData);
            await newTask.save();
            return newTask;
        } catch (error) {
            console.log(kleur.red('Error en taskService createTask'));
            throw error;
        }
    }

    //asignar tarea
    async assignTask(taskId,userId){
        try {
            //se busca la tarea
            const task = await Task.findById(taskId);
            if (!task) {
                throw new Error(ERROR_CODES.TASK_NOT_FOUND);
            }

            //se valida si ya esta asignada
            if (task.assignedTo) {
                throw new Error(ERROR_CODES.TASK_ALREADY_ASSIGNED);
            }

            //se busca el usuario
            const user = await User.findById(userId);
            if (!user) {
                throw new Error(ERROR_CODES.USER_NOT_FOUND)
            }

            //se actualiza la tarea
            task.assignedTo = user._id;
            task.status = 'todo'; //imagina que un usuario tiene esta tarea en estado 'doing' y la abandona, le volvemos a poner todo para evitar fallas
            await task.save();

            //se actualiza el usuario push al array
            user.tasks.push(task._id);
            await user.save();

            //se retorna la tarea con el usuario name y emami + bonito
            const newTask = Task.findById(taskId).populate('assignedTo', 'name email');
            return newTask;

        } catch (error) {
            console.log(kleur.red('Error en tareasService assignTask'));
            throw error;
        }
    }

    //cambiar estado de una tarea
    async changeStatus(taskId, newStatus,user){
        try {
            const task = await Task.findById(taskId);
            if (!task) {
                throw new Error(ERROR_CODES.TASK_NOT_FOUND);
            }
            //ahora se comprueba si es admin o user el que la cambia
            //se podria hacer mediante dos middleware pero seria mas ineficiente porque habria 
            //que hacer dos consultas a la base de datos, de esta forma con una se hace y se utiliza solo el middeware de JWT
            const isAdmin = user.roles.includes('ADMIN_ROLE');
            const isOwner = task.assignedTo && task.assignedTo.toString() === user._id.toString();
            //esto es para que el servidor no pete en caso de que la tarea en assignTo sea null
            //si ponemos solo task.assignedTo.toString() y resulta que es null (null.toString()) el servidor
            //revienta, por lo tanto con el && en caso de que sea null aseguramos que no siga hacia la derecha

            
            if (!isAdmin && !isOwner) {
                throw new Error(ERROR_CODES.NOT_AUTHORIZED);
            }

            //se verifica el estado actual
            const currentStatus = task.status;

            if (currentStatus === 'todo' && newStatus === 'doing') {
                task.status = 'doing';
            }else if(currentStatus === 'doing' && newStatus === 'done'){
                task.status = 'done';
            }else if(currentStatus !== 'todo' && newStatus === 'todo'){
                task.status = 'todo';
            }else{
                throw new Error(ERROR_CODES.INVALID_TRANSITION);
            }

            await task.save();
            return task;
        } catch (error) {
            throw error;
        }
    }

    //liberar una tarea
    async releaseTask(taskId,user){
        try {
            const task = await Task.findById(taskId);
            if (!task) {
                throw new Error(ERROR_CODES.TASK_NOT_FOUND);
            }

            //se comprueba si está asignada
            if (!task.assignedTo) {
                throw new Error(ERROR_CODES.TASK_NOT_ASSIGNED);
            }

            //se valida si es admin o usuario normal
            const isAdmin = user.roles.includes('ADMIN_ROLE');
            const isOwner = task.assignedTo && task.assignedTo.toString() === user._id.toString();

            if (!isAdmin && !isOwner) {
                throw new Error(ERROR_CODES.NOT_AUTHORIZED);
            }

            //ahora se saca la tarea del array con pull, se busca al usuario que tenia asignada y se le quita
            await User.findByIdAndUpdate(task.assignedTo, {
                $pull: {tasks: task._id}
            });

            // ahora en tarea se deben de resetear los campos que la vinculaban con el user y el nuevo estado por supuesto
            task.assignedTo = null;
            task.status = 'todo';
            await task.save();

            return task;
        } catch (error) {
            throw error;
        }
    }

    //autoasignar tarea, el usuario coge una tarea que tenga libre
    

  
  async takeTask(taskId, user) {
    try {
     
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error(ERROR_CODES.TASK_NOT_FOUND);
      }

      
      if (task.assignedTo) {
        throw new Error(ERROR_CODES.TASK_ALREADY_ASSIGNED);
      }

      
      task.assignedTo = user._id;
      task.status = 'todo'; 
      await task.save();

     
      await User.findByIdAndUpdate(user._id, {
        $push: { tasks: task._id }
      });

      //  Devolvemos la tarea populada
      return await Task.findById(taskId).populate('assignedTo', 'name email');

    } catch (error) {
      throw error;
    }
  }
//borrar tarea - solo admin
async deleteTask(taskId,user){
    try {
        const task = await Task.findById(taskId);
        if (!task) {
            throw new Error(ERROR_CODES.TASK_NOT_FOUND);
        }

        //aunque lo protejamos con el middleware, aqui tambien lo hago + seguridad
        if (!user.roles.includes('ADMIN_ROLE')) {
            throw new Error(ERROR_CODES.NOT_AUTHORIZED);
        }

        if (task.assignedTo) {
            await User.findByIdAndUpdate(task.assignedTo,{
                $pull: {tasks: task._id}
            });
        }

        await task.deleteOne();
    } catch (error) {
        throw error;
    }
}

//put actualizar tareas - solo admin
async updateTask( taskId,data,user){
    try {
        const task = await Task.findById(taskId);
        if (!task) {
            throw new Error(ERROR_CODES.TASK_NOT_FOUND);
        }

        if (!user.roles.includes('ADMIN_ROLE')) {
            throw new Error(ERROR_CODES.NOT_AUTHORIZED);
        }

        //{new: true} hace que nos devuelva el objeto ya modificado
        const updatedTask = await Task.findByIdAndUpdate(taskId,data, {new: true});

        return updatedTask;


    } catch (error) {
        throw error;
    }
}

//Metodos para Graphql son reutilizables para rest pero son los que voy a hacer con gql en este ejercicio
//obtener tareas por dificultad especifica
async getTasksByDifficulty(difficultyLevel){
    try {
        const validDifficulties = ['XS','S','M','L','XL'];
        if (!validDifficulties.includes(difficultyLevel)) {
            throw new Error(`Dificultad no válida. Permitidas : ${validDifficulties}`);
        }

        const task = await Task.find({difficulty: difficultyLevel}).populate('assignedTo','name email');
        return task;
    } catch (error) {
        console.log(kleur.red('Error en taskService getTasksByDifficulty'));
            throw error;
    }
}

//Tareas sin aignar, ordenadas por duracion y dificultad
async getUnassignedTasks() {
        try {
            
            const tasks = await Task.find({ 
                $or: [
                    { assignedTo: null },
                    { assignedTo: { $exists: false } }
                ] 
            })
            // .sort de Mongoose
            // 1 = Ascendente, -1 = Descendente
            .sort({ duration: 1, difficulty: 1 }); 

            return tasks;
        } catch (error) {
            console.log(kleur.red('Error en taskService getUnassignedTasks'));
            console.error(error); 
            throw error;
        }
    }
//Tareas asignadas a un usuario específico
async getTasksByUserId(userId){
    try {
        const tasks = await Task.find({assignedTo: userId}).populate('assignedTo', 'name email');
        return tasks;
    } catch (error) {
        console.log(kleur.red('Error en taskService getTasksByUserId'));
            throw error;
    }
}

//tareas de un usuario filtradas por dificultad
async getTasksByUserAndDifficulty(userId,difficultyLevel){
    try {
        const validDifficulties = ['XS', 'S', 'M', 'L', 'XL'];
        if (!validDifficulties.includes(difficultyLevel)) {
            throw new Error(`Dificultad inválida. Permitidas: ${validDifficulties.join(', ')}`);
        }
        const tasks = await Task.find({assignedTo: userId,difficulty:difficultyLevel}).populate('assignedTo', 'name email');
        return tasks;
    } catch (error) {
        console.log(kleur.red('Error en taskService getTasksByUserAndDifficulty'));
        throw error;
    }
}

//obtener tareas en un rango de dificultad
async getTasksByRange(min,max){
    try {
         const minLevel = min.toUpperCase();
         const maxLevel = max.toUpperCase();

         const levels = ['XS', 'S', 'M', 'L', 'XL'];


         const minIndex = levels.indexOf(minLevel);
         const maxIndex = levels.indexOf(maxLevel);

         if (minIndex === -1 || maxIndex === -1) {
            throw new Error('Dificultad no válida');
         }

         if (minIndex > maxIndex) {
            throw new Error('El rango mínimo no puede ser mayor que el máximo');
         }

         //se sacan las dificultados intermedias
         const allowedDifficulties = levels.slice(minIndex,maxIndex + 1);

         const tasks = await Task.find({
            difficulty: {$in: allowedDifficulties}
         });

         // la ordenación
         tasks.sort((a,b) => {
            const indexA = levels.indexOf(a.difficulty);
            const indexB = levels.indexOf(b.difficulty);
            return indexA - indexB;
         });

         return tasks;
    } catch (error) {
        console.error(error);
        throw new Error(error.message || 'Error en el servicio de rangos');
    }
}

async countMaxDifficultyTasks(){
    try {
        const levels = ['XL', 'L', 'M', 'S', 'XS'];

        for(const level of levels){
            const count = await Task.countDocuments({difficulty:level});

            if (count > 0) {
                return {
                    level: level,
                    count: count
                };
            }
        }

        return {
            level:null,
            count: 0
        };
    } catch (error) {
        console.log(error);
        throw new Error('Error al contar tareas de alta dificultad');
    }
}

async getTasksByStatus(status) {
    try {
        const tasks = await Task.find({status:status});
        return tasks;
    } catch (error) {
        console.log(error);
        throw new Error('Error al filtrar por estado');
    }
}
}





export default TaskService;