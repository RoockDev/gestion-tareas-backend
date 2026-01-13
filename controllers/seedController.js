import { response, request } from 'express';
import SeedService from '../services/seedService.js';

const seedService = new SeedService();

const executeSeed = async (req = request, res = response) => {
    

    try {
        const result = await seedService.executeSeed();

        res.json({
            success: true,
            message: 'Base de datos repoblada correctamente',
            data: result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al ejecutar el Seed',
            error: error.message
        });
    }
}

export {
    executeSeed
}