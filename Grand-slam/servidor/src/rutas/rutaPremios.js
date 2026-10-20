import { Router } from 'express';
import { 
    menuPremios, listarPremios, formularioCrear, crearPremio, 
    seleccionarModificar, formularioEditar, editarPremio, 
    seleccionarEliminar, eliminarPremio 
} from '../controllers/controladorPremios.js';

const router = Router();

router.get('/', menuPremios);
router.get('/ver', listarPremios);
router.get('/crear', formularioCrear);
router.post('/crear', crearPremio);
router.get('/modificar', seleccionarModificar);
router.get('/modificar/:id', formularioEditar);
router.post('/modificar/:id', editarPremio);
router.get('/eliminar', seleccionarEliminar);
router.get('/eliminar/:id', eliminarPremio);

export default router;