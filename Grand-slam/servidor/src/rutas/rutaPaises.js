import { Router } from 'express';
import { 
    menuPaises, listarPaises, formularioCrear, crearPais, 
    seleccionarModificar, formularioEditar, editarPais, 
    seleccionarEliminar, eliminarPais, buscarPaises
} from '../controllers/controladorPaises.js';

const router = Router();

router.get('/', menuPaises);
router.get('/ver', listarPaises);
router.get('/buscar', buscarPaises);
router.get('/crear', formularioCrear);
router.post('/crear', crearPais);
router.get('/modificar', seleccionarModificar);
router.get('/modificar/:id', formularioEditar);
router.post('/modificar/:id', editarPais);
router.get('/eliminar', seleccionarEliminar);
router.get('/eliminar/:id', eliminarPais);

export default router;