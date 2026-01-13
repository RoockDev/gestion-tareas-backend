import kleur from "kleur";
import Task from "../models/Task.js";
import User from "../models/User.js";

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
                throw new Error('TASK_NOT_FOUND');
            }

            //se valida si ya esta asignada
            if (task.assignedTo) {
                throw new Error('TASK_ALREADY_ASSIGNED');
            }

            //se busca el usuario
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('USER_NOT_FOUND')
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
                throw new Error('TASK_NOT_FOUND');
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
                throw new Error('NOT_AUTHORIZED');
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
                throw new Error('INVALID_TRANSITION');
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
                throw new Error('TASK_NOT_FOUND');
            }

            //se comprueba si está asignada
            if (!task.assignedTo) {
                throw new Error('TASK_NOT_ASSIGNED');
            }

            //se valida si es admin o usuario normal
            const isAdmin = user.roles.includes('ADMIN_ROLE');
            const isOwner = task.assignedTo && task.assignedTo.toString() === user._id.toString();

            if (!isAdmin && !isOwner) {
                throw new Error('NOT_AUTHORIZED');
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
    // ... métodos anteriores ...

  
  async takeTask(taskId, user) {
    try {
     
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('TASK_NOT_FOUND');
      }

      
      if (task.assignedTo) {
        throw new Error('TASK_ALREADY_ASSIGNED');
      }

      
      task.assignedTo = user._id;
      task.status = 'todo'; 
      await task.save();

     
      await User.findByIdAndUpdate(user._id, {
        $push: { tasks: task._id }
      });

      // E. Devolvemos la tarea populada
      return await Task.findById(taskId).populate('assignedTo', 'name email');

    } catch (error) {
      throw error;
    }
  }
}

export default TaskService;