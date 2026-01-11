import express from 'express';
import cors from 'cors';
import {createServer} from 'http';
import {Server as SocketServer} from 'socket.io';
import kleur from 'kleur';
import userRoutes from '../routes/userRoutes.js';
import authRoutes from '../routes/authRoutes.js';
import { dbConnection } from '../services/config.js';

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT;

        //servidor htto para compatibilidad con sockets
        this.server = createServer(this.app);

        //configuracion de IO sockets
        this.io = new SocketServer(this.server, {
            cors:{
                origin: '*',
                methods: ["GET", "POST"]
            }
        });

        //rutas de la app
        this.paths = {
            auth: '/api/auth',
            tasks: '/api/tasks',
            users: '/api/users'
        };

        //orden de ejecucion
        this.conectarDB();
        this.middlewares();
        this.routes();
        this.sockets();
    }

    async conectarDB() {
        //TODO se conectara con mongo despues
        await dbConnection();
    }

    middlewares(){

        //cors
        this.app.use(cors() );

        //lectura y parseo del body
        this.app.use(express.json() );

        //directorio publico
        this.app.use(express.static('public'));
    }

    routes() {
        //TODO aqui se definiran las rutas
        //crear usuario
        this.app.use(this.paths.users,userRoutes);
        //login
        this.app.use(this.paths.auth,authRoutes);
    }

    sockets(){
        this.io.on ('connection', (socket) => {
            console.log(kleur.yellow('Cliente conectado: ' + socket.id) );

            socket.on('disconnect', () => {
                console.log(kleur.yellow('Cliente desconectado: ' + socket.id));
            });
        });
    }

    listen(){
        this.server.listen(this.port, () => {
            console.log(kleur.green(`\n Servidor encontrado en puerto : ${this.port}`))
        });
    }
}

export default Server;