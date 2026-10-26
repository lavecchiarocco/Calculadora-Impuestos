# Logo TotalImport - guía rápida

## Carpetas
- `svg/`      Vectores (escalan sin perder calidad). Usalos siempre que puedas.
- `png/`      Versiones rasterizadas en varios tamaños (fondo transparente salvo "fondo-oscuro", "circulo" y "app-icon").
- `favicon/`  Favicon (.ico, .svg, .png) e íconos para móvil.

## Cuál usar y dónde
| Lugar | Archivo |
|---|---|
| Header / menú (fondo claro) | `svg/logo-horizontal.svg` |
| Header sobre fondo oscuro | `svg/logo-horizontal-blanco.svg` |
| Hero / sección centrada | `svg/logo-vertical.svg` (o `-blanco` sobre oscuro) |
| Footer oscuro con eslogan | `svg/logo-horizontal-fondo-oscuro.svg` |
| Imagen para compartir (redes) | `png/logo-vertical-fondo-oscuro-1200w.png` |
| Favicon | `favicon/favicon.ico` + `favicon/favicon.svg` |
| Ícono móvil | `favicon/apple-touch-icon.png`, `icon-192.png`, `icon-512.png` |

## Código para el <head>
```html
<link rel="icon" href="/favicon/favicon.ico" sizes="any">
<link rel="icon" href="/favicon/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png">
```

## Logo en el header
```html
<img src="/svg/logo-horizontal.svg" alt="TotalImport" height="40">
```

## Colores
- Azul marino: `#0F1B3D`
- Azul: `#2563EB` (en fondo oscuro: `#3B82F6`)
- Tagline claro: `#1F2A44` / sobre oscuro: `#8FA3C9`

Nota: los textos están convertidos a curvas, así que no hace falta instalar ninguna tipografía.
