import mongoose from "mongoose";
const { Schema,model} = mongoose;

const userSchema = new Schema({
    id:{
        type:String,
        unique:true,
        required:true
    },
    name:{
        type:String,
        required:[true, 'El nombre es obligatorio']
    },
    email:{
        type:String,
        required: [true, 'El correo es obligatorio'],
        unique:true
    },
    password:{
        type:String,
        required: [true, 'La contraseña es obligatoria']
    },
    roles:{
        type: [String],
        default: ['USER_ROLE'],
        enum: ['ADMIN_ROLE', 'USER_ROLE']
    },
    state:{ //para el softdelete
        type:Boolean,
        default:true
    },
    task: [{
        type: Schema.Types.ObjectId,
        ref: 'task'
    }]
},
{
    collection: 'users',
    versionKey:false,
    strict: false
}
);

//metodo para limpiar el objeto al devolverlo (por seguridad)
//para no enviar por ejemplo contraseñas encriptada ya que seria un fallo grande
userSchema.methods.toJSON = function() {
    const {_v,_id,password,...user} = this.toObject();
    return user; 
}


export default model('User',userSchema);