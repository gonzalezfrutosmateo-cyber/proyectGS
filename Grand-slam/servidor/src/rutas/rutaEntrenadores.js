import { Router } from 'express';
import { 
    menuEntrenadores, listarEntrenadores, formularioCrear, crearEntrenador, 
    seleccionarModificar, formularioEditar, editarEntrenador,
    seleccionarEliminar, eliminarEntrenador, verEntrenadoresJugador, buscarEntrenadores
} from '../controllers/controladorEntrenadores.js';

const router = Router();

router.get('/', menuEntrenadores);
router.get('/ver', listarEntrenadores);
router.get('/buscar', buscarEntrenadores);
router.get('/crear', formularioCrear);
router.post('/crear', crearEntrenador);
router.get('/modificar', seleccionarModificar);
router.get('/modificar/:id', formularioEditar);
router.post('/modificar/:id', editarEntrenador);
router.get('/eliminar', seleccionarEliminar);
router.get('/eliminar/:id', eliminarEntrenador);

// Consulta 4
router.get('/jugador', verEntrenadoresJugador);

export default router;