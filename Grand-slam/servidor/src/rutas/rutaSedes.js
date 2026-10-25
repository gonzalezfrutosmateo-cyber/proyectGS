import { Router } from 'express';
import { 
    menuSedes, listarSedes, formularioCrear, crearSede, 
    seleccionarModificar, formularioEditar, editarSede, 
    seleccionarEliminar, eliminarSede, buscarSedes,
    verSedesPorPremios, verSedesPorPaises, verSedesPorJugadores,
    verSedesSinPremios, verSedesPorPais
} from '../controllers/controladorSedes.js';

const router = Router();

router.get('/', menuSedes);
router.get('/ver', listarSedes);
router.get('/buscar', buscarSedes);
router.get('/crear', formularioCrear);
router.post('/crear', crearSede);
router.get('/modificar', seleccionarModificar);
router.get('/modificar/:id', formularioEditar);
router.post('/modificar/:id', editarSede);
router.get('/eliminar', seleccionarEliminar);
router.get('/eliminar/:id', eliminarSede);

// Consultas
router.get('/premios', verSedesPorPremios);
router.get('/paises', verSedesPorPaises);
router.get('/jugadores', verSedesPorJugadores);
router.get('/sinPremios', verSedesSinPremios);
router.get('/pais', verSedesPorPais);

export default router;