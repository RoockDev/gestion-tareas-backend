import jwt from 'jsonwebtoken';

const generateJWT = (uid = '', roles = []) => {
    return new Promise((resolve,reject) => {
        const payload = {uid, roles};

        jwt.sign(payload, process.env.SECRET_KEY, {
            expiresIn: '40h'
        },  (err,token) => {
            if (err) {
                console.log(err);
                reject('No se pudo generar el token');
            }else{
                resolve(token);
            }
        });
    });
}

export {
    generateJWT
};