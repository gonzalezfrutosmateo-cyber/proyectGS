import { Router } from 'express';
import { 
    menuSedes, listarSedes, formularioCrear, crearSede, 
    seleccionarModificar, formularioEditar, editarSede, 
    seleccionarEliminar, eliminarSede 
} from '../controllers/controladorSedes.js';

const router = Router();

router.get('/', menuSedes);
router.get('/ver', listarSedes);
router.get('/crear', formularioCrear);
router.post('/crear', crearSede);
router.get('/modificar', seleccionarModificar);
router.get('/modificar/:id', formularioEditar);
router.post('/modificar/:id', editarSede);
router.get('/eliminar', seleccionarEliminar);
router.get('/eliminar/:id', eliminarSede);

export default router;