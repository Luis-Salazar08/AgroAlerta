// 1. CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://offcdjnlftdcwmfohvxg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZmNkam5sZnRkY3dtZm9odnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwNTg0MjgsImV4cCI6MjExMDYzNDQyOH0.UA1aYxGB68hTW2oyTvBvA2A1j925gRpF4y1hVTQrENE';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Elementos del DOM
const formAgricultor = document.getElementById('form-agricultor');
const listaAgricultores = document.getElementById('lista-agricultores');

// 3. Cargar Dashboard (Indicadores)
async function cargarDashboard() {
    const { count: countAgr } = await db.from('agricultor').select('*', { count: 'exact', head: true });
    document.getElementById('dash-agricultores').textContent = countAgr || 0;

    const { count: countPar } = await db.from('parcela').select('*', { count: 'exact', head: true });
    document.getElementById('dash-parcelas').textContent = countPar || 0;

    const { count: countCam } = await db.from('campania').select('*', { count: 'exact', head: true });
    document.getElementById('dash-campanias').textContent = countCam || 0;
}

// 4. Leer y mostrar registros (READ)
let editIdAgricultor = null;

async function cargarAgricultores() {
    const { data, error } = await db
        .from('agricultor')
        .select('*')
        .order('id_agricultor', { ascending: false });

    if (error) {
        console.error('Error al cargar:', error);
        return;
    }

    listaAgricultores.innerHTML = '';
    data.forEach(agri => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${agri.nombres}</td>
            <td>${agri.apellidos}</td>
            <td>${agri.telefono || '-'}</td>
            <td>
                <button class="btn-editar" onclick="editarAgricultor(${agri.id_agricultor})">Editar</button>
                <button class="btn-eliminar" onclick="eliminarAgricultor(${agri.id_agricultor})">Eliminar</button>
            </td>
        `;
        listaAgricultores.appendChild(tr);
    });
}

// 5. Insertar o Actualizar Agricultor (CREATE / UPDATE)
formAgricultor.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        nombres: document.getElementById('nombres').value,
        apellidos: document.getElementById('apellidos').value,
        telefono: document.getElementById('telefono').value || null
    };

    const { error } = editIdAgricultor
        ? await db.from('agricultor').update(payload).eq('id_agricultor', editIdAgricultor)
        : await db.from('agricultor').insert([payload]);

    if (error) {
        alert('Error al guardar: ' + error.message);
    } else {
        editIdAgricultor = null;
        document.getElementById('titulo-form-agricultor').textContent = 'Registrar Nuevo Agricultor';
        document.getElementById('btn-submit-agricultor').textContent = 'Guardar Agricultor';
        formAgricultor.reset();
        cargarAgricultores();
        cargarDashboard();
    }
});

window.editarAgricultor = async (id) => {
    const { data } = await db.from('agricultor').select('*').eq('id_agricultor', id).single();
    if (data) {
        editIdAgricultor = id;
        document.getElementById('nombres').value = data.nombres;
        document.getElementById('apellidos').value = data.apellidos;
        document.getElementById('telefono').value = data.telefono || '';
        document.getElementById('titulo-form-agricultor').textContent = 'Editando Agricultor';
        document.getElementById('btn-submit-agricultor').textContent = 'Actualizar Agricultor';
    }
};

// 6. Eliminar registro (DELETE)
window.eliminarAgricultor = async (id) => {
    if (confirm('¿Estás seguro de eliminar este agricultor? También se borrarán sus parcelas asociadas.')) {
        const { error } = await db
            .from('agricultor')
            .delete()
            .eq('id_agricultor', id);

        if (error) {
            alert('Error al eliminar: ' + error.message);
        } else {
            cargarAgricultores();
            cargarDashboard();
        }
    }
};

// 7. Iniciar la aplicación al abrir la página
cargarDashboard();
cargarAgricultores();

// ==========================================
// 8. LÓGICA DE PESTAÑAS (NAVEGACIÓN)
// ==========================================
window.cambiarPestania = (evento, idPestania) => {
    document.querySelectorAll('.pestania-contenido').forEach(tab => tab.classList.remove('activa'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('activo'));
    
    document.getElementById(idPestania).classList.add('activa');
    evento.currentTarget.classList.add('activo');

    if (idPestania === 'sec-parcelas') {
        cargarSelectAgricultores();
        cargarParcelas();
    } else if (idPestania === 'sec-cultivos') {
        cargarCultivos();
    } else if (idPestania === 'sec-campanias') {
        cargarSelectsCampania();
        cargarCampanias();
    } else if (idPestania === 'sec-riegos') {
        cargarSelectCampanias('rie-campania');
        cargarRiegos();
    } else if (idPestania === 'sec-gastos') {
        cargarSelectCampanias('gas-campania');
        cargarGastos();
    } else if (idPestania === 'sec-cosechas') {
        cargarSelectCampanias('cos-campania');
        cargarCosechas();
    } else if (idPestania === 'sec-ventas') {
        cargarSelectCosechas();
        cargarVentas();
    } else if (idPestania === 'sec-rentabilidad') {
        cargarRentabilidad();
    }
};

// ==========================================
// 9. CRUD DE PARCELAS
// ==========================================
let editIdParcela = null;

async function cargarSelectAgricultores() {
    const { data } = await db.from('agricultor').select('id_agricultor, nombres, apellidos');
    const select = document.getElementById('par-agricultor');
    select.innerHTML = '<option value="">Seleccione un Agricultor...</option>';
    if (data) {
        data.forEach(agr => {
            select.innerHTML += `<option value="${agr.id_agricultor}">${agr.nombres} ${agr.apellidos}</option>`;
        });
    }
}

async function cargarParcelas() {
    const { data: agricultores } = await db.from('agricultor').select('id_agricultor, nombres, apellidos');
    const { data: parcelas } = await db.from('parcela').select('*').order('id_parcela', { ascending: false });

    const lista = document.getElementById('lista-parcelas');
    lista.innerHTML = '';
    
    if (parcelas && agricultores) {
        parcelas.forEach(par => {
            const duenio = agricultores.find(a => a.id_agricultor === par.id_agricultor);
            const propietario = duenio ? `${duenio.nombres} ${duenio.apellidos}` : 'Sin asignar';
            
            lista.innerHTML += `
                <tr>
                    <td>${propietario}</td>
                    <td>${par.nombre}</td>
                    <td>${par.area_hectareas}</td>
                    <td>${par.ubicacion || '-'}</td>
                    <td>
                        <button class="btn-editar" onclick="editarParcela(${par.id_parcela})">Editar</button>
                        <button class="btn-eliminar" onclick="eliminarParcela(${par.id_parcela})">Eliminar</button>
                    </td>
                </tr>`;
        });
    }
}

document.getElementById('form-parcela').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        id_agricultor: document.getElementById('par-agricultor').value,
        nombre: document.getElementById('par-nombre').value,
        area_hectareas: document.getElementById('par-hectareas').value,
        ubicacion: document.getElementById('par-ubicacion').value || null
    };

    const { error } = editIdParcela
        ? await db.from('parcela').update(payload).eq('id_parcela', editIdParcela)
        : await db.from('parcela').insert([payload]);
    
    if (!error) {
        editIdParcela = null;
        document.getElementById('titulo-form-parcela').textContent = 'Registrar Nueva Parcela';
        document.getElementById('btn-submit-parcela').textContent = 'Guardar Parcela';
        document.getElementById('form-parcela').reset();
        cargarParcelas();
        cargarDashboard();
    } else alert('Error: ' + error.message);
});

window.editarParcela = async (id) => {
    const { data } = await db.from('parcela').select('*').eq('id_parcela', id).single();
    if (data) {
        editIdParcela = id;
        document.getElementById('par-agricultor').value = data.id_agricultor;
        document.getElementById('par-nombre').value = data.nombre;
        document.getElementById('par-hectareas').value = data.area_hectareas;
        document.getElementById('par-ubicacion').value = data.ubicacion || '';
        document.getElementById('titulo-form-parcela').textContent = 'Editando Parcela';
        document.getElementById('btn-submit-parcela').textContent = 'Actualizar Parcela';
    }
};

window.eliminarParcela = async (id) => {
    if (confirm('¿Eliminar parcela?')) {
        await db.from('parcela').delete().eq('id_parcela', id);
        cargarParcelas();
        cargarDashboard();
    }
};

// ==========================================
// 10. CRUD DE CULTIVOS
// ==========================================
let editIdCultivo = null;

async function cargarCultivos() {
    const { data } = await db.from('cultivo').select('*').order('id_cultivo', { ascending: false });
    const lista = document.getElementById('lista-cultivos');
    lista.innerHTML = '';
    if (data) {
        data.forEach(cul => {
            lista.innerHTML += `
                <tr>
                    <td>${cul.nombre}</td>
                    <td>${cul.variedad}</td>
                    <td>
                        <button class="btn-editar" onclick="editarCultivo(${cul.id_cultivo})">Editar</button>
                        <button class="btn-eliminar" onclick="eliminarCultivo(${cul.id_cultivo})">Eliminar</button>
                    </td>
                </tr>`;
        });
    }
}

document.getElementById('form-cultivo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        nombre: document.getElementById('cul-nombre').value,
        variedad: document.getElementById('cul-variedad').value
    };

    const { error } = editIdCultivo
        ? await db.from('cultivo').update(payload).eq('id_cultivo', editIdCultivo)
        : await db.from('cultivo').insert([payload]);

    if (!error) {
        editIdCultivo = null;
        document.getElementById('titulo-form-cultivo').textContent = 'Registrar Nuevo Cultivo';
        document.getElementById('btn-submit-cultivo').textContent = 'Guardar Cultivo';
        document.getElementById('form-cultivo').reset();
        cargarCultivos();
    } else alert('Error: ' + error.message);
});

window.editarCultivo = async (id) => {
    const { data } = await db.from('cultivo').select('*').eq('id_cultivo', id).single();
    if (data) {
        editIdCultivo = id;
        document.getElementById('cul-nombre').value = data.nombre;
        document.getElementById('cul-variedad').value = data.variedad;
        document.getElementById('titulo-form-cultivo').textContent = 'Editando Cultivo';
        document.getElementById('btn-submit-cultivo').textContent = 'Actualizar Cultivo';
    }
};

window.eliminarCultivo = async (id) => {
    if (confirm('¿Eliminar cultivo?')) {
        await db.from('cultivo').delete().eq('id_cultivo', id);
        cargarCultivos();
    }
};

// Función auxiliar para llenar selectores de Campaña en Riego, Gasto y Cosecha
async function cargarSelectCampanias(idSelect) {
    const { data } = await db.from('campania').select('id_campania, nombre');
    const select = document.getElementById(idSelect);
    select.innerHTML = '<option value="">Seleccione Campaña...</option>';
    if (data) {
        data.forEach(c => {
            select.innerHTML += `<option value="${c.id_campania}">${c.nombre}</option>`;
        });
    }
}

// ==========================================
// 11. CRUD DE CAMPAÑAS
// ==========================================
let editIdCampania = null;

async function cargarSelectsCampania() {
    const [{ data: parcelas }, { data: cultivos }] = await Promise.all([
        db.from('parcela').select('id_parcela, nombre'),
        db.from('cultivo').select('id_cultivo, nombre, variedad')
    ]);

    const selPar = document.getElementById('cam-parcela');
    selPar.innerHTML = '<option value="">Seleccione Parcela...</option>';
    if (parcelas) parcelas.forEach(p => selPar.innerHTML += `<option value="${p.id_parcela}">${p.nombre}</option>`);

    const selCul = document.getElementById('cam-cultivo');
    selCul.innerHTML = '<option value="">Seleccione Cultivo...</option>';
    if (cultivos) cultivos.forEach(c => selCul.innerHTML += `<option value="${c.id_cultivo}">${c.nombre} (${c.variedad})</option>`);
}

async function cargarCampanias() {
    const [{ data: campanias }, { data: parcelas }, { data: cultivos }] = await Promise.all([
        db.from('campania').select('*').order('id_campania', { ascending: false }),
        db.from('parcela').select('id_parcela, nombre'),
        db.from('cultivo').select('id_cultivo, nombre, variedad')
    ]);

    const lista = document.getElementById('lista-campanias');
    lista.innerHTML = '';
    if (campanias) {
        campanias.forEach(cam => {
            const par = parcelas?.find(p => p.id_parcela === cam.id_parcela);
            const cul = cultivos?.find(c => c.id_cultivo === cam.id_cultivo);
            lista.innerHTML += `
                <tr>
                    <td>${cam.nombre}</td>
                    <td>${par ? par.nombre : '-'}</td>
                    <td>${cul ? `${cul.nombre} (${cul.variedad})` : '-'}</td>
                    <td>${cam.fecha_inicio}</td>
                    <td>${cam.fecha_fin || 'En curso'}</td>
                    <td>
                        <button class="btn-editar" onclick="editarCampania(${cam.id_campania})">Editar</button>
                        <button class="btn-eliminar" onclick="eliminarCampania(${cam.id_campania})">Eliminar</button>
                    </td>
                </tr>`;
        });
    }
}

document.getElementById('form-campania').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        id_parcela: document.getElementById('cam-parcela').value,
        id_cultivo: document.getElementById('cam-cultivo').value,
        nombre: document.getElementById('cam-nombre').value,
        fecha_inicio: document.getElementById('cam-inicio').value,
        fecha_fin: document.getElementById('cam-fin').value || null
    };

    const { error } = editIdCampania
        ? await db.from('campania').update(payload).eq('id_campania', editIdCampania)
        : await db.from('campania').insert([payload]);

    if (!error) {
        editIdCampania = null;
        document.getElementById('titulo-form-campania').textContent = 'Registrar Nueva Campaña';
        document.getElementById('btn-submit-campania').textContent = 'Guardar Campaña';
        document.getElementById('form-campania').reset();
        cargarCampanias();
        cargarDashboard();
    } else alert('Error: ' + error.message);
});

window.editarCampania = async (id) => {
    const { data } = await db.from('campania').select('*').eq('id_campania', id).single();
    if (data) {
        editIdCampania = id;
        document.getElementById('cam-parcela').value = data.id_parcela;
        document.getElementById('cam-cultivo').value = data.id_cultivo;
        document.getElementById('cam-nombre').value = data.nombre;
        document.getElementById('cam-inicio').value = data.fecha_inicio;
        document.getElementById('cam-fin').value = data.fecha_fin || '';
        document.getElementById('titulo-form-campania').textContent = 'Editando Campaña';
        document.getElementById('btn-submit-campania').textContent = 'Actualizar Campaña';
    }
};

window.eliminarCampania = async (id) => {
    if (confirm('¿Eliminar esta campaña y sus registros asociados?')) {
        await db.from('campania').delete().eq('id_campania', id);
        cargarCampanias();
        cargarDashboard();
    }
};

// ==========================================
// 12. CRUD DE RIEGOS
// ==========================================
let editIdRiego = null;

async function cargarRiegos() {
    const [{ data: riegos }, { data: campanias }] = await Promise.all([
        db.from('riego').select('*').order('id_riego', { ascending: false }),
        db.from('campania').select('id_campania, nombre')
    ]);

    const lista = document.getElementById('lista-riegos');
    lista.innerHTML = '';
    if (riegos) {
        riegos.forEach(rie => {
            const cam = campanias?.find(c => c.id_campania === rie.id_campania);
            lista.innerHTML += `
                <tr>
                    <td>${cam ? cam.nombre : '-'}</td>
                    <td>${rie.fecha_riego}</td>
                    <td>${rie.cantidad_m3} m³</td>
                    <td>${rie.observacion || '-'}</td>
                    <td>
                        <button class="btn-editar" onclick="editarRiego(${rie.id_riego})">Editar</button>
                        <button class="btn-eliminar" onclick="eliminarRiego(${rie.id_riego})">Eliminar</button>
                    </td>
                </tr>`;
        });
    }
}

document.getElementById('form-riego').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        id_campania: document.getElementById('rie-campania').value,
        fecha_riego: document.getElementById('rie-fecha').value,
        cantidad_m3: document.getElementById('rie-cantidad').value,
        observacion: document.getElementById('rie-observacion').value || null
    };

    const { error } = editIdRiego
        ? await db.from('riego').update(payload).eq('id_riego', editIdRiego)
        : await db.from('riego').insert([payload]);

    if (!error) {
        editIdRiego = null;
        document.getElementById('titulo-form-riego').textContent = 'Registrar Nuevo Riego';
        document.getElementById('btn-submit-riego').textContent = 'Guardar Riego';
        document.getElementById('form-riego').reset();
        cargarRiegos();
    } else alert('Error: ' + error.message);
});

window.editarRiego = async (id) => {
    const { data } = await db.from('riego').select('*').eq('id_riego', id).single();
    if (data) {
        editIdRiego = id;
        document.getElementById('rie-campania').value = data.id_campania;
        document.getElementById('rie-fecha').value = data.fecha_riego;
        document.getElementById('rie-cantidad').value = data.cantidad_m3;
        document.getElementById('rie-observacion').value = data.observacion || '';
        document.getElementById('titulo-form-riego').textContent = 'Editando Riego';
        document.getElementById('btn-submit-riego').textContent = 'Actualizar Riego';
    }
};

window.eliminarRiego = async (id) => {
    if (confirm('¿Eliminar registro de riego?')) {
        await db.from('riego').delete().eq('id_riego', id);
        cargarRiegos();
    }
};

// ==========================================
// 13. CRUD DE GASTOS
// ==========================================
let editIdGasto = null;

async function cargarGastos() {
    const [{ data: gastos }, { data: campanias }] = await Promise.all([
        db.from('gasto').select('*').order('id_gasto', { ascending: false }),
        db.from('campania').select('id_campania, nombre')
    ]);

    const lista = document.getElementById('lista-gastos');
    lista.innerHTML = '';
    if (gastos) {
        gastos.forEach(gas => {
            const cam = campanias?.find(c => c.id_campania === gas.id_campania);
            lista.innerHTML += `
                <tr>
                    <td>${cam ? cam.nombre : '-'}</td>
                    <td>${gas.concepto}</td>
                    <td>${gas.fecha_gasto}</td>
                    <td>S/ ${Number(gas.monto).toFixed(2)}</td>
                    <td>
                        <button class="btn-editar" onclick="editarGasto(${gas.id_gasto})">Editar</button>
                        <button class="btn-eliminar" onclick="eliminarGasto(${gas.id_gasto})">Eliminar</button>
                    </td>
                </tr>`;
        });
    }
}

document.getElementById('form-gasto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        id_campania: document.getElementById('gas-campania').value,
        concepto: document.getElementById('gas-concepto').value,
        fecha_gasto: document.getElementById('gas-fecha').value,
        monto: document.getElementById('gas-monto').value
    };

    const { error } = editIdGasto
        ? await db.from('gasto').update(payload).eq('id_gasto', editIdGasto)
        : await db.from('gasto').insert([payload]);

    if (!error) {
        editIdGasto = null;
        document.getElementById('titulo-form-gasto').textContent = 'Registrar Nuevo Gasto';
        document.getElementById('btn-submit-gasto').textContent = 'Guardar Gasto';
        document.getElementById('form-gasto').reset();
        cargarGastos();
    } else alert('Error: ' + error.message);
});

window.editarGasto = async (id) => {
    const { data } = await db.from('gasto').select('*').eq('id_gasto', id).single();
    if (data) {
        editIdGasto = id;
        document.getElementById('gas-campania').value = data.id_campania;
        document.getElementById('gas-concepto').value = data.concepto;
        document.getElementById('gas-fecha').value = data.fecha_gasto;
        document.getElementById('gas-monto').value = data.monto;
        document.getElementById('titulo-form-gasto').textContent = 'Editando Gasto';
        document.getElementById('btn-submit-gasto').textContent = 'Actualizar Gasto';
    }
};

window.eliminarGasto = async (id) => {
    if (confirm('¿Eliminar este gasto?')) {
        await db.from('gasto').delete().eq('id_gasto', id);
        cargarGastos();
    }
};

// ==========================================
// 14. CRUD DE COSECHAS
// ==========================================
let editIdCosecha = null;

async function cargarCosechas() {
    const [{ data: cosechas }, { data: campanias }] = await Promise.all([
        db.from('cosecha').select('*').order('id_cosecha', { ascending: false }),
        db.from('campania').select('id_campania, nombre')
    ]);

    const lista = document.getElementById('lista-cosechas');
    lista.innerHTML = '';
    if (cosechas) {
        cosechas.forEach(cos => {
            const cam = campanias?.find(c => c.id_campania === cos.id_campania);
            lista.innerHTML += `
                <tr>
                    <td>${cam ? cam.nombre : '-'}</td>
                    <td>${cos.fecha_cosecha}</td>
                    <td>${cos.cantidad_kg} kg</td>
                    <td>${cos.observacion || '-'}</td>
                    <td>
                        <button class="btn-editar" onclick="editarCosecha(${cos.id_cosecha})">Editar</button>
                        <button class="btn-eliminar" onclick="eliminarCosecha(${cos.id_cosecha})">Eliminar</button>
                    </td>
                </tr>`;
        });
    }
}

document.getElementById('form-cosecha').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        id_campania: document.getElementById('cos-campania').value,
        fecha_cosecha: document.getElementById('cos-fecha').value,
        cantidad_kg: document.getElementById('cos-cantidad').value,
        observacion: document.getElementById('cos-observacion').value || null
    };

    const { error } = editIdCosecha
        ? await db.from('cosecha').update(payload).eq('id_cosecha', editIdCosecha)
        : await db.from('cosecha').insert([payload]);

    if (!error) {
        editIdCosecha = null;
        document.getElementById('titulo-form-cosecha').textContent = 'Registrar Nueva Cosecha';
        document.getElementById('btn-submit-cosecha').textContent = 'Guardar Cosecha';
        document.getElementById('form-cosecha').reset();
        cargarCosechas();
    } else alert('Error: ' + error.message);
});

window.editarCosecha = async (id) => {
    const { data } = await db.from('cosecha').select('*').eq('id_cosecha', id).single();
    if (data) {
        editIdCosecha = id;
        document.getElementById('cos-campania').value = data.id_campania;
        document.getElementById('cos-fecha').value = data.fecha_cosecha;
        document.getElementById('cos-cantidad').value = data.cantidad_kg;
        document.getElementById('cos-observacion').value = data.observacion || '';
        document.getElementById('titulo-form-cosecha').textContent = 'Editando Cosecha';
        document.getElementById('btn-submit-cosecha').textContent = 'Actualizar Cosecha';
    }
};

window.eliminarCosecha = async (id) => {
    if (confirm('¿Eliminar esta cosecha y sus ventas asociadas?')) {
        await db.from('cosecha').delete().eq('id_cosecha', id);
        cargarCosechas();
    }
};

// ==========================================
// 15. CRUD DE VENTAS (CON VALIDACIÓN DE STOCK)
// ==========================================
let editIdVenta = null;

async function cargarSelectCosechas() {
    const [{ data: cosechas }, { data: campanias }, { data: ventas }] = await Promise.all([
        db.from('cosecha').select('id_cosecha, id_campania, fecha_cosecha, cantidad_kg'),
        db.from('campania').select('id_campania, nombre'),
        db.from('venta').select('id_cosecha, cantidad_kg')
    ]);

    const select = document.getElementById('ven-cosecha');
    select.innerHTML = '<option value="">Seleccione Cosecha...</option>';
    if (cosechas) {
        cosechas.forEach(cos => {
            const cam = campanias?.find(c => c.id_campania === cos.id_campania);
            const vendido = ventas
                ?.filter(v => v.id_cosecha === cos.id_cosecha)
                .reduce((acc, v) => acc + Number(v.cantidad_kg), 0) || 0;
            const disponible = Number(cos.cantidad_kg) - vendido;

            const estado = disponible <= 0 ? 'AGOTADO - 0 kg' : `Disp: ${disponible} kg`;
            const etiqueta = `${cam ? cam.nombre : 'Campaña'} | ${cos.fecha_cosecha} (${estado} de ${cos.cantidad_kg} kg)`;
            select.innerHTML += `<option value="${cos.id_cosecha}">${etiqueta}</option>`;
        });
    }
}

async function cargarVentas() {
    const [{ data: ventas }, { data: cosechas }, { data: campanias }] = await Promise.all([
        db.from('venta').select('*').order('id_venta', { ascending: false }),
        db.from('cosecha').select('id_cosecha, id_campania, fecha_cosecha'),
        db.from('campania').select('id_campania, nombre')
    ]);

    const lista = document.getElementById('lista-ventas');
    lista.innerHTML = '';
    if (ventas) {
        ventas.forEach(ven => {
            const cos = cosechas?.find(c => c.id_cosecha === ven.id_cosecha);
            const cam = cos ? campanias?.find(ca => ca.id_campania === cos.id_campania) : null;
            const origen = cos ? `${cam ? cam.nombre : ''} (${cos.fecha_cosecha})` : '-';

            lista.innerHTML += `
                <tr>
                    <td>${origen}</td>
                    <td>${ven.fecha_venta}</td>
                    <td>${ven.cantidad_kg} kg</td>
                    <td>S/ ${Number(ven.precio_total).toFixed(2)}</td>
                    <td>${ven.comprador}</td>
                    <td>
                        <button class="btn-editar" onclick="editarVenta(${ven.id_venta})">Editar</button>
                        <button class="btn-eliminar" onclick="eliminarVenta(${ven.id_venta})">Eliminar</button>
                    </td>
                </tr>`;
        });
    }
}

document.getElementById('form-venta').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id_cosecha = Number(document.getElementById('ven-cosecha').value);
    const cantidad_kg = Number(document.getElementById('ven-cantidad').value);
    const fecha_venta = document.getElementById('ven-fecha').value;
    const precio_total = Number(document.getElementById('ven-precio').value);
    const comprador = document.getElementById('ven-comprador').value;

    if (!id_cosecha || !fecha_venta) {
        alert('Por favor seleccione una cosecha y una fecha válida.');
        return;
    }

    // Validación de stock en el navegador antes de enviar
    const [{ data: cosecha }, { data: ventasPrevias }] = await Promise.all([
        db.from('cosecha').select('cantidad_kg').eq('id_cosecha', id_cosecha).single(),
        db.from('venta').select('id_venta, cantidad_kg').eq('id_cosecha', id_cosecha)
    ]);

    const vendido = ventasPrevias
        ?.filter(v => v.id_venta !== editIdVenta)
        .reduce((acc, v) => acc + Number(v.cantidad_kg), 0) || 0;
    const disponible = Number(cosecha?.cantidad_kg || 0) - vendido;

    if (cantidad_kg > disponible) {
        alert(`Stock insuficiente: solo quedan ${disponible} kg disponibles de esta cosecha.`);
        return;
    }

    const payload = { id_cosecha, fecha_venta, cantidad_kg, precio_total, comprador };

    const { error } = editIdVenta
        ? await db.from('venta').update(payload).eq('id_venta', editIdVenta)
        : await db.from('venta').insert([payload]);

    if (!error) {
        editIdVenta = null;
        document.getElementById('titulo-form-venta').textContent = 'Registrar Nueva Venta';
        document.getElementById('btn-submit-venta').textContent = 'Guardar Venta';
        document.getElementById('form-venta').reset();
        cargarVentas();
        cargarSelectCosechas();
    } else {
        alert('Error: ' + error.message);
    }
});

window.editarVenta = async (id) => {
    const { data } = await db.from('venta').select('*').eq('id_venta', id).single();
    if (data) {
        editIdVenta = id;
        document.getElementById('ven-cosecha').value = data.id_cosecha;
        document.getElementById('ven-fecha').value = data.fecha_venta;
        document.getElementById('ven-cantidad').value = data.cantidad_kg;
        document.getElementById('ven-precio').value = data.precio_total;
        document.getElementById('ven-comprador').value = data.comprador;
        document.getElementById('titulo-form-venta').textContent = 'Editando Venta';
        document.getElementById('btn-submit-venta').textContent = 'Actualizar Venta';
    }
};

window.eliminarVenta = async (id) => {
    if (confirm('¿Eliminar este registro de venta?')) {
        await db.from('venta').delete().eq('id_venta', id);
        cargarVentas();
        cargarSelectCosechas();
    }
};

// ==========================================
// 16. REPORTE DE RENTABILIDAD (VISTA SQL)
// ==========================================
async function cargarRentabilidad() {
    const { data, error } = await db.from('vista_rentabilidad_campania').select('*');
    const thead = document.getElementById('head-rentabilidad');
    const tbody = document.getElementById('lista-rentabilidad');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5">Error al cargar reporte: ${error.message}</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">Aún no hay datos de campañas para calcular rentabilidad.</td></tr>`;
        return;
    }

    const columnas = Object.keys(data[0]);

    thead.innerHTML = `<tr>${columnas.map(col => 
        `<th>${col.replace(/_/g, ' ').toUpperCase()}</th>`
    ).join('')}</tr>`;

    data.forEach(fila => {
        const celdas = columnas.map(col => {
            const valor = fila[col];
            const esMoneda = /gasto|venta|ingreso|costo|monto|ganancia|rentabilidad|utilidad|precio|saldo/i.test(col) && typeof valor === 'number';
            
            if (esMoneda) {
                const color = /ganancia|rentabilidad|utilidad|saldo/i.test(col)
                    ? (valor >= 0 ? 'color: #2e7d32; font-weight: bold;' : 'color: #c62828; font-weight: bold;')
                    : '';
                return `<td style="${color}">S/ ${Number(valor).toFixed(2)}</td>`;
            }
            return `<td>${valor ?? '-'}</td>`;
        }).join('');

        tbody.innerHTML += `<tr>${celdas}</tr>`;
    });
}