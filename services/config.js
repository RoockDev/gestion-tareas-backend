import mongoose from 'mongoose';
import kleur from 'kleur';

const dbConnection = async () => {
    try{
        //para evitar errores futuros, se puede cambiar
        mongoose.set('strictQuery',false);

        await mongoose.connect(process.env.MONGODB_URI);

        console.log(kleur.blue().bold('🔵Base de datos con mongoose'));
    }catch(error){
        console.log(kleur.red().bold('❌ Error a la hora de iniciar la base de datos'));
        console.log(error);
    }
};

//esto esun listener para cerrar la conexion limpiamente si se apaga el servidor
//he estado leyendo su funcion y me ha parecido intersante ponerlo
//puede evitar algunos problemas de saturación y conexiones fantasma si por ejemplo reinicias muchas veces rapido etc

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log(kleur.red('\n🛑 Conexión a MongoDB cerrada por terminación de la aplicación'));
    process.exit(0);
});

export {
    dbConnection
};