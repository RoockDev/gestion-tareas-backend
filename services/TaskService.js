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
}

export default TaskService;