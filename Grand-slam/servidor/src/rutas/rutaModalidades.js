import { Router } from 'express';
import { 
    menuModalidades, listarModalidades, formularioCrear, crearModalidad, 
    seleccionarModificar, formularioEditar, editarModalidad, 
    seleccionarEliminar, eliminarModalidad, buscarModalidades, verEstadisticasModalidades
} from '../controllers/controladorModalidades.js';

const router = Router();

router.get('/', menuModalidades);
router.get('/ver', listarModalidades);
router.get('/buscar', buscarModalidades);
router.get('/crear', formularioCrear);
router.post('/crear', crearModalidad);
router.get('/modificar', seleccionarModificar);
router.get('/modificar/:id', formularioEditar);
router.post('/modificar/:id', editarModalidad);
router.get('/eliminar', seleccionarEliminar);
router.get('/eliminar/:id', eliminarModalidad);

// Consulta nueva
router.get('/estadisticas', verEstadisticasModalidades);

export default router;