import { Router } from 'express';
import { 
    menuTorneos, listarTorneos, formularioCrear, crearTorneo, 
    seleccionarModificar, formularioEditar, editarTorneo,
    seleccionarEliminar, eliminarTorneo, verResultados, buscarTorneos, verCampeones, verResumenTorneos
} from '../controllers/controladorTorneos.js';

const router = Router();

router.get('/', menuTorneos);

// CRUD
router.get('/ver', listarTorneos);
router.get('/buscar', buscarTorneos);
router.get('/crear', formularioCrear);
router.post('/crear', crearTorneo);

router.get('/modificar', seleccionarModificar);
router.get('/modificar/:id', formularioEditar);
router.post('/modificar/:id', editarTorneo);

router.get('/eliminar', seleccionarEliminar);
router.get('/eliminar/:id', eliminarTorneo);

// Consulta 1
router.get('/resultados', verResultados);
router.get('/campeones', verCampeones);
router.get('/resumen', verResumenTorneos);

export default router;