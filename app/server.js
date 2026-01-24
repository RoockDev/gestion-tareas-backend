import express from 'express';
import cors from 'cors';
import {createServer} from 'http';
import {Server as SocketServer} from 'socket.io';
import kleur from 'kleur';
import { dbConnection } from '../services/config.js';
import { ApolloServer } from '@apollo/server';
import typeDefs from '../typeDefs/typeDefs.js';
import resolvers_public from '../resolvers/resolvers-public.js';
import { expressMiddleware } from '@as-integrations/express4';
import userRoutes from '../routes/userRoutes.js';
import authRoutes from '../routes/authRoutes.js';
import taskRoutes from '../routes/taskRoutes.js';
import { validarJWT_GQL } from '../middlewares/validate-jwt.js';
import resolvers_private from '../resolvers/resolvers-private.js';
import socketController from '../controllers/socketController.js';
import {createClient} from '@redis/client';


class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT;
        this.wsPort = process.env.WEBSOCKETPORT;

        //servidor htto para compatibilidad con sockets
        this.server = createServer(this.app);
        //this.serverWebSocket = createServer(this.app); //asi no me va
        this.serverWebSocket = createServer();

        //configuracion de IO sockets
        this.io = new SocketServer(this.serverWebSocket, {
            cors:{
                origin: '*',
                methods: ["GET", "POST"]
            }
        });

        //rutas de la app
        this.paths = {
            auth: '/api/auth',
            tasks: '/api/tasks',
            users: '/api/users',
            graphQLPublicPath: '/graphql-public',
            graphQLPrivatePath: '/graphql-private'
        };
        
        
        //He puesto 2 publicas y 2 privadas para asi probar como el ejemplo de clase

        //Apollo server público
        this.serverGraphQLPublic = new ApolloServer({
            typeDefs,
            resolvers: resolvers_public,
            plugins: [
                {
                    async requestDidStart() {
                        return {
                            async willSendResponse({ response, errors }) {
                                if (errors) {
                                    response.body.singleResult.errors = errors.map(err => ({
                                        message: err.message,
                                    }));
                                }
                            },
                        };
                    },
                },
            ],
        })

        //Apollo server privado
        this.serverGraphQLPrivate = new ApolloServer({
            typeDefs,
            resolvers: resolvers_private,
            plugins: [
                {
                    async requestDidStart() {
                        return {
                            async willSendResponse({ response, errors }) {
                                if (errors) {
                                    response.body.singleResult.errors = errors.map(err => ({
                                        message: err.message,
                                    }));
                                }
                            },
                        };
                    },
                },
            ],
        })

        //orden de ejecucion
        this.conectarDB();
        this.conectarRedis();
        this.middlewares();
        this.routes();
        this.sockets();

        


    }

    async conectarRedis() {
        try {
            // Creamos el cliente con los datos del .env
            this.redisClient = createClient({
                socket: {
                    host: process.env.REDIS_HOST, // 'localhost' o 'redis' según docker
                    port: process.env.REDIS_PORT  // 6379
                }
            });

            // Listener de errores (importante para depurar)
            this.redisClient.on('error', err =>
                console.log(kleur.red('❌ Redis error:'), err)
            );

            // Intentamos conectar
            await this.redisClient.connect();
            console.log(kleur.magenta().bold('💾 Conectado a Redis Cache'));

        } catch (err) {
            // Si falla, avisamos pero NO paramos el servidor (Fail-safe)
            console.log(
                kleur.red('⚠️ Redis no disponible, continuando sin caché')
            );
            this.redisClient = null;
        }
    }

    async conectarDB() {
      
        await dbConnection();
    }

    middlewares(){

        //cors
        //this.app.use(cors() );
        this.app.use(cors({
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-token']
    }));

        // para evitar bloqueos de coop google
       // this.app.use((req,res,next) => {
         //   res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups"); //Con esto no me va
           // res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
            //next();
        //})

        //lectura y parseo del body
        this.app.use(express.json() );

        //directorio publico
        this.app.use(express.static('public'));

        this.app.use((req,res,next) => {
            req.io = this.io;
            next();
        });
    }

    /*applyGraphQLMiddleware(){
        //ruta publica
        this.app.use(
            this.paths.graphQLPublicPath,
            express.json(),
            expressMiddleware(this.serverGraphQLPublic)
        );

        //ruta privada
        this.app.use(
            this.paths.graphQLPrivatePath,
            express.json(),
            expressMiddleware(this.serverGraphQLPrivate , {
                context : async ({req}) => {
                    try {
                        const context = await validarJWT_GQL({req});
                        console.log('Acceso autorizado en GraphQL privado');
                        return context;

                    } catch (error) {
                         console.log('Error en autenticación:', error.message);
                        throw new Error('No autorizado');
                    }
                }
            })
        );
    }*/

        //Con la forma que tengo comentada arriba no me iba que era la que habia en el ejemplo no se porqué
        //por eso no la he puesto igual y he tenido que buscar y poner la de abajo
   applyGraphQLMiddleware() {
        
        this.app.use(
            this.paths.graphQLPublicPath,
            cors(), 
            express.json(), 
            (req, res, next) => { 
                if (!req.body) req.body = {}; 
                next();
            },
            expressMiddleware(this.serverGraphQLPublic)
        );

        
        this.app.use(
            this.paths.graphQLPrivatePath,
            cors(),
            express.json(),
            (req, res, next) => { 
                if (!req.body) req.body = {}; 
                next();
            },
            expressMiddleware(this.serverGraphQLPrivate, {
                context: async ({ req }) => {
                    try {
                        const context = await validarJWT_GQL({ req });
                        console.log('Acceso autorizado en GraphQL privado');
                        return context;
                    } catch (error) {
                        
                        throw new Error('No autorizado');
                    }
                }
            })
        );
    }

    routes() {
        //user routes
        this.app.use(this.paths.users,userRoutes);
        //auth routes
        this.app.use(this.paths.auth,authRoutes);
        //task routes
        this.app.use(this.paths.tasks,taskRoutes(this.redisClient));
    }

    sockets(){
        this.io.on('connection', (socket) => socketController(socket, this.io));
    }

    async start(){
        await this.serverGraphQLPublic.start();
        await this.serverGraphQLPrivate.start();
        this.applyGraphQLMiddleware();
        console.log('🚀 Servidor Apollo Público iniciado');
        this.listen();

    }

    listen(){
        this.server.listen(this.port, () => {
            console.log(kleur.green(`\n   ➜ Servidor corriendo en puerto: ${this.port}`));
            console.log(kleur.cyan(`   ➜ REST: http://localhost:${this.port}/api/...`));
            console.log(kleur.magenta(`   ➜ GQL Público: http://localhost:${this.port}${this.paths.graphQLPublicPath}`));
            console.log(kleur.red(`   ➜ GQL Privado: http://localhost:${this.port}${this.paths.graphQLPrivatePath}`));
        });
        this.serverWebSocket.listen(this.wsPort, () => {
            console.log(kleur.blue().bold(`⚡ Servidor WebSockets corriendo en puerto: ${this.wsPort}`));
        });
    }
}

export default Server;