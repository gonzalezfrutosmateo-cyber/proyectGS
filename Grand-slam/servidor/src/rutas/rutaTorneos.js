import { Router } from 'express';
import { 
    menuTorneos, listarTorneos, formularioCrear, crearTorneo, 
    seleccionarModificar, formularioEditar, editarTorneo,
    seleccionarEliminar, eliminarTorneo, verResultados 
} from '../controllers/controladorTorneos.js';

const router = Router();

router.get('/', menuTorneos);

// CRUD
router.get('/ver', listarTorneos);
router.get('/crear', formularioCrear);
router.post('/crear', crearTorneo);

router.get('/modificar', seleccionarModificar);
router.get('/modificar/:id', formularioEditar);
router.post('/modificar/:id', editarTorneo);

router.get('/eliminar', seleccionarEliminar);
router.get('/eliminar/:id', eliminarTorneo);

// Consulta 1
router.get('/resultados', verResultados);

export default router;