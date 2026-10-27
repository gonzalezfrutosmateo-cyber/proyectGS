import { Router } from 'express';
import { 
    menuArbitros, listarArbitros, formularioCrear, crearArbitro, 
    seleccionarModificar, formularioEditar, editarArbitro,
    seleccionarEliminar, eliminarArbitro, verArbitrosPorTorneo, buscarArbitros,
    verArbitroMasPartidos, verArbitrosFinales
} from '../controllers/controladorArbitros.js';

const router = Router();

router.get('/', menuArbitros);

// CRUD
router.get('/ver', listarArbitros);
router.get('/buscar', buscarArbitros);
router.get('/crear', formularioCrear);
router.post('/crear', crearArbitro);

router.get('/modificar', seleccionarModificar);
router.get('/modificar/:id', formularioEditar);
router.post('/modificar/:id', editarArbitro);

router.get('/eliminar', seleccionarEliminar);
router.get('/eliminar/:id', eliminarArbitro);

// Consulta 2
router.get('/torneo', verArbitrosPorTorneo);

// Consultas nuevas
router.get('/mas-partidos', verArbitroMasPartidos);
router.get('/finales', verArbitrosFinales);

export default router;