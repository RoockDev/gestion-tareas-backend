import { faker } from "@faker-js/faker";
import bcryptjs from "bcryptjs";
import { v4 as uuidv4 } from 'uuid';
import User from "../models/User.js";
import Task from "../models/Task.js";

class SeedService {
    async executeSeed(){
        try {
            
            //borramos todo lo que hay en bbdd antes de rellenar
            await Task.deleteMany({});
            await User.deleteMany({});

            //voy a poner una contraseña comun para todos por si luego quiero probar las rutas pues no tener que complicarme
            const salt = bcryptjs.genSaltSync();
            const password = bcryptjs.hashSync('123456',salt);

            //ahora voy a crear un admin maestro y un usuario normal maestro para probar rutas genericos

            const adminUser = new User({
                id: uuidv4(),
                name: 'admin',
                email: 'admin@admin.com',
                password: password,
                roles: ['ADMIN_ROLE', 'USER_ROLE'],
                state: true 
            });

            const normalUser = new User({
                id: uuidv4(),
                name : 'user',
                email: 'user@user.com',
                password: password,
                roles: ['USER_ROLE'],
                state: true
            });

            await adminUser.save();
            await normalUser.save();

            //ahora se crean 5 usuarios aleatorios
            const randomUsers = [];
            for(let i = 0; i < 5; i++){
                const user = new User({
                    id:uuidv4(),
                    name: faker.person.fullName(),
                    email: faker.internet.email(),
                    password: password,
                    roles: ['USER_ROLE'],
                    state: true
                });
                randomUsers.push(user);
            }

            //ahora con esto se insertan todos de golpe
            const savedRandomUsers = await User.insertMany(randomUsers);

            //y ahora meto todos los usuarios en un mismo array para el sorteo de las tareas
            const allUsers = [adminUser,normalUser,...savedRandomUsers];

            //ahora vamos a crear 20 tareas aleatorias para tener para cacharrear
            const tasks = [];

            const difficultyLevels = ['XS', 'S', 'M', 'L', 'XL'];
            for(let i = 0; i < 20; i++){
                /**
                 * como hay tareas que en assignedTo quiero que sean null y otras que tengan un dueño
                 * para probar luego las rutas distintos tipos de errores
                 * quiero que algunas tengan un usuario asignado y otras no con una probabilidad
                 * MAth.random() < 0.7 es 70% probabilidad de que toque un usuario para asignar la tarea si no null y esta libre
                 */
                const randomUserIndex = Math.floor(Math.random() * allUsers.length);
                const assignedUser = Math.random() < 0.7 ? allUsers[randomUserIndex] : null; 

                //ahora voy a poner distintos estados para las tareas
                let status = 'todo';
                if (assignedUser) {
                    const statuses = ['todo','doing','done'];
                    status = statuses[Math.floor(Math.random() * statuses.length)];
                }

                const task = new Task({
                    title: faker.hacker.verb() + ' ' + faker.hacker.noun(),
                    description: faker.lorem.paragraph(),
                    status: status,
                    duration: faker.number.int({ min: 15, max: 240 }), 
                    difficulty: difficultyLevels[Math.floor(Math.random() * difficultyLevels.length)],
                    assignedTo: assignedUser ? assignedUser._id : null
                });
                tasks.push(task);
            }

            //se guardan las tareas
            const savedTasks = await Task.insertMany(tasks);

            //ahora hay que recorrer las tareas y actualizar el usuario haciendole push en el array de tasks de cada usuario
            //como hemos estado haciendo en otros servicios
            for(const task of savedTasks){
                if (task.assignedTo) {
                    await User.findByIdAndUpdate(task.assignedTo, {
                        $push: {tasks: task._id}
                    });
                }
            }

            return {
                message : 'Seed ejecutado',
                stats: {
                    usersCreated: allUsers.length, 
                    tasksCreated: tasks.length
                }
            };
        } catch (error) {
            console.log(error);
            throw new Error('Seed fallado');
        }
    }
}

export default SeedService;