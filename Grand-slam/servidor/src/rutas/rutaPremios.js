import { Router } from 'express';
import { 
    menuPremios, listarPremios, formularioCrear, crearPremio, 
    seleccionarModificar, formularioEditar, editarPremio, 
    seleccionarEliminar, eliminarPremio, buscarPremios,
    verPremiosPorSedes, verPremiosPorPais, verPremiosUnaSede, verPremiosPorJugadores
} from '../controllers/controladorPremios.js';

const router = Router();

router.get('/', menuPremios);
router.get('/ver', listarPremios);
router.get('/buscar', buscarPremios);
router.get('/crear', formularioCrear);
router.post('/crear', crearPremio);
router.get('/modificar', seleccionarModificar);
router.get('/modificar/:id', formularioEditar);
router.post('/modificar/:id', editarPremio);
router.get('/eliminar', seleccionarEliminar);
router.get('/eliminar/:id', eliminarPremio);

// Consultas
router.get('/sedes', verPremiosPorSedes);
router.get('/pais', verPremiosPorPais);
router.get('/unaSede', verPremiosUnaSede);
router.get('/jugadores', verPremiosPorJugadores);

export default router;