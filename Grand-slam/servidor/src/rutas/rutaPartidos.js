import { Router } from 'express';
import { 
    menuPartidos, listarPartidos, formularioCrear, crearPartido, 
    seleccionarModificar, formularioEditar, editarPartido,
    seleccionarEliminar, eliminarPartido, verPartidosPorJugador
} from '../controllers/controladorPartidos.js';

const router = Router();

router.get('/', menuPartidos);
router.get('/ver', listarPartidos);
router.get('/crear', formularioCrear);
router.post('/crear', crearPartido);
router.get('/modificar', seleccionarModificar);
router.get('/modificar/:id', formularioEditar);
router.post('/modificar/:id', editarPartido);
router.get('/eliminar', seleccionarEliminar);
router.get('/eliminar/:id', eliminarPartido);

// Consulta extra
router.get('/jugador', verPartidosPorJugador);

export default router;