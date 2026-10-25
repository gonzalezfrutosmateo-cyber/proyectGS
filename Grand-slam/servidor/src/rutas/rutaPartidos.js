import { Router } from 'express';
import { 
    menuPartidos, listarPartidos, formularioCrear, crearPartido, 
    seleccionarModificar, formularioEditar, editarPartido,
    seleccionarEliminar, eliminarPartido, verPartidosPorJugador, buscarPartidos, verRankingPartidos, verEnfrentamientos
} from '../controllers/controladorPartidos.js';

const router = Router();

router.get('/', menuPartidos);
router.get('/ver', listarPartidos);
router.get('/buscar', buscarPartidos);
router.get('/crear', formularioCrear);
router.post('/crear', crearPartido);
router.get('/modificar', seleccionarModificar);
router.get('/modificar/:id', formularioEditar);
router.post('/modificar/:id', editarPartido);
router.get('/eliminar', seleccionarEliminar);
router.get('/eliminar/:id', eliminarPartido);

// Consulta extra
router.get('/jugador', verPartidosPorJugador);
router.get('/ranking', verRankingPartidos);
router.get('/enfrentamientos', verEnfrentamientos);

export default router;