import { getTasksByDifficultyGQL,getUnassignedTasksGQL } from "../controllers/taskController_GQL.js";
import { getUserByIdGQL } from "../controllers/userController_GQL.js";

const resolvers_public = {
    Query: {
        //tareas de una complejidad especifica
        getTasksByDifficulty: (_,{difficulty}) => {
            return getTasksByDifficultyGQL(difficulty);
        },

        //Tareas sin asignar
        getUnassignedTasks : () => {
            return getUnassignedTasksGQL();
        }
    },

    //aqui cruzamos los datos por como lo tengo hecho
    Task: {
        assignedTo: (task) => {
            //task.assignedTo tiene el id
            return getUserByIdGQL(task.assignedTo);
        }
    }
};

export default resolvers_public;
