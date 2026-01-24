import kleur from 'kleur';

const socketController = (socket, io) => {
    console.log(kleur.yellow().bold('⚡ Cliente conectado a WebSockets:'), socket.id);

    socket.on('disconnect', () => {
        console.log(kleur.yellow('🔌 Cliente desconectado:'), socket.id);
    });
}

export default socketController;