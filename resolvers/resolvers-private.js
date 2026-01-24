
import { 
    getTasksByUserIdGQL, 
    getTasksByUserAndDifficultyGQL 
} from '../controllers/taskController_GQL.js';



const resolvers_private = {
  Query: {
    
    //tareas filtradas por usuario especifico
    getTasksByUserId: async (_, { userId }, context) => {

        const { user } = context;

        if (user.roles.includes('ADMIN_ROLE') || user.id === userId) {
             return getTasksByUserIdGQL(userId);
        }
        
        throw new Error("No autorizado: No puedes ver tareas de otros usuarios.");
    },

    // tareas filtradas por dificultad
    getTasksByUserAndDifficulty: async (_, { userId, difficulty }, context) => {
        const { user } = context;

        
        if (user.roles.includes('ADMIN_ROLE') || user.id === userId) {
            return getTasksByUserAndDifficultyGQL(userId, difficulty);
        }

        throw new Error("No autorizado.");
    }
  }
};

export default resolvers_private;