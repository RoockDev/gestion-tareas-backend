import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const taskSchema = new Schema({
    
    
    description: {
        type: String,
        required: [true, 'La descripción es obligatoria']
    },
    duration: {
        type: Number, 
        required: [true, 'La duración es obligatoria']
    },
    difficulty: {
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL'], 
        required: [true, 'La dificultad es obligatoria']
    },
    status: {
        type: String,
        enum: ['todo', 'doing', 'done'],
        default: 'todo'
    },
   
    assignedTo: { //esto tengo que probarlo aun bien 
        type: Schema.Types.ObjectId,
        ref: 'User', 
        default: null 
    }
}, 
{
    timestamps: true, 
    versionKey: false
});


taskSchema.methods.toJSON = function() {
    const { __v,  ...task } = this.toObject();
     
    return task;
}

export default model('Task', taskSchema);