import { Router } from 'express';
import { 
    menuJugadores, formularioCrear, crearJugador, verJugadores, verJugadoresJSON,
    listarParaModificar, formularioEditar, modificarJugador, 
    listarParaEliminar, eliminarJugador, verGanancias 
} from '../controllers/controladorJugadores.js';

const router = Router();

// Ruta principal: carga el menú
router.get('/', menuJugadores);

// Crear
router.get('/crear', formularioCrear);
router.post('/crear', crearJugador);

// Ver
router.get('/ver', verJugadores);
router.get('/verTablaJugadores', verJugadoresJSON);

// Modificar (Usa method-override para el PUT)
router.get('/modificar', listarParaModificar);
router.get('/modificar/:id', formularioEditar);
router.put('/modificar/:id', modificarJugador);

// Eliminar (Usa method-override para el DELETE)
router.get('/eliminar', listarParaEliminar);
router.delete('/eliminar/:id', eliminarJugador);

// Reporte de la consigna
router.get('/ganancias/:id', verGanancias);

export default router;