# 3D Resume

A 3D resume where scrolling moves the camera. It was inspired by [sen-3d-resume](https://github.com/dayinji/sen-3d-resume), but the scene is built in code, so you don't need Blender or a GLB file.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/, deploy anywhere
```

## Make it yours
| What | Where |
|---|---|
| Name, role, links, resume entries | `src/data.ts` |
| Portfolio items (one markdown file each, with frontmatter) | `src/content/works/*.md` |
| Character look / eye tracking | `src/scene/Character.tsx` |
| Camera shots & object layout | `src/scene/layout.ts` |
| Camera damping / parallax | `src/scene/CameraRig.tsx` |
| Post-processing (DoF, bloom, vignette) | `src/scene/Scene.tsx` |

Each resume entry gets its own floating 3D object. When a card sits in the middle of the screen, the camera frames that object. You can add or remove entries and the camera path adjusts automatically.
