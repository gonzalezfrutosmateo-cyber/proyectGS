# proyectGS — Grand History

Trabajo de base de datos sobre la historia de los torneos de Grand Slam.

- `torneo.mwb`: modelo de la base (MySQL Workbench). Es la fuente de la verdad del esquema.
  El SQL se saca con Forward Engineer; tildando "Generate INSERT statements for tables" salen tambien
  los datos de ejemplo que estan cargados en la pestana Inserts.
- `*.html`, `*.css`, `*.js`: front.

Las decisiones de modelado se discuten en los issues del repo. Aca quedan solo las reglas que la base
no puede forzar sola y que, por lo tanto, tiene que respetar quien carga los datos.

## Parejas en dobles (PARTIDO_JUGADOR)

No hay tabla `PAREJA`. La pareja son **los dos jugadores con el mismo `rol` en el mismo partido**.

| Modalidad | Filas en PARTIDO_JUGADOR por partido |
|---|---|
| individual masculino / femenino | 2: un `ganador` y un `perdedor` |
| dobles masculino / femenino / mixto | 4: dos `ganador` y dos `perdedor` |

**Lo que valida la base:** la PK `(PARTIDO_id_partido, JUGADOR_id_jugador)` impide cargar dos veces al
mismo jugador en el mismo partido, y que alguien sea ganador y perdedor a la vez.

**Lo que NO valida la base:** la cantidad de filas por rol. Se puede cargar un individual con tres
ganadores sin que la base se queje. **Esa validacion va en el backend**, al dar de alta el partido, segun
la modalidad: 1 + 1 en individuales, 2 + 2 en dobles. Se eligio el backend y no un TRIGGER porque es mas
simple de escribir, de probar y de mostrar.

Consulta de control, para detectar partidos mal cargados:

```sql
SELECT p.id_partido, p.modalidad,
       SUM(pj.rol = 'ganador') AS ganadores, SUM(pj.rol = 'perdedor') AS perdedores
FROM PARTIDO p JOIN PARTIDO_JUGADOR pj ON pj.PARTIDO_id_partido = p.id_partido
GROUP BY p.id_partido, p.modalidad
HAVING (p.modalidad LIKE 'individual%' AND (ganadores <> 1 OR perdedores <> 1))
    OR (p.modalidad LIKE 'dobles%'     AND (ganadores <> 2 OR perdedores <> 2));
```

### Punto 9 de la consigna

"Noah ha jugado cuatro veces en dobles mixtos con Mandlikova" sale con un self-join de
`PARTIDO_JUGADOR` sobre el mismo partido y el mismo rol:

```sql
SELECT j2.apellido AS companero, COUNT(*) AS veces
FROM PARTIDO_JUGADOR a
JOIN PARTIDO_JUGADOR b ON b.PARTIDO_id_partido = a.PARTIDO_id_partido
                      AND b.rol = a.rol
                      AND b.JUGADOR_id_jugador <> a.JUGADOR_id_jugador
JOIN PARTIDO p  ON p.id_partido = a.PARTIDO_id_partido
JOIN JUGADOR j1 ON j1.id_jugador = a.JUGADOR_id_jugador
JOIN JUGADOR j2 ON j2.id_jugador = b.JUGADOR_id_jugador
WHERE p.modalidad = 'dobles-mixto' AND j1.apellido = 'Noah'
GROUP BY j2.id_jugador, j2.apellido;
```

Pendiente con el profe: los dobles mixtos suponen una pareja de un varon y una mujer, pero `JUGADOR` no
tiene una columna de sexo, asi que esa parte no se puede validar. La consigna no la pide.
