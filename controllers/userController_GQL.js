import UserService from '../services/UserService.js';

const userService = new UserService();


const getUserByIdGQL = async (userId) => {
    try {
        if (!userId) return null;
        
        const user = await userService.getUserById(userId); 
        return user;
    } catch (error) {
        console.error("Error buscando usuario GQL:", error);
        return null; 
    }
};

export {
    getUserByIdGQL
}

