import {response, request} from 'express';
import Task from '../models/Task.js';

//Obtener todas las tareas
const getTasks = async (req = request, res = response) => {
    try {
        // .populate('assignedTo') -> Va a la colección Users y trae los datos del dueño
        const tasks = await Task.find().populate('assignedTo', 'name email') ;
        
        return res.status(200).json({
            success:true,
            message: 'Listado de tareas obtenido correctamente',
            data:tasks
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message: 'Error al obtener tareas',
            data:null
        });
    }
}


//crear una nueva tarea
const createTask = async (req = request, res = response) => {
    try {
        const {description,duration,difficulty} = req.body;

        const newTask = new Task({
            description,
            duration,
            difficulty
        });

        await newTask.save();

        return res.status(201).json({
            success:true,
            message: 'Tarea creada con exito',
            data:newTask
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Error al crear la tarea',
            data:null
        });
    }
}

export {
    getTasks,
    createTask
}