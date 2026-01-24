import TaskService from '../services/TaskService.js';

const taskService = new TaskService();

// Tareas por dificultad

 const getTasksByDifficultyGQL = async (difficulty) => {
    try {
        
        const tasks = await taskService.getTasksByDifficulty(difficulty);
        return tasks; 
    } catch (error) {
        console.error("Error GQL:", error);
        throw new Error("Error al obtener tareas por dificultad");
    }
};

//  Tareas sin asignar
 const getUnassignedTasksGQL = async () => {
    try {
        const tasks = await taskService.getUnassignedTasks();
        return tasks;
    } catch (error) {
        console.error("Error GQL:", error);
        throw new Error("Error al obtener tareas sin asignar");
    }
};

//Tareas de un usuario en especifico

 const getTasksByUserIdGQL = async (userId) => {
    try {
        const tasks = await taskService.getTasksByUserId(userId);
        return tasks;
    } catch (error) {
        console.error("Error GQL Privado:", error);
        throw new Error("Error al obtener las tareas del usuario.");
    }
};

 const getTasksByUserAndDifficultyGQL = async (userId, difficulty) => {
    try {
        const tasks = await taskService.getTasksByUserAndDifficulty(userId,difficulty);
        return tasks;
    } catch (error) {
        console.error("Error GQL Privado:", error);
        throw new Error("Error al filtrar tareas privadas por dificultad.");
    }
}
export {
    getTasksByDifficultyGQL,
    getTasksByUserAndDifficultyGQL,
    getTasksByUserIdGQL,
    getUnassignedTasksGQL
}