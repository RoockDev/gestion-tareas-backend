//Parte Cliente Gepeteada Histórica aunque esto no lo da bien todo a la primera y he liado una hasta que a funcionado..

const URL_API = 'http://localhost:9090/api'; 
let token = localStorage.getItem('token');

let user = {};
try {
    user = JSON.parse(localStorage.getItem('user')) || {};
} catch (e) {
    console.log("No hay usuario guardado");
}
let tasksForEdit = [];


// ================= WEBSOCKETS (Puerto 9091) =================

const socket = io("http://localhost:9091"); 

socket.on('connect', () => {
    console.log("🟢 Conectado a WebSockets con ID:", socket.id);
});

// 👂 ESCUCHA ACTIVA
// Cuando el servidor grite 'server:loadTasks', recargamos todo.
socket.on('server:loadTasks', (payload) => {
    console.log("⚡ Actualización en tiempo real:", payload.msg);
 
    loadTasks(); 
    
    
});

// Inicialización
/*document.addEventListener('DOMContentLoaded', () => {
    //if (token) {
      //  showDashboard();
    //}
    // 1. Leer token del almacén
    const storedToken = localStorage.getItem('token');
    
    // 2. Si hay token, saltar el login e ir directo al Dashboard
    if (storedToken) {
        user = JSON.parse(localStorage.getItem('user') || '{}');
        token = storedToken;
        showDashboard(); // <--- ESTO ES LO QUE FALTA
    }
});*/
document.addEventListener('DOMContentLoaded', () => {
   
    const storedToken = localStorage.getItem('token');
    
    
    if (storedToken) {
        
        try {
            user = JSON.parse(localStorage.getItem('user')) || {};
            token = storedToken;
        } catch (e) {
            console.log("Error leyendo usuario");
        }
        
        
        showDashboard(); 
    }
});


// ================= AUTH (Adaptado a tu AuthController) =================

function toggleAuth() {
    document.getElementById('login-form').classList.toggle('hidden');
    document.getElementById('register-form').classList.toggle('hidden');
    document.getElementById('auth-error').innerText = '';
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await authRequest('/auth/login', { email, password });
}

async function register() {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    await authRequest('/auth/register', { name, email, password });
}

// ==========================================
// 🔴 GOOGLE SIGN-IN (Lógica del Frontend)
// ==========================================

// Esta función la llama Google automáticamente cuando el usuario se loguea
async function handleCredentialResponse(response) {
    console.log("🎟️ Google Token recibido:", response.credential);

    try {
        
        const resp = await fetch(URL_API + '/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: response.credential })
        });

        const json = await resp.json();

        if (json.success) {
            console.log("✅ Autenticación con Google exitosa:", json);
            
            
            saveSession(json.data.token, json.data.user);
            
        } else {
            console.error("❌ Error Backend:", json.message);
            document.getElementById('auth-error').innerText = json.message;
        }

    } catch (error) {
        console.error("❌ Error de conexión:", error);
        alert("Error al conectar con el servidor para validar Google");
    }
}


const originalLogout = logout; // Guardamos tu logout actual
logout = () => {
    // Intentamos desconectar de Google visualmente
    try {
        google.accounts.id.disableAutoSelect();
        const email = user.email; 
        if (email) {
            google.accounts.id.revoke(email, done => {
                console.log('🔒 Consentimiento de Google revocado');
            });
        }
    } catch (e) { console.log("Google no estaba cargado o dio error, no pasa nada"); }

   
    originalLogout();
};

async function authRequest(endpoint, body) {
    const errorDisplay = document.getElementById('auth-error');
    errorDisplay.innerText = ''; 

    try {
        const resp = await fetch(URL_API + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const json = await resp.json();
        console.log("📥 Respuesta Auth:", json); // Para depurar

        if (json.success) {
           
            const userData = json.data.user || json.data.newUser; 
            const tokenData = json.data.token;

            saveSession(tokenData, userData);
        } else {
            errorDisplay.innerText = json.message || 'Error en la solicitud';
        }

    } catch (e) {
        console.error(e);
        errorDisplay.innerText = 'Error de conexión con el servidor';
    }
}

function saveSession(tokenRecibido, userRecibido) {
    /*if(!tokenRecibido) return;

    localStorage.setItem('token', tokenRecibido);
    token = tokenRecibido;

    if(userRecibido) {
        localStorage.setItem('user', JSON.stringify(userRecibido));
        user = userRecibido;
    }

    location.reload();*/

    if(!tokenRecibido) return;

    localStorage.setItem('token', tokenRecibido);
    
    if(userRecibido) {
        localStorage.setItem('user', JSON.stringify(userRecibido));
    }
    
    
    location.reload();
    
    //showDashboard();
}

function logout() {
    localStorage.clear();
    location.reload();
}

// ================= DASHBOARD =================

function showDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');

    // Mostramos info del usuario
    document.getElementById('user-name').innerText = user.name || 'Usuario';
    
    const role = (user.roles && user.roles.length > 0) ? user.roles[0] : 'USER';
    document.getElementById('user-role').innerText = role;

    // Mostrar panel admin si es ADMIN_ROLE
    if (user.roles && user.roles.includes('ADMIN_ROLE')) {
        document.getElementById('admin-panel').classList.remove('hidden');
        document.getElementById('admin-seed-box').classList.remove('hidden');
        document.getElementById('admin-list-section').classList.remove('hidden');
        document.getElementById('admin-filter-box').classList.remove('hidden');
        document.getElementById('admin-stats-box').classList.remove('hidden');
        document.getElementById('admin-range-box').classList.remove('hidden');
        document.getElementById('admin-assign-box').classList.remove('hidden'); // Caja Turquesa
        populateAssignSelects();
        document.getElementById('admin-edit-box').classList.remove('hidden'); 
        populateEditSelect(); //
        document.getElementById('admin-users-box').classList.remove('hidden'); 
        loadAdminUsers();
        document.getElementById('admin-filters-lab').classList.remove('hidden'); 
        populateLabSelects();
    }

    loadTasks();
}

// Función Maestra para recargar TODO el panel de Admin
function refreshAdminData() {
    console.log("🔄 Recargando datos del panel de Admin...");
    
    
    loadTasks(); 

    
    // (Ponemos un try-catch por si alguna caja no existe o da error, que no rompa el resto)
    /*try { populateAssignSelects(); } catch(e){} // Caja Turquesa
    try { populateEditSelect(); }    catch(e){} // Caja Azul Marino (PUT)
    try { populateLabSelects(); }    catch(e){} // Caja Marrón (Lab)
    try { loadAdminUsers(); }        catch(e){} // Caja Gris (Usuarios)*/
    if (user.roles && user.roles.includes('ADMIN_ROLE')) {
        try { populateAssignSelects(); } catch(e){}
        try { populateEditSelect(); }    catch(e){}
        try { populateLabSelects(); }    catch(e){}
        try { loadAdminUsers(); }        catch(e){}
    }

}

// ================= TAREAS (LÓGICA PRINCIPAL) =================

async function loadTasks() {
    try {
        
        const resp = await fetch(`${URL_API}/tasks`, {
            headers: { 'x-token': token }
        });
        const json = await resp.json();
        
      
        const tasks = json.data || json.tasks || []; 
        
        renderTasks(tasks);

    } catch (error) {
        console.error("Error cargando tareas", error);
    }
}

function renderTasks(tasks) {
    const listFree = document.getElementById('list-free');
    const listMine = document.getElementById('list-mine');
    const listAll = document.getElementById('list-all');

    listFree.innerHTML = '';
    listMine.innerHTML = '';
    listAll.innerHTML = '';

    let freeCount = 0;

  
    // Tu Task Model guarda ObjectId (_id). Tu User Model tiene _id y id (uuid).
    // Usaremos SIEMPRE _id (MongoID) para comparar porque es lo que guarda la Tarea.
    const myMongoId = user._id; 

    console.log("🆔 MI ID (Mongo):", myMongoId); // DEBUG

    tasks.forEach(task => {
        // Averiguar quién tiene la tarea
        let taskOwnerId = null;

        if (task.assignedTo) {
           
            if (typeof task.assignedTo === 'object') {
                taskOwnerId = task.assignedTo._id;
            } else {
                // Si viene solo el string ID
                taskOwnerId = task.assignedTo;
            }
        }

        // GENERAR HTML
        const buttonsHTML = getButtons(task, taskOwnerId, myMongoId);

        const html = `
            <div class="task-card priority-${task.difficulty}">
                <div style="display:flex; justify-content:space-between;">
                    <strong>${task.description}</strong>
                    <span style="font-size:0.8em; font-weight:bold;">[${task.difficulty}]</span>
                </div>
                <small>Estado: <b style="color:blue">${task.status}</b> | ⏱ ${task.duration}m</small>
                <div style="margin-top:8px; border-top:1px solid #eee; padding-top:5px;">
                    ${buttonsHTML}
                </div>
            </div>
        `;

       
        if (!task.assignedTo && task.status !== 'done') {
            listFree.innerHTML += html;
            freeCount++;
        }

        
        // Comparamos el ID de la tarea con MI ID de Mongo
        if (taskOwnerId === myMongoId && task.status !== 'done') {
            listMine.innerHTML += html;
        }

        
        if (user.roles && user.roles.includes('ADMIN_ROLE')) {
             const adminHtml = `
            <div class="task-card" style="border-left: 5px solid #333; background:#f9f9f9;">
                <strong>${task.description}</strong> <small>(${task.status})</small><br>
                <small>Dueño ID: ${taskOwnerId ? taskOwnerId.substring(0,5)+'...' : 'Libre'}</small>
                <div style="margin-top:5px;">${buttonsHTML}</div>
            </div>`;
            listAll.innerHTML += adminHtml;
        }
    });

    
    document.getElementById('socket-counter').innerText = freeCount;
}

function getButtons(task, taskOwnerId, myMongoId) {
    let btns = '';

    // ===========================================
    // CASO 1: TAREA LIBRE (Nadie la tiene)
    // ===========================================
    if (!task.assignedTo && task.status !== 'done') {
        // Solo mostramos botón de coger
        btns += `<button onclick="takeTask('${task._id}')" class="btn btn-green" style="width:100%">✋ Coger</button>`;
    }

    // ===========================================
    // CASO 2: ES MÍA (La tengo asignada)
    // ===========================================
    if (taskOwnerId === myMongoId && task.status !== 'done') {
        
        // --- GESTIÓN DE ESTADOS (Tu Máquina de Estados) ---
        
        if (task.status === 'todo') {
            // De TODO solo podemos pasar a DOING
            btns += `<button onclick="changeStatus('${task._id}', 'doing')" class="btn" style="background:#fffacd; width:100%; margin-bottom:5px;">▶️ Empezar</button>`;
        } 
        else if (task.status === 'doing') {
            // De DOING podemos pasar a DONE (Fin) ...
            btns += `<button onclick="changeStatus('${task._id}', 'done')" class="btn" style="background:#ccffcc; width:48%;">✅ Fin</button> `;
            // ... o volver a TODO (Reiniciar/Equivocación)
            btns += `<button onclick="changeStatus('${task._id}', 'todo')" class="btn" style="background:#e0e0e0; width:48%;">⏮️</button>`;
        }

        // Botón SOLTAR (Siempre disponible si no está terminada)
        btns += `<button onclick="releaseTask('${task._id}')" class="btn" style="background:#ffcccc; width:100%; margin-top:5px;">❌ Soltar</button>`;
    }

    // ===========================================
    // CASO 3: SOY ADMIN (Botones extra)
    // ===========================================
    if (user.roles && user.roles.includes('ADMIN_ROLE')) {
        btns += ` <button onclick="deleteTask('${task._id}')" style="float:right; border:none; cursor:pointer; margin-top:5px;">🗑️</button>`;
    }

    return btns;
}

// ================= ACCIONES (FETCH) =================

async function createTask() {
    const description = document.getElementById('new-desc').value;
    const difficulty = document.getElementById('new-diff').value;
    const duration = document.getElementById('new-dur').value;

    if(!description) return alert("Pon descripción");

    const resp = await fetch(`${URL_API}/tasks`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-token': token 
        },
        body: JSON.stringify({ description, difficulty, duration })
    });
    
    if(resp.ok) {
        document.getElementById('new-desc').value = '';
        refreshAdminData();
    } else {
        alert("Error creando tarea");
    }
}

async function takeTask(id) {
    console.log("Intentando coger tarea:", id);
    const resp = await fetch(`${URL_API}/tasks/${id}/take`, {
        method: 'PATCH',
        headers: { 'x-token': token }
    });
    if(resp.ok) refreshAdminData();
    else alert("Error al coger tarea");
}

async function releaseTask(id) {
    const resp = await fetch(`${URL_API}/tasks/${id}/release`, {
        method: 'PATCH',
        headers: { 'x-token': token }
    });
    if(resp.ok) refreshAdminData();;
}

async function changeStatus(id, newStatus) {
    const resp = await fetch(`${URL_API}/tasks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-token': token },
        body: JSON.stringify({ status: newStatus })
    });
    if(resp.ok) refreshAdminData();
}

async function deleteTask(id) {
    if(!confirm("¿Borrar?")) return;
    await fetch(`${URL_API}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'x-token': token }
    });
    refreshAdminData();
}

// ================= NUEVO ENDPOINT: FILTRAR POR ESTADO =================


async function filterByStatus(status) {
    const resultsBox = document.getElementById('filter-results');
    resultsBox.innerHTML = 'Cargando...';

    try {
        console.log(`📡 Pidiendo tareas con estado: ${status}...`);

        const resp = await fetch(`${URL_API}/tasks/filter/status?status=${status}`, {
            method: 'GET',
            headers: { 
                'x-token': token 
            }
        });

        const json = await resp.json();
        console.log("📦 RESPUESTA DEL SERVIDOR:", json); 

        if (json.success) {
            
            
            // Buscamos el array desesperadamente donde pueda estar
            let tasks = [];

            if (Array.isArray(json.data)) {
                // Caso A: data es la lista directa
                tasks = json.data;
            } else if (json.data && Array.isArray(json.data.tasks)) {
                // Caso B (EL TUYO): data es un objeto y dentro tiene tasks
                tasks = json.data.tasks;
            } else if (json.data && Array.isArray(json.data.data)) {
                // Caso C: data.data (paginaciones raras)
                tasks = json.data.data;
            } else if (Array.isArray(json.tasks)) {
                // Caso D: viene en la raíz
                tasks = json.tasks;
            }

     

            // Si llegamos aquí y sigue sin ser array, nos rendimos
            if (!Array.isArray(tasks)) {
                console.error("⚠️ IMPOSIBLE ENCONTRAR EL ARRAY. Estructura recibida:", json);
                resultsBox.innerHTML = `<span style="color:orange">Estructura de datos no reconocida. Mira la consola.</span>`;
                return;
            }

            if (tasks.length === 0) {
                resultsBox.innerHTML = `<b>No se encontraron tareas en estado: ${status}</b>`;
                return;
            }

            // Pintamos la lista
            let html = `<h4>Encontradas ${tasks.length} tareas en '${status}':</h4><ul>`;
            
            tasks.forEach(t => {
                let owner = 'Sin asignar';
                if (t.assignedTo) {
                    owner = (typeof t.assignedTo === 'object') ? (t.assignedTo.name || t.assignedTo.email) : 'ID: ' + t.assignedTo;
                }

                html += `
                    <li style="margin-bottom: 5px;">
                        <strong>${t.description}</strong> [${t.difficulty}] 
                        - <span style="color:grey">Dueño: ${owner}</span>
                    </li>`;
            });
            html += '</ul>';
            
            resultsBox.innerHTML = html;

        } else {
            resultsBox.innerHTML = `<span style="color:red">Error del Backend: ${json.message}</span>`;
        }

    } catch (error) {
        console.error("❌ ERROR CRÍTICO EN FRONTEND:", error);
        resultsBox.innerHTML = `<span style="color:red">Error de conexión</span>`;
    }
}

// ================= NUEVO ENDPOINT: ESTADÍSTICAS MAX DIFICULTAD =================

async function getDifficultyStats() {
    const resultsBox = document.getElementById('stats-results');
    resultsBox.innerHTML = 'Calculando...';

    try {
        const resp = await fetch(`${URL_API}/tasks/stats/max-difficulty`, {
            method: 'GET',
            headers: { 
                'x-token': token 
            }
        });

        const json = await resp.json();
        console.log("📊 STATS RESPUESTA:", json); // <--- El Chivato

        if (json.success) {
            // Tu controlador devuelve: { data: { level: 'XL', count: 5 } }
            // Ojo: A veces lo meten en json.data directamente
            const stats = json.data;

            if (!stats || (stats.count === 0 && !stats.level)) {
                resultsBox.innerHTML = `<b>No hay tareas activas en el sistema.</b>`;
                return;
            }

            // Pintamos el resultado bonito
            resultsBox.innerHTML = `
                <div style="text-align: center;">
                    Nivel Máximo Encontrado: <br>
                    <strong style="font-size: 2em; color: orangered;">${stats.level}</strong>
                    <br>
                    Hay <b>${stats.count}</b> tareas de este nivel.
                </div>
            `;

        } else {
            resultsBox.innerHTML = `<span style="color:red">Error: ${json.message}</span>`;
        }

    } catch (error) {
        console.error(error);
        resultsBox.innerHTML = `<span style="color:red">Error de conexión</span>`;
    }
}

// ================= NUEVO ENDPOINT: FILTRO POR RANGO =================

async function getTasksByRange() {
    const min = document.getElementById('range-min').value;
    const max = document.getElementById('range-max').value;
    const resultsBox = document.getElementById('range-results');

    resultsBox.innerHTML = 'Buscando...';

    try {
        console.log(`📡 Buscando rango: ${min} - ${max}`);

        // GET /api/tasks/range?min=XS&max=L
        const resp = await fetch(`${URL_API}/tasks/range?min=${min}&max=${max}`, {
            method: 'GET',
            headers: { 'x-token': token }
        });

        const json = await resp.json();
        console.log("🟣 RANGO RESPUESTA:", json);

        if (json.success) {
            
            // --- BLINDAJE (Igual que en el otro filtro) ---
            let tasks = [];
            if (Array.isArray(json.data)) tasks = json.data;
            else if (json.data && Array.isArray(json.data.tasks)) tasks = json.data.tasks;
            else if (json.data && Array.isArray(json.data.data)) tasks = json.data.data;

            if (!Array.isArray(tasks)) {
                resultsBox.innerHTML = `<span style="color:orange">Formato de datos raro. Mira consola.</span>`;
                return;
            }
            // ---------------------------------------------

            if (tasks.length === 0) {
                resultsBox.innerHTML = `<b>No hay tareas entre ${min} y ${max}.</b>`;
                return;
            }

            let html = `<h4>${tasks.length} tareas encontradas (Rango ${min}-${max}):</h4><ul>`;
            tasks.forEach(t => {
                html += `
                    <li style="margin-bottom: 5px;">
                        <strong>${t.description}</strong> 
                        <span style="background:purple; color:white; padding:2px 5px; font-size:0.8em;">${t.difficulty}</span>
                    </li>`;
            });
            html += '</ul>';
            
            resultsBox.innerHTML = html;

        } else {
            // Si el backend devuelve error (ej: Min > Max)
            resultsBox.innerHTML = `<span style="color:red">Error: ${json.message || JSON.stringify(json.errors)}</span>`;
        }

    } catch (error) {
        console.error(error);
        resultsBox.innerHTML = `<span style="color:red">Error de conexión</span>`;
    }
}

// ================= NUEVO ENDPOINT: ASIGNAR TAREA (Admin) =================


async function populateAssignSelects() {
    const taskSelect = document.getElementById('assign-task-select');
    const userSelect = document.getElementById('assign-user-select');

    try {
        // --- A. CARGAR TAREAS ---
        const respTasks = await fetch(`${URL_API}/tasks`, { headers: { 'x-token': token } });
        const jsonTasks = await respTasks.json();
        
        let tasks = [];
        if (jsonTasks.data) tasks = Array.isArray(jsonTasks.data) ? jsonTasks.data : jsonTasks.data.tasks || [];
        else if (jsonTasks.tasks) tasks = jsonTasks.tasks;

        taskSelect.innerHTML = '<option value="">-- Elige Tarea --</option>';
        tasks.forEach(t => {
            if (t.status !== 'done') {
                const isAssigned = t.assignedTo ? '(Ocupada)' : '(Libre)';
                taskSelect.innerHTML += `<option value="${t._id}">${t.description} [${t.difficulty}] ${isAssigned}</option>`;
            }
        });

        // --- B. CARGAR USUARIOS ---
        const respUsers = await fetch(`${URL_API}/users`, { headers: { 'x-token': token } });
        const jsonUsers = await respUsers.json();
        
        let users = [];
        if (Array.isArray(jsonUsers)) users = jsonUsers; 
        else if (jsonUsers.data) users = jsonUsers.data;
        else if (jsonUsers.users) users = jsonUsers.users;

        userSelect.innerHTML = '<option value="">-- Elige Usuario --</option>';
        users.forEach(u => {
            
            const mongoId = u._id || u.uid; // Usamos _id, si no existe probamos uid por si acaso
            
            userSelect.innerHTML += `<option value="${mongoId}">${u.name} (${u.email})</option>`;
        });

    } catch (error) {
        console.error("Error cargando selects:", error);
        userSelect.innerHTML = '<option>Error cargando usuarios</option>';
    }
}
// 2. Función para ejecutar la asignación
async function forceAssignTask() {
    const taskId = document.getElementById('assign-task-select').value;
    const userId = document.getElementById('assign-user-select').value;
    const resultP = document.getElementById('assign-result');

    if (!taskId || !userId) {
        alert("¡Selecciona tarea y usuario!");
        return;
    }

    try {
        console.log(`🔗 Asignando Tarea ${taskId} al Usuario ${userId}`);

        // PATCH /api/tasks/:id/assign -> Body: { userId: ... }
        const resp = await fetch(`${URL_API}/tasks/${taskId}/assign`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'x-token': token 
            },
            body: JSON.stringify({ userId: userId })
        });

        const json = await resp.json();

        if (resp.ok) {
            resultP.innerHTML = `<span style="color:green">✅ ¡Asignada con éxito!</span>`;
            // Recargamos todo para ver el cambio
            refreshAdminData();
             // Recargamos selects por si cambió el estado
        } else {
            // Sacar mensaje de error (puede venir en errors array o message)
            const msg = json.message || (json.errors ? json.errors[0].msg : 'Error desconocido');
            resultP.innerHTML = `<span style="color:red">❌ Error: ${msg}</span>`;
        }

    } catch (error) {
        console.error(error);
        resultP.innerHTML = `<span style="color:red">Error de conexión</span>`;
    }
}
// ================= NUEVO ENDPOINT: EJECUTAR SEED (RESET) =================

async function executeSeed() {
    
    const confirmation = confirm("⚠️ ¿ESTÁS SEGURO?\n\nEsto borrará TODOS los usuarios y tareas actuales.\nTendrás que volver a iniciar sesión.");
    
    if (!confirmation) return;

    try {
        console.log("☢️ Iniciando proceso de Seed...");
        
        const resp = await fetch(`${URL_API}/tasks/seed`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-token': token 
            }
        });

        const json = await resp.json();

        if (resp.ok) {
            alert(`✅ BASE DE DATOS REINICIADA CORRECTAMENTE.\n\nDatos creados:\n- Usuarios: ${json.stats?.usersCreated || 'Muchos'}\n- Tareas: ${json.stats?.tasksCreated || 'Muchas'}\n\nVas a ser desconectado para iniciar sesión con las nuevas credenciales.`);
            
            // Forzamos Logout porque el token antiguo ya no sirve (el usuario ha sido borrado y recreado)
            logout(); 
        } else {
            alert(`❌ Error al ejecutar Seed: ${json.message}`);
        }

    } catch (error) {
        console.error(error);
        alert("Error de conexión al intentar resetear la BBDD");
    }
}

// ================= NUEVO ENDPOINT: EDITAR TAREA (PUT) =================

// Variable global para guardar las tareas cargadas y poder rellenar el formulario sin pedir otra vez al server


async function populateEditSelect() {
    const select = document.getElementById('edit-task-select');
    try {
        const resp = await fetch(`${URL_API}/tasks`, { headers: { 'x-token': token } });
        const json = await resp.json();
        
        // Blindaje habitual
        if (json.data) tasksForEdit = Array.isArray(json.data) ? json.data : json.data.tasks || [];
        else if (json.tasks) tasksForEdit = json.tasks;
        else tasksForEdit = [];

        select.innerHTML = '<option value="">-- Selecciona Tarea para Editar --</option>';
        tasksForEdit.forEach(t => {
            select.innerHTML += `<option value="${t._id}">${t.description} [${t.difficulty}]</option>`;
        });
    } catch (e) { console.error(e); }
}


function fillEditForm() {
    const taskId = document.getElementById('edit-task-select').value;
    const task = tasksForEdit.find(t => t._id === taskId);

    if (task) {
        document.getElementById('edit-desc').value = task.description;
        document.getElementById('edit-diff').value = task.difficulty;
        document.getElementById('edit-dur').value = task.duration;
        document.getElementById('edit-status').value = task.status;
    }
}


async function updateTaskFull() {
    const taskId = document.getElementById('edit-task-select').value;
    const resultBox = document.getElementById('edit-result');

    if (!taskId) return alert("Selecciona una tarea primero");

    const body = {
        description: document.getElementById('edit-desc').value,
        difficulty: document.getElementById('edit-diff').value,
        duration: document.getElementById('edit-dur').value,
        status: document.getElementById('edit-status').value
    };

    try {
        const resp = await fetch(`${URL_API}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'x-token': token 
            },
            body: JSON.stringify(body)
        });

        const json = await resp.json();

        if (resp.ok) {
            resultBox.innerHTML = `<span style="color:green">✅ Tarea actualizada correctamente</span>`;
            refreshAdminData();
        } else {
            // Aquí saldrá el error si el backend prohíbe el cambio de estado
            const msg = json.message || (json.errors ? json.errors[0].msg : 'Error desconocido');
            resultBox.innerHTML = `<span style="color:red">❌ Error: ${msg}</span>`;
        }
    } catch (error) {
        console.error(error);
        resultBox.innerHTML = "Error de conexión";
    }
}

// ================= CRUD DE USUARIOS (ADMIN) =================


async function loadAdminUsers() {
    const listDiv = document.getElementById('crud-users-list');
    listDiv.innerHTML = 'Cargando usuarios...';

    try {
        
        const resp = await fetch(`${URL_API}/users`, { headers: { 'x-token': token } });
        const json = await resp.json();

        // Blindaje para sacar el array
        let users = [];
        if (Array.isArray(json)) users = json;
        else if (json.users) users = json.users;
        else if (json.data) users = json.data;

        if (users.length === 0) {
            listDiv.innerHTML = "No hay usuarios activos.";
            return;
        }

        // Generar HTML
        let html = `<table style="width:100%; border-collapse:collapse;">
            <tr style="background:#ccc;">
                <th style="border:1px solid #999; padding:5px;">Nombre</th>
                <th style="border:1px solid #999; padding:5px;">Email</th>
                <th style="border:1px solid #999; padding:5px;">Acciones</th>
            </tr>`;

        users.forEach(u => {
            const userId = u._id || u.uid || u.id; // Asegurar ID
            html += `
                <tr>
                    <td style="border:1px solid #999; padding:5px;">${u.name}</td>
                    <td style="border:1px solid #999; padding:5px;">${u.email}</td>
                    <td style="border:1px solid #999; padding:5px; text-align:center;">
                        <button onclick="editUserLoad('${userId}')" style="cursor:pointer;">✏️</button>
                        <button onclick="deleteUserAdmin('${userId}')" style="cursor:pointer; color:red;">🗑️</button>
                    </td>
                </tr>
            `;
        });
        html += `</table>`;
        listDiv.innerHTML = html;

    } catch (error) {
        console.error(error);
        listDiv.innerHTML = "Error cargando lista de usuarios.";
    }
}


async function saveUserAdmin() {
    const id = document.getElementById('crud-user-id').value; // Si tiene valor, es UPDATE
    const name = document.getElementById('crud-name').value;
    const email = document.getElementById('crud-email').value;
    const password = document.getElementById('crud-password').value;
    const msg = document.getElementById('crud-message');

    const body = { name, email };
    
    // La contraseña es obligatoria en POST, opcional en PUT (normalmente)
    if (password) body.password = password;

    try {
        let resp;
        if (id) {
            // --- MODO EDICIÓN (PUT /users/:id) ---
            console.log("✏️ Actualizando usuario:", id);
            resp = await fetch(`${URL_API}/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-token': token },
                body: JSON.stringify(body)
            });
        } else {
            // --- MODO CREACIÓN (POST /users) ---
            console.log("✨ Creando usuario nuevo");
            // Nota: Aquí creamos usuario como Admin, sin registro público
            resp = await fetch(`${URL_API}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-token': token },
                body: JSON.stringify(body)
            });
        }

        const json = await resp.json();

        if (resp.ok) {
            msg.innerHTML = `<span style="color:green">✅ Operación exitosa</span>`;
            resetUserForm(); // Limpiar formulario
            loadAdminUsers(); // Recargar lista
            populateAssignSelects(); // Recargar el select de asignar tareas también
        } else {
            // Mostrar error bonito
            const errorText = json.message || (json.errors ? json.errors[0].msg : 'Error');
            msg.innerHTML = `<span style="color:red">❌ ${errorText}</span>`;
        }

    } catch (e) {
        console.error(e);
        msg.innerHTML = "Error de conexión";
    }
}

// 3. OBTENER UN USUARIO POR ID (GET /:id) -> Para rellenar el formulario
async function editUserLoad(id) {
    const msg = document.getElementById('crud-message');
    msg.innerText = "Cargando datos del usuario...";

    try {
        const resp = await fetch(`${URL_API}/users/${id}`, { headers: { 'x-token': token } });
        const json = await resp.json();

        if (resp.ok) {
            // Tu endpoint puede devolver { user: ... } o { data: ... } o directo
            const user = json.user || json.data || json;
            
            // Rellenamos el formulario
            document.getElementById('crud-user-id').value = user._id || user.uid; // IMPORTANTE
            document.getElementById('crud-name').value = user.name;
            document.getElementById('crud-email').value = user.email;
            document.getElementById('crud-password').value = ""; // La contraseña no se muestra por seguridad
            
            msg.innerHTML = `<span style="color:blue">ℹ️ Editando a: ${user.name}</span>`;
            // Scroll suave hacia el formulario
            document.getElementById('admin-users-box').scrollIntoView({ behavior: 'smooth' });
        } else {
            alert("Error al obtener usuario: " + json.message);
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión");
    }
}


async function deleteUserAdmin(id) {
    if(!confirm("¿Seguro que quieres borrar (soft-delete) a este usuario?")) return;

    try {
        const resp = await fetch(`${URL_API}/users/${id}`, {
            method: 'DELETE',
            headers: { 'x-token': token }
        });
        
        if (resp.ok) {
            loadAdminUsers(); // Recargar lista
            populateAssignSelects(); // Actualizar selects de arriba
        } else {
            alert("No se pudo borrar");
        }
    } catch (e) {
        console.error(e);
    }
}


function resetUserForm() {
    document.getElementById('crud-user-id').value = '';
    document.getElementById('crud-name').value = '';
    document.getElementById('crud-email').value = '';
    document.getElementById('crud-password').value = '';
    document.getElementById('crud-message').innerText = '';
}

// ================= NUEVO: LABORATORIO DE FILTROS (VERSIÓN GRAPHQL DUAL) =================

// DEFINIMOS LAS DOS RUTAS EXACTAS QUE TIENES EN TU SERVER.JS
const URL_GQL_PUBLIC = 'http://localhost:9090/graphql-public';
const URL_GQL_PRIVATE = 'http://localhost:9090/graphql-private';

// 1. Helper dinámico: Recibe la URL (Pública o Privada)
async function fetchGraphQL(targetUrl, query, variables = {}) {
    const resp = await fetch(targetUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-token': token // Enviamos el token siempre (en la pública se ignora, en la privada se usa)
        },
        body: JSON.stringify({
            query: query,
            variables: variables
        })
    });
    return await resp.json();
}

// 2. Llenar select de usuarios (Sigue usando REST, no tocamos nada)
async function populateLabSelects() {
    const userSelect = document.getElementById('lab-user-select');
    try {
        const resp = await fetch(`${URL_API}/users`, { headers: { 'x-token': token } });
        const json = await resp.json();
        
        let users = [];
        if (Array.isArray(json)) users = json; 
        else if (json.data) users = json.data;
        else if (json.users) users = json.users;

        userSelect.innerHTML = '<option value="">-- Elige Usuario --</option>';
        users.forEach(u => {
            const id = u._id || u.uid || u.id;
            userSelect.innerHTML += `<option value="${id}">${u.name}</option>`;
        });
    } catch (e) { console.error(e); }
}

// 3. Pintar Resultados
function printLabResults(title, tasks) {
    const box = document.getElementById('lab-results');
    if (!tasks || tasks.length === 0) {
        box.innerHTML = `<b>${title}:</b> 0 resultados encontrados.`;
        return;
    }

    let html = `<h4>${title} (${tasks.length}):</h4><ul>`;
    tasks.forEach(t => {
        const ownerName = t.assignedTo ? t.assignedTo.name : 'Sin asignar';
        html += `<li>
            <strong>${t.description}</strong> [${t.difficulty}] 
            <br><small>Status: ${t.status} | Owner: ${ownerName}</small>
        </li>`;
    });
    html += '</ul>';
    box.innerHTML = html;
}

// --- BOTÓN 1: FILTRO POR DIFICULTAD (PÚBLICO) ---
async function labFilterDifficulty() {
    const diff = document.getElementById('lab-diff-select').value;
    
    const query = `
        query($difficulty: String!) {
            getTasksByDifficulty(difficulty: $difficulty) {
                id
                description
                difficulty
                status
                assignedTo {
                    name
                }
            }
        }
    `;

    try {
        // 👇 USAMOS LA URL PÚBLICA
        const json = await fetchGraphQL(URL_GQL_PUBLIC, query, { difficulty: diff });
        
        if (json.errors) {
            alert("Error GraphQL: " + json.errors[0].message);
        } else {
            printLabResults(`Dificultad '${diff}'`, json.data.getTasksByDifficulty);
        }
    } catch (e) { console.error(e); alert("Error conexión GQL Público"); }
}

// --- BOTÓN 2: FILTRO POR USUARIO (PRIVADO) ---
async function labFilterUser() {
    const userId = document.getElementById('lab-user-select').value;
    if(!userId) return alert("Elige usuario");

    const query = `
        query($userId: ID!) {
            getTasksByUserId(userId: $userId) {
                id
                description
                difficulty
                status
                assignedTo {
                    name
                }
            }
        }
    `;

    try {
        // 👇 USAMOS LA URL PRIVADA
        const json = await fetchGraphQL(URL_GQL_PRIVATE, query, { userId });
        
        if (json.errors) {
            alert("⚠️ " + json.errors[0].message);
        } else {
            printLabResults(`Tareas del Usuario`, json.data.getTasksByUserId);
        }
    } catch (e) { console.error(e); alert("Error conexión GQL Privado"); }
}

// --- BOTÓN 3: COMBO USUARIO + DIFICULTAD (PRIVADO) ---
async function labFilterUserAndDiff() {
    const userId = document.getElementById('lab-user-select').value;
    const diff = document.getElementById('lab-diff-select').value;
    if(!userId) return alert("Elige usuario");

    const query = `
        query($userId: ID!, $difficulty: String!) {
            getTasksByUserAndDifficulty(userId: $userId, difficulty: $difficulty) {
                id
                description
                difficulty
                status
            }
        }
    `;

    try {
        // 👇 USAMOS LA URL PRIVADA
        const json = await fetchGraphQL(URL_GQL_PRIVATE, query, { userId, difficulty: diff });

        if (json.errors) {
            alert("⚠️ " + json.errors[0].message);
        } else {
            printLabResults(`User + Diff '${diff}'`, json.data.getTasksByUserAndDifficulty);
        }
    } catch (e) { console.error(e); alert("Error conexión GQL Privado"); }
}

// --- BOTÓN 4: SIN ASIGNAR (PÚBLICO) ---
async function labFilterUnassigned() {
    const query = `
        query {
            getUnassignedTasks {
                id
                description
                difficulty
                status
            }
        }
    `;

    try {
        // 👇 USAMOS LA URL PÚBLICA
        const json = await fetchGraphQL(URL_GQL_PUBLIC, query);

        if (json.errors) {
            alert("Error GraphQL: " + json.errors[0].message);
        } else {
            printLabResults(`Tareas Sin Asignar`, json.data.getUnassignedTasks);
        }
    } catch (e) { console.error(e); alert("Error conexión GQL Público"); }
}